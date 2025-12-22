import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from '@/dashboard/dashboard.service';
import { Monitor } from '@/monitor/monitor.entity';
import { CheckResult } from '@/check-result/check-result.entity';
import {
  AlertHistory,
  AlertStatus,
} from '@/alert/entities/alert-history.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let monitorRepository: any;
  let checkResultRepository: any;
  let alertHistoryRepository: any;

  const mockUserId = 'user-123';

  const mockMonitors = [
    { id: 'monitor-1', name: 'Monitor 1', paused: false },
    { id: 'monitor-2', name: 'Monitor 2', paused: false },
    { id: 'monitor-3', name: 'Monitor 3', paused: true },
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
    },
    {
      id: 'alert-2',
      monitorId: 'monitor-2',
      status: AlertStatus.RESOLVED,
      triggeredAt: new Date('2024-01-01T08:00:00Z'),
      resolvedAt: new Date('2024-01-01T09:00:00Z'),
      message: 'High latency detected',
      monitor: { name: 'Test Monitor 2' },
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
      addOrderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getCount: jest.fn(),
    });

    monitorRepository = {
      find: jest.fn(),
    };

    checkResultRepository = {
      find: jest.fn(),
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
      // First call for uptime/avgResponseTime
      mockQb.getRawOne.mockResolvedValue({
        uptime: '99.5',
        avgResponseTime: '245.5',
      });
      // Second call for latest checks (all monitors are up)
      mockQb.getRawMany.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: true },
        { monitorId: 'monitor-2', isUp: true },
        { monitorId: 'monitor-3', isUp: true },
      ]);

      const result = await service.getStats(mockUserId);

      expect(result.totalMonitors).toBe(3);
      expect(result.activeMonitors).toBe(2);
      expect(result.pausedMonitors).toBe(1);
      expect(result.overallUptime).toBe(99.5);
      expect(result.avgResponseTime).toBe(246); // rounded
      expect(result.activeIncidents).toBe(0);
      expect(result.criticalIncidents).toBe(0);
      expect(result.warningIncidents).toBe(0);
    });

    it('should count active incidents from currently down monitors', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({
        uptime: '95.0',
        avgResponseTime: '300',
      });
      // One monitor is currently down
      mockQb.getRawMany.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: false },
        { monitorId: 'monitor-2', isUp: true },
        { monitorId: 'monitor-3', isUp: true },
      ]);

      // Mock the find call for incident duration check
      const now = new Date();
      checkResultRepository.find.mockResolvedValue([
        // Recent failures (walking back in time)
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 60000) },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 120000) },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 180000) },
      ]);

      const result = await service.getStats(mockUserId);

      expect(result.activeIncidents).toBe(1);
      expect(result.warningIncidents).toBe(1); // Down for < 5 min
      expect(result.criticalIncidents).toBe(0);
    });

    it('should count critical incidents for monitors down > 5 minutes', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawOne.mockResolvedValue({
        uptime: '90.0',
        avgResponseTime: '500',
      });
      mockQb.getRawMany.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: false },
      ]);

      const now = new Date();
      // Down for more than 5 minutes
      checkResultRepository.find.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 60000) },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 360000) }, // 6 min ago
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 420000) },
      ]);

      const result = await service.getStats(mockUserId);

      expect(result.activeIncidents).toBe(1);
      expect(result.criticalIncidents).toBe(1);
      expect(result.warningIncidents).toBe(0);
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
      mockQb.getRawMany.mockResolvedValue([]);

      const result = await service.getStats(mockUserId);

      expect(result.overallUptime).toBeNull();
      expect(result.avgResponseTime).toBeNull();
    });
  });

  describe('getIncidents', () => {
    it('should detect incidents from consecutive failures', async () => {
      monitorRepository.find.mockResolvedValue([
        { id: 'monitor-1', name: 'Monitor 1' },
      ]);

      const now = new Date();
      checkResultRepository.find.mockResolvedValue([
        // Ordered by createdAt ASC
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 300000), errorMessage: null },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 240000), errorMessage: 'Connection refused' },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 180000), errorMessage: 'Timeout' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 120000), errorMessage: null },
      ]);

      const result = await service.getIncidents(mockUserId, 10, 'latest');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('resolved');
      expect(result[0].monitorName).toBe('Monitor 1');
      expect(result[0].message).toBe('Connection refused'); // First error message
    });

    it('should mark ongoing incidents as warning or critical based on duration', async () => {
      monitorRepository.find.mockResolvedValue([
        { id: 'monitor-1', name: 'Monitor 1' },
      ]);

      const now = new Date();
      // Incident started 2 minutes ago and is still ongoing (warning)
      checkResultRepository.find.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 180000), errorMessage: null },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 120000), errorMessage: 'Down' },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 60000), errorMessage: 'Still down' },
      ]);

      const result = await service.getIncidents(mockUserId, 10, 'latest');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('warning');
      expect(result[0].resolvedAt).toBeNull();
    });

    it('should return empty array when no monitors', async () => {
      monitorRepository.find.mockResolvedValue([]);

      const result = await service.getIncidents(mockUserId);

      expect(result).toEqual([]);
    });

    it('should sort incidents by startedAt', async () => {
      monitorRepository.find.mockResolvedValue([
        { id: 'monitor-1', name: 'Monitor 1' },
        { id: 'monitor-2', name: 'Monitor 2' },
      ]);

      const now = new Date();
      checkResultRepository.find.mockResolvedValue([
        // Monitor 1: incident at -400000ms
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 400000), errorMessage: 'Down 1' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 300000), errorMessage: null },
        // Monitor 2: incident at -200000ms (more recent)
        { monitorId: 'monitor-2', isUp: false, createdAt: new Date(now.getTime() - 200000), errorMessage: 'Down 2' },
        { monitorId: 'monitor-2', isUp: true, createdAt: new Date(now.getTime() - 100000), errorMessage: null },
      ]);

      const result = await service.getIncidents(mockUserId, 10, 'latest');

      expect(result).toHaveLength(2);
      expect(result[0].monitorName).toBe('Monitor 2'); // More recent first
      expect(result[1].monitorName).toBe('Monitor 1');
    });

    it('should respect limit parameter', async () => {
      monitorRepository.find.mockResolvedValue([
        { id: 'monitor-1', name: 'Monitor 1' },
      ]);

      const now = new Date();
      // 5 incidents
      checkResultRepository.find.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 500000), errorMessage: 'Down' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 450000), errorMessage: null },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 400000), errorMessage: 'Down' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 350000), errorMessage: null },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 300000), errorMessage: 'Down' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 250000), errorMessage: null },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 200000), errorMessage: 'Down' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 150000), errorMessage: null },
        { monitorId: 'monitor-1', isUp: false, createdAt: new Date(now.getTime() - 100000), errorMessage: 'Down' },
        { monitorId: 'monitor-1', isUp: true, createdAt: new Date(now.getTime() - 50000), errorMessage: null },
      ]);

      const result = await service.getIncidents(mockUserId, 3, 'latest');

      expect(result).toHaveLength(3);
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
    it('should return hourly uptime and response time data', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitors);

      const mockTrends = [
        { hour: '2024-01-01T10:00:00Z', uptime: '100.00', avgResponseTime: '150.5' },
        { hour: '2024-01-01T11:00:00Z', uptime: '98.50', avgResponseTime: '200.3' },
        { hour: '2024-01-01T12:00:00Z', uptime: '99.25', avgResponseTime: null },
      ];

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawMany.mockResolvedValue(mockTrends);

      const result = await service.getPerformanceTrends(mockUserId, 24);

      expect(result).toHaveLength(3);
      expect(result[0].uptime).toBe(100);
      expect(result[0].avgResponseTime).toBe(151); // rounded
      expect(result[1].uptime).toBe(98.5);
      expect(result[1].avgResponseTime).toBe(200); // rounded
      expect(result[2].uptime).toBe(99.25);
      expect(result[2].avgResponseTime).toBeNull();
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

  describe('getMonitorStatuses', () => {
    const mockMonitorsWithDetails = [
      { id: 'monitor-1', name: 'API Server', url: 'https://api.example.com', paused: false, lastCheckedAt: new Date(), maxLatencyMs: 500 },
      { id: 'monitor-2', name: 'Web Server', url: 'https://web.example.com', paused: false, lastCheckedAt: new Date(), maxLatencyMs: 300 },
      { id: 'monitor-3', name: 'DB Server', url: 'https://db.example.com', paused: true, lastCheckedAt: null, maxLatencyMs: 1000 },
    ];

    it('should return monitor statuses with correct status types', async () => {
      monitorRepository.find.mockResolvedValue(mockMonitorsWithDetails);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: true, responseTime: 200, createdAt: new Date() },
        { monitorId: 'monitor-2', isUp: false, responseTime: 0, createdAt: new Date() },
      ]);

      const result = await service.getMonitorStatuses(mockUserId);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('up');
      expect(result[1].status).toBe('down');
      expect(result[2].status).toBe('paused');
    });

    it('should mark monitors as slow when response time exceeds threshold', async () => {
      monitorRepository.find.mockResolvedValue([mockMonitorsWithDetails[0]]);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: true, responseTime: 600, createdAt: new Date() }, // Above 500ms threshold
      ]);

      const result = await service.getMonitorStatuses(mockUserId);

      expect(result[0].status).toBe('slow');
    });

    it('should return empty array when no monitors', async () => {
      monitorRepository.find.mockResolvedValue([]);

      const result = await service.getMonitorStatuses(mockUserId);

      expect(result).toEqual([]);
    });

    it('should include response time and lastCheckedAt', async () => {
      const checkTime = new Date('2024-01-01T12:00:00Z');
      monitorRepository.find.mockResolvedValue([mockMonitorsWithDetails[0]]);

      const mockQb = checkResultRepository.createQueryBuilder();
      mockQb.getRawMany.mockResolvedValue([
        { monitorId: 'monitor-1', isUp: true, responseTime: 150, createdAt: checkTime },
      ]);

      const result = await service.getMonitorStatuses(mockUserId);

      expect(result[0].responseTime).toBe(150);
      expect(result[0].lastCheckedAt).toEqual(checkTime);
    });
  });
});
