import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '@/dashboard/dashboard.controller';
import { DashboardService } from '@/dashboard/dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockUserId = 'user-123';

  const mockStats = {
    totalMonitors: 5,
    activeMonitors: 4,
    pausedMonitors: 1,
    overallUptime: 99.5,
    avgResponseTime: 245,
    activeIncidents: 2,
    criticalIncidents: 1,
    warningIncidents: 1,
    successfulChecks: 1200,
    failedChecks: 10,
  };

  const mockIncidents = [
    {
      id: 'incident-1',
      monitorId: 'monitor-1',
      monitorName: 'API Server',
      status: 'critical' as const,
      duration: 3600000,
      startedAt: new Date('2024-01-01T10:00:00Z'),
      resolvedAt: null,
      message: 'Monitor is down',
    },
    {
      id: 'incident-2',
      monitorId: 'monitor-2',
      monitorName: 'Web Server',
      status: 'resolved' as const,
      duration: 1800000,
      startedAt: new Date('2024-01-01T08:00:00Z'),
      resolvedAt: new Date('2024-01-01T08:30:00Z'),
      message: 'High latency detected',
    },
  ];

  const mockNotifications = {
    unread: 3,
    notifications: [
      {
        id: 'notif-1',
        type: 'alert' as const,
        message: 'Monitor API Server is down',
        read: false,
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'notif-2',
        type: 'alert' as const,
        message: 'Monitor Web Server recovered',
        read: true,
        createdAt: new Date('2024-01-01T09:00:00Z'),
      },
    ],
  };

  const mockPerformanceTrends = [
    { timestamp: new Date('2024-01-01T10:00:00Z'), uptime: 100, avgResponseTime: 150 },
    { timestamp: new Date('2024-01-01T11:00:00Z'), uptime: 98.5, avgResponseTime: 200 },
    { timestamp: new Date('2024-01-01T12:00:00Z'), uptime: 99.25, avgResponseTime: null },
  ];

  beforeEach(async () => {
    const mockDashboardService = {
      getStats: jest.fn(),
      getIncidents: jest.fn(),
      getNotifications: jest.fn(),
      getPerformanceTrends: jest.fn(),
      getMonitorStatuses: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  describe('GET /dashboard/stats', () => {
    it('should return dashboard stats wrapped in success response', async () => {
      jest.spyOn(service, 'getStats').mockResolvedValue(mockStats);

      const result = await controller.getStats(mockUserId);

      expect(service.getStats).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        success: true,
        data: mockStats,
      });
    });

    it('should handle empty stats (no monitors)', async () => {
      const emptyStats = {
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

      jest.spyOn(service, 'getStats').mockResolvedValue(emptyStats);

      const result = await controller.getStats(mockUserId);

      expect(result).toEqual({
        success: true,
        data: emptyStats,
      });
    });
  });

  describe('GET /dashboard/incidents', () => {
    it('should return incidents with default parameters', async () => {
      jest.spyOn(service, 'getIncidents').mockResolvedValue(mockIncidents);

      const result = await controller.getIncidents(mockUserId);

      expect(service.getIncidents).toHaveBeenCalledWith(
        mockUserId,
        10,
        'latest',
      );
      expect(result).toEqual({
        success: true,
        data: mockIncidents,
      });
    });

    it('should pass custom limit and sort parameters', async () => {
      jest.spyOn(service, 'getIncidents').mockResolvedValue(mockIncidents);

      const result = await controller.getIncidents(mockUserId, '5', 'oldest');

      expect(service.getIncidents).toHaveBeenCalledWith(
        mockUserId,
        5,
        'oldest',
      );
      expect(result).toEqual({
        success: true,
        data: mockIncidents,
      });
    });

    it('should default to latest sort for invalid sort value', async () => {
      jest.spyOn(service, 'getIncidents').mockResolvedValue(mockIncidents);

      const result = await controller.getIncidents(
        mockUserId,
        '10',
        'invalid' as any,
      );

      expect(service.getIncidents).toHaveBeenCalledWith(
        mockUserId,
        10,
        'latest',
      );
    });

    it('should return empty array when no incidents', async () => {
      jest.spyOn(service, 'getIncidents').mockResolvedValue([]);

      const result = await controller.getIncidents(mockUserId);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('GET /dashboard/notifications', () => {
    it('should return notifications with unread count', async () => {
      jest
        .spyOn(service, 'getNotifications')
        .mockResolvedValue(mockNotifications);

      const result = await controller.getNotifications(mockUserId);

      expect(service.getNotifications).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        success: true,
        data: mockNotifications,
      });
    });

    it('should return empty notifications when none exist', async () => {
      const emptyNotifications = {
        unread: 0,
        notifications: [],
      };

      jest
        .spyOn(service, 'getNotifications')
        .mockResolvedValue(emptyNotifications);

      const result = await controller.getNotifications(mockUserId);

      expect(result).toEqual({
        success: true,
        data: emptyNotifications,
      });
    });
  });

  describe('GET /dashboard/performance-trends', () => {
    it('should return performance trends with default hours', async () => {
      jest
        .spyOn(service, 'getPerformanceTrends')
        .mockResolvedValue(mockPerformanceTrends);

      const result = await controller.getPerformanceTrends(mockUserId);

      expect(service.getPerformanceTrends).toHaveBeenCalledWith(mockUserId, 24);
      expect(result).toEqual({
        success: true,
        data: mockPerformanceTrends,
      });
    });

    it('should pass custom hours parameter', async () => {
      jest
        .spyOn(service, 'getPerformanceTrends')
        .mockResolvedValue(mockPerformanceTrends);

      const result = await controller.getPerformanceTrends(mockUserId, '48');

      expect(service.getPerformanceTrends).toHaveBeenCalledWith(mockUserId, 48);
      expect(result).toEqual({
        success: true,
        data: mockPerformanceTrends,
      });
    });

    it('should return empty array when no data', async () => {
      jest.spyOn(service, 'getPerformanceTrends').mockResolvedValue([]);

      const result = await controller.getPerformanceTrends(mockUserId);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });

  describe('GET /dashboard/monitor-statuses', () => {
    const mockMonitorStatuses = [
      {
        id: 'monitor-1',
        name: 'API Server',
        url: 'https://api.example.com',
        status: 'up' as const,
        lastCheckedAt: new Date('2024-01-01T12:00:00Z'),
        responseTime: 150,
      },
      {
        id: 'monitor-2',
        name: 'Web Server',
        url: 'https://web.example.com',
        status: 'down' as const,
        lastCheckedAt: new Date('2024-01-01T12:00:00Z'),
        responseTime: null,
      },
    ];

    it('should return monitor statuses wrapped in success response', async () => {
      jest
        .spyOn(service, 'getMonitorStatuses')
        .mockResolvedValue(mockMonitorStatuses);

      const result = await controller.getMonitorStatuses(mockUserId);

      expect(service.getMonitorStatuses).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        success: true,
        data: mockMonitorStatuses,
      });
    });

    it('should return empty array when no monitors', async () => {
      jest.spyOn(service, 'getMonitorStatuses').mockResolvedValue([]);

      const result = await controller.getMonitorStatuses(mockUserId);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });
});
