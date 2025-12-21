import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from '@/dashboard/dashboard.service';
import { Monitor } from '@/monitor/monitor.entity';
import { CheckResult } from '@/check-result/check-result.entity';
import {
  AlertHistory,
  AlertStatus,
} from '@/alert/entities/alert-history.entity';
import { AlertSeverity } from '@/alert/entities/alert-rule.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let monitorRepository: any;
  let checkResultRepository: any;
  let alertHistoryRepository: any;

  const mockUserId = 'user-123';

  const mockMonitors = [
    { id: 'monitor-1', paused: false },
    { id: 'monitor-2', paused: false },
    { id: 'monitor-3', paused: true },
  ];

  const mockAlertHistory = [
    {
      id: 'alert-1',
      monitorId: 'monitor-1',
      status: AlertStatus.TRIGGERED,
      triggeredAt: new Date('2024-01-01T10:00:00Z'),
      resolvedAt: null,
      message: 'Monitor is down',
      monitor: { name: 'Test Monitor 1' },
      alertRule: { severity: AlertSeverity.CRITICAL },
    },
    {
      id: 'alert-2',
      monitorId: 'monitor-2',
      status: AlertStatus.RESOLVED,
      triggeredAt: new Date('2024-01-01T08:00:00Z'),
      resolvedAt: new Date('2024-01-01T09:00:00Z'),
      message: 'High latency detected',
      monitor: { name: 'Test Monitor 2' },
      alertRule: { severity: AlertSeverity.HIGH },
    },
  ];

  beforeEach(async () => {
    // Create mock query builder
    const createMockQueryBuilder = () => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
    });

    monitorRepository = {
      find: jest.fn(),
    };

    checkResultRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
    };

    alertHistoryRepository = {
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Monitor),
          useValue: monitorRepository,
        },
        {
          provide: getRepositoryToken(CheckResult),
          useValue: checkResultRepository,
        },
        {
          provide: getRepositoryToken(AlertHistory),
          useValue: alertHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getStats', () => {
    it('should return dashboard stats with monitors', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({
        uptime: '99.5',
        avgResponseTime: '245.5',
      });

      alertHistoryRepository.count.mockResolvedValue(2);

      const alertQb = alertHistoryRepository.createQueryBuilder();
      alertQb.getCount
        .mockResolvedValueOnce(1) // critical
        .mockResolvedValueOnce(1); // warning

      const result = await service.getStats(mockUserId);

      expect(result.totalMonitors).toBe(3);
      expect(result.activeMonitors).toBe(2);
      expect(result.pausedMonitors).toBe(1);
      expect(result.overallUptime).toBe(99.5);
      expect(result.avgResponseTime).toBe(246); // rounded
      expect(result.activeIncidents).toBe(2);
      expect(result.criticalIncidents).toBe(1);
      expect(result.warningIncidents).toBe(1);
    });

    it('should return zeros when user has no monitors', async () => {
      monitorRepository.find.mockResolvedValue([]);

      const result = await service.getStats(mockUserId);

      expect(result.totalMonitors).toBe(0);
      expect(result.activeMonitors).toBe(0);
      expect(result.pausedMonitors).toBe(0);
      expect(result.overallUptime).toBeNull();
      expect(result.avgResponseTime).toBeNull();
      expect(result.activeIncidents).toBe(0);
      expect(result.criticalIncidents).toBe(0);
      expect(result.warningIncidents).toBe(0);
    });

    it('should handle null uptime/response time from DB', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({
        uptime: null,
        avgResponseTime: null,
      });

      alertHistoryRepository.count.mockResolvedValue(0);

      const alertQb = alertHistoryRepository.createQueryBuilder();
      alertQb.getCount.mockResolvedValue(0);

      const result = await service.getStats(mockUserId);

      expect(result.overallUptime).toBeNull();
      expect(result.avgResponseTime).toBeNull();
    });
  });

  describe('getIncidents', () => {
    it('should return incidents sorted by latest', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);
      alertHistoryRepository.find.mockResolvedValue(mockAlertHistory);

      const result = await service.getIncidents(mockUserId, 10, 'latest');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('alert-1');
      expect(result[0].status).toBe('critical');
      expect(result[0].monitorName).toBe('Test Monitor 1');
      expect(result[1].status).toBe('resolved');
    });

    it('should return empty array when no monitors', async () => {
      monitorRepository.find.mockResolvedValue([]);

      const result = await service.getIncidents(mockUserId);

      expect(result).toEqual([]);
    });

    it('should calculate duration correctly for resolved incidents', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);
      alertHistoryRepository.find.mockResolvedValue([mockAlertHistory[1]]);

      const result = await service.getIncidents(mockUserId);

      // Duration should be 1 hour (3600000 ms)
      expect(result[0].duration).toBe(3600000);
    });

    it('should map severity to status correctly', async () => {
      const alerts = [
        {
          ...mockAlertHistory[0],
          alertRule: { severity: AlertSeverity.CRITICAL },
        },
        {
          ...mockAlertHistory[0],
          id: 'alert-3',
          alertRule: { severity: AlertSeverity.HIGH },
        },
        {
          ...mockAlertHistory[0],
          id: 'alert-4',
          alertRule: { severity: AlertSeverity.MEDIUM },
        },
        {
          ...mockAlertHistory[0],
          id: 'alert-5',
          alertRule: { severity: AlertSeverity.LOW },
        },
      ];

      monitorRepository.find.mockResolvedValue(mockMonitors);
      alertHistoryRepository.find.mockResolvedValue(alerts);

      const result = await service.getIncidents(mockUserId);

      expect(result[0].status).toBe('critical');
      expect(result[1].status).toBe('warning'); // HIGH maps to warning
      expect(result[2].status).toBe('warning'); // MEDIUM maps to warning
      expect(result[3].status).toBe('warning'); // LOW maps to warning
    });
  });

  describe('getNotifications', () => {
    it('should return notifications with unread count', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);
      alertHistoryRepository.find.mockResolvedValue(mockAlertHistory);

      const result = await service.getNotifications(mockUserId);

      expect(result.unread).toBe(1); // Only triggered alerts are unread
      expect(result.notifications).toHaveLength(2);
      expect(result.notifications[0].read).toBe(false); // triggered
      expect(result.notifications[1].read).toBe(true); // resolved
    });

    it('should return empty notifications when no monitors', async () => {
      monitorRepository.find.mockResolvedValue([]);

      const result = await service.getNotifications(mockUserId);

      expect(result.unread).toBe(0);
      expect(result.notifications).toEqual([]);
    });

    it('should limit notifications to 10', async () => {
      const manyAlerts = Array.from({ length: 15 }, (_, i) => ({
        ...mockAlertHistory[0],
        id: `alert-${i}`,
      }));

      monitorRepository.find.mockResolvedValue(mockMonitors);
      alertHistoryRepository.find.mockResolvedValue(manyAlerts);

      const result = await service.getNotifications(mockUserId);

      expect(result.notifications).toHaveLength(10);
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return hourly uptime data', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockTrends = [
        { hour: '2024-01-01T10:00:00Z', uptime: '100.00' },
        { hour: '2024-01-01T11:00:00Z', uptime: '98.50' },
        { hour: '2024-01-01T12:00:00Z', uptime: '99.25' },
      ];

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawMany.mockResolvedValue(mockTrends);

      const result = await service.getPerformanceTrends(mockUserId, 24);

      expect(result).toHaveLength(3);
      expect(result[0].uptime).toBe(100);
      expect(result[1].uptime).toBe(98.5);
      expect(result[2].uptime).toBe(99.25);
    });

    it('should return empty array when no monitors', async () => {
      monitorRepository.find.mockResolvedValue([]);

      const result = await service.getPerformanceTrends(mockUserId);

      expect(result).toEqual([]);
    });

    it('should use default 24 hours when not specified', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([]);

      await service.getPerformanceTrends(mockUserId);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'cr.createdAt >= :startTime',
        expect.objectContaining({
          startTime: expect.any(Date),
        }),
      );
    });
  });
});
