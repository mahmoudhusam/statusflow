import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Monitor } from '@/monitor/monitor.entity';
import { CheckResult } from '@/check-result/check-result.entity';
import {
  AlertHistory,
  AlertStatus,
} from '@/alert/entities/alert-history.entity';
import {
  DashboardStatsDto,
  DashboardIncidentDto,
  DashboardNotificationsDto,
  PerformanceTrendDto,
  MonitorStatusDto,
  MonitorStatusType,
} from '@/dashboard/dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(CheckResult)
    private readonly checkResultRepository: Repository<CheckResult>,
    @InjectRepository(AlertHistory)
    private readonly alertHistoryRepository: Repository<AlertHistory>,
  ) {}

  async getStats(userId: string): Promise<DashboardStatsDto> {
    // Get user's monitors
    const monitors = await this.monitorRepository.find({
      where: { user: { id: userId } },
      select: ['id', 'paused'],
    });

    const totalMonitors = monitors.length;
    const activeMonitors = monitors.filter((m) => !m.paused).length;
    const pausedMonitors = monitors.filter((m) => m.paused).length;

    // If no monitors, return early with zeros
    if (totalMonitors === 0) {
      return {
        totalMonitors: 0,
        activeMonitors: 0,
        pausedMonitors: 0,
        overallUptime: null,
        avgResponseTime: null,
        activeIncidents: 0,
        criticalIncidents: 0,
        warningIncidents: 0,
        successfulChecks: 0,
        failedChecks: 0,
      };
    }

    const monitorIds = monitors.map((m) => m.id);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get uptime, response time, and check counts from check results (last 24 hours)
    const checkStats = await this.checkResultRepository
      .createQueryBuilder('cr')
      .select('AVG(CASE WHEN cr.isUp THEN 100 ELSE 0 END)', 'uptime')
      .addSelect('AVG(cr.responseTime)', 'avgResponseTime')
      .addSelect('SUM(CASE WHEN cr.isUp THEN 1 ELSE 0 END)', 'successfulChecks')
      .addSelect('SUM(CASE WHEN cr.isUp THEN 0 ELSE 1 END)', 'failedChecks')
      .where('cr.monitorId IN (:...monitorIds)', { monitorIds })
      .andWhere('cr.createdAt >= :last24Hours', { last24Hours })
      .getRawOne();

    const overallUptime = checkStats?.uptime
      ? parseFloat(parseFloat(checkStats.uptime).toFixed(2))
      : null;
    const avgResponseTime = checkStats?.avgResponseTime
      ? Math.round(parseFloat(checkStats.avgResponseTime))
      : null;
    const successfulChecks = checkStats?.successfulChecks
      ? parseInt(checkStats.successfulChecks, 10)
      : 0;
    const failedChecks = checkStats?.failedChecks
      ? parseInt(checkStats.failedChecks, 10)
      : 0;

    // Get active incidents by checking which monitors are currently down
    // A monitor is "currently down" if its most recent check result is isUp = false
    const latestChecks = await this.checkResultRepository
      .createQueryBuilder('cr')
      .select('DISTINCT ON (cr.monitorId) cr.*')
      .where('cr.monitorId IN (:...monitorIds)', { monitorIds })
      .orderBy('cr.monitorId', 'ASC')
      .addOrderBy('cr.createdAt', 'DESC')
      .getRawMany();

    // Count monitors that are currently down
    const currentlyDownMonitors = latestChecks.filter((cr) => !cr.isUp);
    const activeIncidents = currentlyDownMonitors.length;

    // Critical = down for more than 5 minutes (check if first failure was > 5 min ago)
    const CRITICAL_THRESHOLD_MS = 5 * 60 * 1000;
    let criticalIncidents = 0;
    let warningIncidents = 0;

    if (currentlyDownMonitors.length > 0) {
      // OPTIMIZATION: Batch fetch all recent results for down monitors in ONE query
      const downMonitorIds = currentlyDownMonitors.map((m) => m.monitorId);
      const allRecentResults = await this.checkResultRepository.find({
        where: {
          monitorId: In(downMonitorIds),
          createdAt: MoreThanOrEqual(last24Hours),
        },
        order: { monitorId: 'ASC', createdAt: 'DESC' },
      });

      // Group results by monitorId
      const resultsByMonitor = new Map<string, CheckResult[]>();
      for (const result of allRecentResults) {
        const existing = resultsByMonitor.get(result.monitorId) || [];
        existing.push(result);
        resultsByMonitor.set(result.monitorId, existing);
      }

      // Classify each incident
      for (const downMonitor of currentlyDownMonitors) {
        const recentResults = resultsByMonitor.get(downMonitor.monitorId) || [];

        // Find when the current downtime started (walk back until we find an 'up')
        let incidentStart: Date | null = null;
        for (const result of recentResults) {
          if (result.isUp) {
            break;
          }
          incidentStart = result.createdAt;
        }

        if (incidentStart) {
          const duration = Date.now() - incidentStart.getTime();
          if (duration >= CRITICAL_THRESHOLD_MS) {
            criticalIncidents++;
          } else {
            warningIncidents++;
          }
        } else {
          // Been down for entire period, count as critical
          criticalIncidents++;
        }
      }
    }

    return {
      totalMonitors,
      activeMonitors,
      pausedMonitors,
      overallUptime,
      avgResponseTime,
      activeIncidents,
      criticalIncidents,
      warningIncidents,
      successfulChecks,
      failedChecks,
    };
  }

  async getIncidents(
    userId: string,
    limit: number = 10,
    sort: 'latest' | 'oldest' = 'latest',
  ): Promise<DashboardIncidentDto[]> {
    // Get user's monitors with names
    const monitors = await this.monitorRepository.find({
      where: { user: { id: userId } },
      select: ['id', 'name'],
    });

    if (monitors.length === 0) {
      return [];
    }

    const monitorIds = monitors.map((m) => m.id);
    const monitorMap = new Map(monitors.map((m) => [m.id, m.name]));
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sortOrder = sort === 'latest' ? 'DESC' : 'ASC';

    // Use SQL window functions to detect incidents directly in the database
    // This avoids fetching thousands of rows and processing in JS
    const incidents = await this.checkResultRepository.query(
      `
      WITH status_changes AS (
        -- Mark rows where status changed from previous row
        SELECT
          cr."monitorId",
          cr."createdAt",
          cr."isUp",
          cr."errorMessage",
          LAG(cr."isUp") OVER (PARTITION BY cr."monitorId" ORDER BY cr."createdAt") as prev_is_up
        FROM check_result cr
        WHERE cr."monitorId" = ANY($1)
          AND cr."createdAt" >= $2
      ),
      incident_boundaries AS (
        -- Identify incident start points (transition from up/null to down)
        SELECT
          "monitorId",
          "createdAt" as started_at,
          "errorMessage",
          ROW_NUMBER() OVER (PARTITION BY "monitorId" ORDER BY "createdAt") as incident_num
        FROM status_changes
        WHERE "isUp" = false AND (prev_is_up = true OR prev_is_up IS NULL)
      ),
      incident_ends AS (
        -- Identify incident end points (transition from down to up)
        SELECT
          "monitorId",
          "createdAt" as resolved_at,
          ROW_NUMBER() OVER (PARTITION BY "monitorId" ORDER BY "createdAt") as resolution_num
        FROM status_changes
        WHERE "isUp" = true AND prev_is_up = false
      ),
      latest_status AS (
        -- Get the latest status for each monitor to detect ongoing incidents
        SELECT DISTINCT ON ("monitorId")
          "monitorId",
          "isUp" as latest_is_up,
          "createdAt" as latest_check
        FROM check_result
        WHERE "monitorId" = ANY($1)
        ORDER BY "monitorId", "createdAt" DESC
      )
      SELECT
        ib."monitorId",
        ib.started_at,
        ib."errorMessage",
        ie.resolved_at,
        CASE
          WHEN ie.resolved_at IS NOT NULL THEN 'resolved'
          WHEN ls.latest_is_up = false AND EXTRACT(EPOCH FROM (NOW() - ib.started_at)) * 1000 >= 300000 THEN 'critical'
          WHEN ls.latest_is_up = false THEN 'warning'
          ELSE 'resolved'
        END as status,
        CASE
          WHEN ie.resolved_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ie.resolved_at - ib.started_at)) * 1000
          ELSE EXTRACT(EPOCH FROM (NOW() - ib.started_at)) * 1000
        END as duration
      FROM incident_boundaries ib
      LEFT JOIN incident_ends ie
        ON ib."monitorId" = ie."monitorId"
        AND ie.resolution_num = ib.incident_num
      LEFT JOIN latest_status ls
        ON ib."monitorId" = ls."monitorId"
      ORDER BY ib.started_at ${sortOrder}
      LIMIT $3
      `,
      [monitorIds, last24Hours, limit],
    );

    return incidents.map(
      (row: {
        monitorId: string;
        started_at: Date;
        errorMessage: string | null;
        resolved_at: Date | null;
        status: 'critical' | 'warning' | 'resolved';
        duration: number;
      }) => ({
        id: `${row.monitorId}-${new Date(row.started_at).getTime()}`,
        monitorId: row.monitorId,
        monitorName: monitorMap.get(row.monitorId) || null,
        status: row.status,
        duration: Math.round(row.duration),
        startedAt: new Date(row.started_at),
        resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
        message: row.errorMessage || 'Monitor was unreachable',
      }),
    );
  }

  async getNotifications(userId: string): Promise<DashboardNotificationsDto> {
    // Get user's monitor IDs
    const monitors = await this.monitorRepository.find({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (monitors.length === 0) {
      return {
        unread: 0,
        notifications: [],
      };
    }

    const monitorIds = monitors.map((m) => m.id);

    // Get recent alerts as notifications (last 50)
    const alerts = await this.alertHistoryRepository.find({
      where: {
        monitorId: In(monitorIds),
      },
      relations: ['monitor'],
      order: {
        triggeredAt: 'DESC',
      },
      take: 50,
    });

    // For now, treat all triggered alerts as "unread" and resolved as "read"
    // In a real implementation, i will separate read/unread tracking
    const unreadCount = alerts.filter(
      (a) => a.status === AlertStatus.TRIGGERED,
    ).length;

    const notifications = alerts.slice(0, 10).map((alert) => ({
      id: alert.id,
      type: 'alert' as const,
      message: alert.message,
      read: alert.status !== AlertStatus.TRIGGERED,
      createdAt: alert.triggeredAt,
    }));

    return {
      unread: unreadCount,
      notifications,
    };
  }

  async getPerformanceTrends(
    userId: string,
    hours: number = 24,
  ): Promise<PerformanceTrendDto[]> {
    // Get user's monitor IDs
    const monitors = await this.monitorRepository.find({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (monitors.length === 0) {
      return [];
    }

    const monitorIds = monitors.map((m) => m.id);
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get check results grouped by hour, including response time
    const results = await this.checkResultRepository
      .createQueryBuilder('cr')
      .select("DATE_TRUNC('hour', cr.createdAt)", 'hour')
      .addSelect('AVG(CASE WHEN cr.isUp THEN 100 ELSE 0 END)', 'uptime')
      .addSelect('AVG(cr.responseTime)', 'avgResponseTime')
      .where('cr.monitorId IN (:...monitorIds)', { monitorIds })
      .andWhere('cr.createdAt >= :startTime', { startTime })
      .groupBy("DATE_TRUNC('hour', cr.createdAt)")
      .orderBy('hour', 'ASC')
      .getRawMany();

    return results.map((row) => ({
      timestamp: new Date(row.hour),
      uptime: parseFloat(parseFloat(row.uptime).toFixed(2)),
      avgResponseTime: row.avgResponseTime
        ? Math.round(parseFloat(row.avgResponseTime))
        : null,
    }));
  }

  async getMonitorStatuses(userId: string): Promise<MonitorStatusDto[]> {
    // Get user's monitors
    const monitors = await this.monitorRepository.find({
      where: { user: { id: userId } },
      select: ['id', 'name', 'url', 'paused', 'lastCheckedAt', 'maxLatencyMs'],
    });

    if (monitors.length === 0) {
      return [];
    }

    const monitorIds = monitors.map((m) => m.id);

    // Get the latest check result for each monitor
    const latestChecks = await this.checkResultRepository
      .createQueryBuilder('cr')
      .select('DISTINCT ON (cr.monitorId) cr.*')
      .where('cr.monitorId IN (:...monitorIds)', { monitorIds })
      .orderBy('cr.monitorId', 'ASC')
      .addOrderBy('cr.createdAt', 'DESC')
      .getRawMany();

    // Create a map of monitorId -> latest check
    const checkMap = new Map(
      latestChecks.map((c) => [c.monitorId, c]),
    );

    return monitors.map((monitor) => {
      const latestCheck = checkMap.get(monitor.id);

      let status: MonitorStatusType;
      if (monitor.paused) {
        status = 'paused';
      } else if (!latestCheck) {
        status = 'paused'; // No checks yet, treat as paused
      } else if (!latestCheck.isUp) {
        status = 'down';
      } else if (latestCheck.responseTime > monitor.maxLatencyMs) {
        status = 'slow';
      } else {
        status = 'up';
      }

      return {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        status,
        lastCheckedAt: latestCheck?.createdAt
          ? new Date(latestCheck.createdAt)
          : null,
        responseTime: latestCheck?.responseTime ?? null,
      };
    });
  }
}
