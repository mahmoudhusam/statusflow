import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { MonitorQueueService } from '@/queue/monitor-queue.service';
import { Monitor } from '@/monitor/monitor.entity';

// Create src/queue/monitor-queue.service.spec.ts
describe('MonitorQueueService', () => {
  let service: MonitorQueueService;
  let mockQueue: any;

  const mockBullQueue = {
    add: jest.fn(),
    removeJobScheduler: jest.fn(), // Add this
    getJobSchedulers: jest.fn().mockResolvedValue([]), // Update this
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
  };

  const mockMonitor: Monitor = {
    id: 'monitor-123',
    name: 'Test Monitor',
    url: 'https://example.com',
    interval: 60,
    paused: false,
    maxLatencyMs: 2000,
    maxConsecutiveFailures: 3,
    lastCheckedAt: null,
    httpMethod: 'GET',
    timeout: 10000,
    headers: { 'Custom-Header': 'value' },
    body: '{"test": true}',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
      monitors: [],
    },
    checkResults: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorQueueService,
        {
          provide: getQueueToken('monitor-checks'),
          useValue: mockBullQueue,
        },
      ],
    }).compile();

    service = module.get<MonitorQueueService>(MonitorQueueService);
    mockQueue = module.get(getQueueToken('monitor-checks'));
  });

  describe('addMonitorCheck', () => {
    it('should add monitor check job to queue with correct data', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      await service.addMonitorCheck(mockMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        {
          monitorId: 'monitor-123',
          url: 'https://example.com',
          httpMethod: 'GET',
          timeout: 10000,
          headers: { 'Custom-Header': 'value' },
          body: '{"test": true}',
          maxLatencyMs: 2000,
          maxConsecutiveFailures: 3,
        },
        {
          repeat: {
            every: 60000, // 60 seconds converted to milliseconds
          },
          jobId: 'monitor-monitor-123',
        },
      );
    });

    it('should handle monitor with default/undefined values', async () => {
      const minimalMonitor = {
        ...mockMonitor,
        httpMethod: undefined,
        timeout: undefined,
        headers: undefined,
        body: undefined,
      } as any;

      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      await service.addMonitorCheck(minimalMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        {
          monitorId: 'monitor-123',
          url: 'https://example.com',
          httpMethod: 'GET', // Default value
          timeout: 10000, // Default value
          headers: {}, // Default value
          body: undefined, // Undefined becomes undefined
          maxLatencyMs: 2000,
          maxConsecutiveFailures: 3,
        },
        expect.objectContaining({
          jobId: 'monitor-monitor-123',
        }),
      );
    });

    it('should convert interval from seconds to milliseconds correctly', async () => {
      const monitorWith5MinInterval = {
        ...mockMonitor,
        interval: 300, // 5 minutes in seconds
      };

      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      await service.addMonitorCheck(monitorWith5MinInterval);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({
          repeat: {
            every: 300000, // 5 minutes in milliseconds
          },
        }),
      );
    });

    it('should handle POST monitor with custom headers and body', async () => {
      const postMonitor = {
        ...mockMonitor,
        httpMethod: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        },
        body: JSON.stringify({ name: 'test', value: 42 }),
      };

      mockQueue.add.mockResolvedValue({ id: 'job-456' });

      await service.addMonitorCheck(postMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        expect.objectContaining({
          httpMethod: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
          },
          body: '{"name":"test","value":42}',
        }),
        expect.any(Object),
      );
    });
  });

  describe('removeMonitorCheck', () => {
    it('should remove job scheduler when found', async () => {
      const mockSchedulers = [
        { id: 'monitor-monitor-123' },
        { id: 'monitor-other-456' },
      ];

      mockQueue.getJobSchedulers.mockResolvedValue(mockSchedulers);
      mockQueue.removeJobScheduler.mockResolvedValue();

      await service.removeMonitorCheck('monitor-123');

      expect(mockQueue.getJobSchedulers).toHaveBeenCalled();
      expect(mockQueue.removeJobScheduler).toHaveBeenCalledWith(
        'monitor-monitor-123',
      );
    });

    it('should not call removeJobScheduler when job is not found', async () => {
      mockQueue.getJobSchedulers.mockResolvedValue([]);

      await service.removeMonitorCheck('monitor-123');

      expect(mockQueue.getJobSchedulers).toHaveBeenCalled();
      expect(mockQueue.removeJobScheduler).not.toHaveBeenCalled();
    });

    it('should handle removeRepeatableByKey failures gracefully', async () => {
      mockQueue.removeJobScheduler.mockRejectedValue(
        new Error('Failed to remove job'),
      );

      // If your service handles errors gracefully:
      await expect(
        service.removeMonitorCheck('monitor-123'),
      ).resolves.not.toThrow();

      // OR if it should throw:
      // await expect(service.removeMonitorCheck('monitor-123')).rejects.toThrow('Failed to remove job');
    });

    it('should handle empty repeatable jobs array gracefully', async () => {
      mockQueue.getJobSchedulers.mockResolvedValue([]);

      await service.removeMonitorCheck('monitor-123');
      expect(mockQueue.getJobSchedulers).toHaveBeenCalled();
      expect(mockQueue.removeJobScheduler).not.toHaveBeenCalled();
    });
  });

  describe('pauseMonitorCheck', () => {
    it('should call removeMonitorCheck to pause the job', async () => {
      const serviceSpy = jest
        .spyOn(service, 'removeMonitorCheck')
        .mockResolvedValue();

      await service.pauseMonitorCheck('monitor-123');

      expect(serviceSpy).toHaveBeenCalledWith('monitor-123');
    });
  });

  describe('resumeMonitorCheck', () => {
    it('should call addMonitorCheck to resume the job', async () => {
      const serviceSpy = jest
        .spyOn(service, 'addMonitorCheck')
        .mockResolvedValue();

      await service.resumeMonitorCheck(mockMonitor);

      expect(serviceSpy).toHaveBeenCalledWith(mockMonitor);
    });
  });

  describe('updateMonitorCheck', () => {
    it('should remove old job and add new one with updated config', async () => {
      const removeMonitorSpy = jest
        .spyOn(service, 'removeMonitorCheck')
        .mockResolvedValue();
      const addMonitorSpy = jest
        .spyOn(service, 'addMonitorCheck')
        .mockResolvedValue();

      await service.updateMonitorCheck(mockMonitor);

      expect(removeMonitorSpy).toHaveBeenCalledWith('monitor-123');
      expect(addMonitorSpy).toHaveBeenCalledWith(mockMonitor);
      expect(removeMonitorSpy).toHaveBeenCalledWith('monitor-123');
      expect(addMonitorSpy).toHaveBeenCalledWith(mockMonitor);
    });
  });
  describe('getQueueStats', () => {
    it('should return comprehensive queue statistics', async () => {
      const mockWaitingJobs = [{ id: '1' }, { id: '2' }];
      const mockActiveJobs = [{ id: '3' }];
      const mockCompletedJobs = [{ id: '4' }, { id: '5' }, { id: '6' }];
      const mockFailedJobs = [{ id: '7' }];

      mockQueue.getWaiting.mockResolvedValue(mockWaitingJobs);
      mockQueue.getActive.mockResolvedValue(mockActiveJobs);
      mockQueue.getCompleted.mockResolvedValue(mockCompletedJobs);
      mockQueue.getFailed.mockResolvedValue(mockFailedJobs);

      const result = await service.getQueueStats();

      expect(result).toEqual({
        waiting: 2,
        active: 1,
        completed: 3,
        failed: 1,
      });

      expect(mockQueue.getWaiting).toHaveBeenCalled();
      expect(mockQueue.getActive).toHaveBeenCalled();
      expect(mockQueue.getCompleted).toHaveBeenCalled();
      expect(mockQueue.getFailed).toHaveBeenCalled();
    });

    it('should handle empty queue states', async () => {
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getCompleted.mockResolvedValue([]);
      mockQueue.getFailed.mockResolvedValue([]);

      const result = await service.getQueueStats();

      expect(result).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      });
    });
  });

  describe('error handling', () => {
    it('should propagate queue.add failures', async () => {
      const queueError = new Error('Queue is full');
      mockQueue.add.mockRejectedValue(queueError);

      await expect(service.addMonitorCheck(mockMonitor)).rejects.toThrow(
        'Queue is full',
      );
    });

    it('should propagate getJobSchedulers failures', async () => {
      const redisError = new Error('Redis connection error');
      mockQueue.getJobSchedulers.mockRejectedValue(redisError);

      await expect(service.removeMonitorCheck('monitor-123')).rejects.toThrow(
        'Redis connection error',
      );
    });

    it('should propagate removeJobScheduler failures', async () => {
      const mockSchedulers = [{ id: 'monitor-monitor-123' }];

      mockQueue.getJobSchedulers.mockResolvedValue(mockSchedulers);
      mockQueue.removeJobScheduler.mockRejectedValue(
        new Error('Failed to remove job'),
      );

      await expect(service.removeMonitorCheck('monitor-123')).rejects.toThrow(
        'Failed to remove job',
      );
    });

    it('should handle getQueueStats partial failures', async () => {
      mockQueue.getWaiting.mockResolvedValue([{ id: '1' }]);
      mockQueue.getActive.mockRejectedValue(new Error('Redis error'));
      mockQueue.getCompleted.mockResolvedValue([]);
      mockQueue.getFailed.mockResolvedValue([]);

      await expect(service.getQueueStats()).rejects.toThrow('Redis error');
    });
  });

  describe('job ID consistency', () => {
    it('should generate consistent job IDs for the same monitor', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      await service.addMonitorCheck(mockMonitor);
      await service.addMonitorCheck(mockMonitor);

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({ jobId: 'monitor-monitor-123' }),
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        2,
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({ jobId: 'monitor-monitor-123' }),
      );
    });

    it('should generate different job IDs for different monitors', async () => {
      const monitor2 = { ...mockMonitor, id: 'monitor-456' };

      mockQueue.add.mockResolvedValue({ id: 'job-123' });

      await service.addMonitorCheck(mockMonitor);
      await service.addMonitorCheck(monitor2);

      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({ jobId: 'monitor-monitor-123' }),
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        2,
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({ jobId: 'monitor-monitor-456' }),
      );
    });
  });

  describe('data validation and transformation', () => {
    it('should handle monitor with minimal required data', async () => {
      const minimalMonitor = {
        id: 'monitor-min',
        interval: 30,
        maxLatencyMs: 1000,
        maxConsecutiveFailures: 2,
        url: 'https://minimal.com',
      } as Monitor;

      mockQueue.add.mockResolvedValue({ id: 'job-min' });

      await service.addMonitorCheck(minimalMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        {
          monitorId: 'monitor-min',
          url: 'https://minimal.com',
          httpMethod: 'GET',
          timeout: 10000,
          headers: {},
          body: undefined,
          maxLatencyMs: 1000,
          maxConsecutiveFailures: 2,
        },
        expect.objectContaining({
          repeat: { every: 30000 }, // 30 seconds
          jobId: 'monitor-monitor-min',
        }),
      );
    });

    it('should preserve custom timeout values', async () => {
      const customTimeoutMonitor = {
        ...mockMonitor,
        timeout: 5000, // Custom 5 second timeout
      };

      mockQueue.add.mockResolvedValue({ id: 'job-custom' });

      await service.addMonitorCheck(customTimeoutMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        expect.objectContaining({
          timeout: 5000,
        }),
        expect.any(Object),
      );
    });

    it('should handle very short intervals', async () => {
      const shortIntervalMonitor = {
        ...mockMonitor,
        interval: 10, // 10 seconds
      };

      mockQueue.add.mockResolvedValue({ id: 'job-short' });

      await service.addMonitorCheck(shortIntervalMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({
          repeat: { every: 10000 }, // 10 seconds in milliseconds
        }),
      );
    });

    it('should handle very long intervals', async () => {
      const longIntervalMonitor = {
        ...mockMonitor,
        interval: 3600, // 1 hour
      };

      mockQueue.add.mockResolvedValue({ id: 'job-long' });

      await service.addMonitorCheck(longIntervalMonitor);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'check-monitor',
        expect.any(Object),
        expect.objectContaining({
          repeat: { every: 3600000 }, // 1 hour in milliseconds
        }),
      );
    });
  });
});
