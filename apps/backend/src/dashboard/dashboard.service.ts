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
} from './dto';

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
      };
    }

    const monitorIds = monitors.map((m) => m.id);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get uptime and response time stats from check results (last 24 hours)
    const checkStats = await this.checkResultRepository
      .createQueryBuilder('cr')
      .select('AVG(CASE WHEN cr.isUp THEN 100 ELSE 0 END)', 'uptime')
      .addSelect('AVG(cr.responseTime)', 'avgResponseTime')
      .where('cr.monitorId IN (:...monitorIds)', { monitorIds })
      .andWhere('cr.createdAt >= :last24Hours', { last24Hours })
      .getRawOne();

    const overallUptime = checkStats?.uptime
      ? parseFloat(parseFloat(checkStats.uptime).toFixed(2))
      : null;
    const avgResponseTime = checkStats?.avgResponseTime
      ? Math.round(parseFloat(checkStats.avgResponseTime))
      : null;

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

    for (const downMonitor of currentlyDownMonitors) {
      // Find when this incident started (first consecutive failure)
      const recentResults = await this.checkResultRepository.find({
        where: {
          monitorId: downMonitor.monitorId,
          createdAt: MoreThanOrEqual(last24Hours),
        },
        order: { createdAt: 'DESC' },
        take: 100,
      });

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

    return {
      totalMonitors,
      activeMonitors,
      pausedMonitors,
      overallUptime,
      avgResponseTime,
      activeIncidents,
      criticalIncidents,
      warningIncidents,
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

    // Get check results from the last 24 hours, ordered by monitor and time
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const checkResults = await this.checkResultRepository.find({
      where: {
        monitorId: In(monitorIds),
        createdAt: MoreThanOrEqual(last24Hours),
      },
      order: {
        monitorId: 'ASC',
        createdAt: 'ASC',
      },
    });

    // Group results by monitor
    const resultsByMonitor = new Map<string, typeof checkResults>();
    for (const result of checkResults) {
      const existing = resultsByMonitor.get(result.monitorId) || [];
      existing.push(result);
      resultsByMonitor.set(result.monitorId, existing);
    }

    // Detect incidents from consecutive failures
    const incidents: DashboardIncidentDto[] = [];

    for (const [monitorId, results] of resultsByMonitor) {
      let incidentStart: Date | null = null;
      let incidentFirstError: string | null = null;

      for (let i = 0; i < results.length; i++) {
        const current = results[i];
        const next = results[i + 1];

        if (!current.isUp && incidentStart === null) {
          // Start of a new incident
          incidentStart = current.createdAt;
          incidentFirstError = current.errorMessage || 'Monitor is down';
        }

        if (incidentStart !== null) {
          // Check if incident ends
          const isResolved = current.isUp;
          const isLastResult = !next;

          if (isResolved || isLastResult) {
            const resolvedAt = isResolved ? current.createdAt : null;
            const endTime = resolvedAt ? resolvedAt.getTime() : Date.now();
            const duration = endTime - incidentStart.getTime();

            // Determine severity based on duration
            // Critical if down for more than 5 minutes, warning otherwise
            const CRITICAL_THRESHOLD_MS = 5 * 60 * 1000;
            let status: 'critical' | 'warning' | 'resolved';
            if (isResolved) {
              status = 'resolved';
            } else if (duration >= CRITICAL_THRESHOLD_MS) {
              status = 'critical';
            } else {
              status = 'warning';
            }

            incidents.push({
              id: `${monitorId}-${incidentStart.getTime()}`,
              monitorId,
              monitorName: monitorMap.get(monitorId) || null,
              status,
              duration,
              startedAt: incidentStart,
              resolvedAt,
              message: incidentFirstError || 'Monitor was unreachable',
            });

            incidentStart = null;
            incidentFirstError = null;
          }
        }
      }
    }

    // Sort incidents
    incidents.sort((a, b) => {
      const timeA = a.startedAt.getTime();
      const timeB = b.startedAt.getTime();
      return sort === 'latest' ? timeB - timeA : timeA - timeB;
    });

    return incidents.slice(0, limit);
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
