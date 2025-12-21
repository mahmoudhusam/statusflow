import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Monitor } from '@/monitor/monitor.entity';
import { CheckResult } from '@/check-result/check-result.entity';
import {
  AlertHistory,
  AlertStatus,
} from '@/alert/entities/alert-history.entity';
import { AlertSeverity } from '@/alert/entities/alert-rule.entity';
import {
  DashboardStatsDto,
  DashboardIncidentDto,
  DashboardNotificationsDto,
  PerformanceTrendDto,
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

    // Get active incidents (triggered alerts)
    const activeIncidents = await this.alertHistoryRepository.count({
      where: {
        monitorId: In(monitorIds),
        status: AlertStatus.TRIGGERED,
      },
    });

    // Get critical incidents count
    const criticalIncidents = await this.alertHistoryRepository
      .createQueryBuilder('ah')
      .innerJoin('ah.alertRule', 'ar')
      .where('ah.monitorId IN (:...monitorIds)', { monitorIds })
      .andWhere('ah.status = :status', { status: AlertStatus.TRIGGERED })
      .andWhere('ar.severity = :severity', { severity: AlertSeverity.CRITICAL })
      .getCount();

    // Get warning incidents count (medium and high severity)
    const warningIncidents = await this.alertHistoryRepository
      .createQueryBuilder('ah')
      .innerJoin('ah.alertRule', 'ar')
      .where('ah.monitorId IN (:...monitorIds)', { monitorIds })
      .andWhere('ah.status = :status', { status: AlertStatus.TRIGGERED })
      .andWhere('ar.severity IN (:...severities)', {
        severities: [AlertSeverity.MEDIUM, AlertSeverity.HIGH],
      })
      .getCount();

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
    // Get user's monitor IDs
    const monitors = await this.monitorRepository.find({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (monitors.length === 0) {
      return [];
    }

    const monitorIds = monitors.map((m) => m.id);

    // Get recent alerts (both triggered and resolved)
    const alerts = await this.alertHistoryRepository.find({
      where: {
        monitorId: In(monitorIds),
      },
      relations: ['monitor', 'alertRule'],
      order: {
        triggeredAt: sort === 'latest' ? 'DESC' : 'ASC',
      },
      take: limit,
    });

    return alerts.map((alert) => {
      // Map severity to incident status
      let status: 'critical' | 'warning' | 'resolved';
      if (alert.status === AlertStatus.RESOLVED) {
        status = 'resolved';
      } else if (alert.alertRule?.severity === AlertSeverity.CRITICAL) {
        status = 'critical';
      } else {
        status = 'warning';
      }

      // Calculate duration
      const startTime = alert.triggeredAt.getTime();
      const endTime = alert.resolvedAt
        ? alert.resolvedAt.getTime()
        : Date.now();
      const duration = endTime - startTime;

      return {
        id: alert.id,
        monitorId: alert.monitorId ?? null,
        monitorName: alert.monitor?.name ?? null,
        status,
        duration,
        startedAt: alert.triggeredAt,
        resolvedAt: alert.resolvedAt ?? null,
        message: alert.message,
      };
    });
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
    // In a real implementation, you'd have a separate read/unread tracking
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

    // Get check results grouped by hour
    const results = await this.checkResultRepository
      .createQueryBuilder('cr')
      .select("DATE_TRUNC('hour', cr.createdAt)", 'hour')
      .addSelect('AVG(CASE WHEN cr.isUp THEN 100 ELSE 0 END)', 'uptime')
      .where('cr.monitorId IN (:...monitorIds)', { monitorIds })
      .andWhere('cr.createdAt >= :startTime', { startTime })
      .groupBy("DATE_TRUNC('hour', cr.createdAt)")
      .orderBy('hour', 'ASC')
      .getRawMany();

    return results.map((row) => ({
      timestamp: new Date(row.hour),
      uptime: parseFloat(parseFloat(row.uptime).toFixed(2)),
    }));
  }
}
