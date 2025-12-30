import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run monitors query and stats queries in parallel
    const [monitors, statsResult] = await Promise.all([
      // Query 1: Get user's monitors
      this.monitorRepository.find({
        where: { user: { id: userId } },
        select: ['id', 'paused'],
      }),

      // Query 2: Get all stats in a single optimized query
      this.checkResultRepository.query(
        `
        WITH user_monitors AS (
          SELECT id FROM monitor WHERE "userId" = $1
        ),
        check_stats AS (
          SELECT
            AVG(CASE WHEN cr."isUp" THEN 100 ELSE 0 END) as uptime,
            AVG(cr."responseTime") as avg_response_time,
            SUM(CASE WHEN cr."isUp" THEN 1 ELSE 0 END) as successful_checks,
            SUM(CASE WHEN cr."isUp" THEN 0 ELSE 1 END) as failed_checks
          FROM check_result cr
          WHERE cr."monitorId" IN (SELECT id FROM user_monitors)
            AND cr."createdAt" >= $2
        ),
        latest_status AS (
          SELECT DISTINCT ON (cr."monitorId")
            cr."monitorId",
            cr."isUp",
            cr."createdAt"
          FROM check_result cr
          WHERE cr."monitorId" IN (SELECT id FROM user_monitors)
          ORDER BY cr."monitorId", cr."createdAt" DESC
        ),
        down_monitors AS (
          SELECT "monitorId", "createdAt" as latest_down_at
          FROM latest_status
          WHERE "isUp" = false
        ),
        incident_start AS (
          SELECT
            dm."monitorId",
            MIN(cr."createdAt") as started_at
          FROM down_monitors dm
          JOIN check_result cr ON cr."monitorId" = dm."monitorId"
          WHERE cr."createdAt" >= $2
            AND cr."isUp" = false
            AND NOT EXISTS (
              SELECT 1 FROM check_result cr2
              WHERE cr2."monitorId" = cr."monitorId"
                AND cr2."createdAt" > cr."createdAt"
                AND cr2."createdAt" <= dm.latest_down_at
                AND cr2."isUp" = true
            )
          GROUP BY dm."monitorId"
        ),
        incident_counts AS (
          SELECT
            COUNT(*) as active_incidents,
            SUM(CASE WHEN EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000 >= 300000 THEN 1 ELSE 0 END) as critical_incidents,
            SUM(CASE WHEN EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000 < 300000 THEN 1 ELSE 0 END) as warning_incidents
          FROM incident_start
        )
        SELECT
          cs.uptime,
          cs.avg_response_time,
          cs.successful_checks,
          cs.failed_checks,
          COALESCE(ic.active_incidents, 0) as active_incidents,
          COALESCE(ic.critical_incidents, 0) as critical_incidents,
          COALESCE(ic.warning_incidents, 0) as warning_incidents
        FROM check_stats cs
        CROSS JOIN incident_counts ic
        `,
        [userId, last24Hours],
      ),
    ]);

    const totalMonitors = monitors.length;
    const activeMonitors = monitors.filter((m) => !m.paused).length;
    const pausedMonitors = monitors.filter((m) => m.paused).length;

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

    const stats = statsResult?.[0] || {};
    const overallUptime = stats.uptime
      ? parseFloat(parseFloat(stats.uptime).toFixed(2))
      : null;
    const avgResponseTime = stats.avg_response_time
      ? Math.round(parseFloat(stats.avg_response_time))
      : null;

    return {
      totalMonitors,
      activeMonitors,
      pausedMonitors,
      overallUptime,
      avgResponseTime,
      activeIncidents: parseInt(stats.active_incidents || '0', 10),
      criticalIncidents: parseInt(stats.critical_incidents || '0', 10),
      warningIncidents: parseInt(stats.warning_incidents || '0', 10),
      successfulChecks: parseInt(stats.successful_checks || '0', 10),
      failedChecks: parseInt(stats.failed_checks || '0', 10),
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
