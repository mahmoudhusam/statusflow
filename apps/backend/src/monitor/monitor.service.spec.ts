import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { MonitorService } from './monitor.service';
import { Monitor } from './monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';
import { NotFoundException } from '@nestjs/common';
import { MonitorQueueService } from '../queue/monitor-queue.service';

describe('MonitorService', () => {
  let service: MonitorService;
  let monitorRepository: any;
  let checkResultRepository: any;
  let httpService: any;

  // Fixed: Complete mock monitor with all required fields
  const mockMonitor: Partial<Monitor> = {
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
    headers: {},
    body: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-123' } as any,
    checkResults: [],
  };

  beforeEach(async () => {
    // Create mock repositories
    monitorRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    checkResultRepository = {
      save: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    httpService = {
      axiosRef: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorService,
        {
          provide: MonitorQueueService,
          useValue: {
            addMonitorCheck: jest.fn(),
            removeMonitorCheck: jest.fn(),
            updateMonitorCheck: jest.fn(),
            pauseMonitorCheck: jest.fn(),
            resumeMonitorCheck: jest.fn(),
          },
        },

        {
          provide: getRepositoryToken(Monitor),
          useValue: monitorRepository,
        },
        {
          provide: getRepositoryToken(CheckResult),
          useValue: checkResultRepository,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    service = module.get<MonitorService>(MonitorService);
  });

  describe('createMonitor', () => {
    it('should create a new monitor', async () => {
      monitorRepository.create.mockReturnValue(mockMonitor);
      monitorRepository.save.mockResolvedValue(mockMonitor);

      const result = await service.createMonitor(
        'Test Monitor',
        60,
        'https://example.com',
        'user-123',
      );

      expect(monitorRepository.create).toHaveBeenCalledWith({
        name: 'Test Monitor',
        url: 'https://example.com',
        interval: 60,
        httpMethod: 'GET',
        timeout: 10000,
        maxLatencyMs: 2000,
        maxConsecutiveFailures: 3,
        paused: false,
        headers: {},
        body: null,
        user: { id: 'user-123' },
      });
      expect(result).toEqual(mockMonitor);
    });
  });

  describe('getMonitorById', () => {
    it('should return monitor if found', async () => {
      monitorRepository.findOne.mockResolvedValue(mockMonitor);

      const result = await service.getMonitorById('monitor-123', 'user-123');

      expect(monitorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'monitor-123', user: { id: 'user-123' } },
      });
      expect(result).toEqual(mockMonitor);
    });

    it('should throw NotFoundException if monitor not found', async () => {
      monitorRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getMonitorById('monitor-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMonitor', () => {
    it('should update monitor successfully', async () => {
      const updateData = { name: 'Updated Monitor' };
      const updatedMonitor = { ...mockMonitor, ...updateData };

      monitorRepository.findOne.mockResolvedValue({ ...mockMonitor });
      monitorRepository.save.mockResolvedValue(updatedMonitor);

      const result = await service.updateMonitor(
        'monitor-123',
        'user-123',
        updateData,
      );

      expect(result.name).toBe('Updated Monitor');
    });

    it('should throw NotFoundException if monitor not found', async () => {
      monitorRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMonitor('monitor-123', 'user-123', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMonitor', () => {
    it('should delete monitor successfully', async () => {
      monitorRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteMonitor('monitor-123', 'user-123');

      expect(monitorRepository.delete).toHaveBeenCalledWith({
        id: 'monitor-123',
        user: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException if monitor not found', async () => {
      monitorRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.deleteMonitor('monitor-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // describe('checkMonitor', () => {
  //   it('should save successful check result', async () => {
  //     // Create a complete monitor object for testing
  //     const completeMonitor = { ...mockMonitor } as Monitor;

  //     const mockResponse = {
  //       status: 200,
  //       headers: { 'content-type': 'text/html' },
  //     };

  //     httpService.axiosRef.mockResolvedValue(mockResponse);
  //     checkResultRepository.save.mockResolvedValue({});
  //     monitorRepository.update.mockResolvedValue({});

  //     // Call the private method using array access
  //     await service['checkMonitor'](completeMonitor);

  //     expect(checkResultRepository.save).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         status: 200,
  //         isUp: true,
  //         monitor: completeMonitor,
  //         monitorId: completeMonitor.id,
  //       }),
  //     );

  //     expect(monitorRepository.update).toHaveBeenCalledWith(
  //       completeMonitor.id,
  //       { lastCheckedAt: expect.any(Date) },
  //     );
  //   });

  //   it('should handle timeout errors', async () => {
  //     const completeMonitor = { ...mockMonitor } as Monitor;
  //     const timeoutError = new Error('timeout');
  //     timeoutError['code'] = 'ECONNABORTED';

  //     httpService.axiosRef.mockRejectedValue(timeoutError);
  //     checkResultRepository.save.mockResolvedValue({});
  //     monitorRepository.update.mockResolvedValue({});

  //     await service['checkMonitor'](completeMonitor);

  //     expect(checkResultRepository.save).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         status: 0,
  //         isUp: false,
  //         errorMessage: expect.stringContaining('timed out'),
  //       }),
  //     );
  //   });
  // });

  describe('pauseMonitor', () => {
    it('should pause monitor successfully', async () => {
      monitorRepository.update.mockResolvedValue({ affected: 1 });

      await service.pauseMonitor('monitor-123', 'user-123');

      expect(monitorRepository.update).toHaveBeenCalledWith(
        { id: 'monitor-123', user: { id: 'user-123' } },
        { paused: true },
      );
    });

    it('should throw NotFoundException if monitor not found', async () => {
      monitorRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.pauseMonitor('monitor-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resumeMonitor', () => {
    it('should resume monitor successfully', async () => {
      monitorRepository.findOne.mockResolvedValue(mockMonitor); // Add this line
      monitorRepository.update.mockResolvedValue({ affected: 1 });

      await service.resumeMonitor('monitor-123', 'user-123');

      expect(monitorRepository.update).toHaveBeenCalledWith(
        { id: 'monitor-123', user: { id: 'user-123' } },
        { paused: false },
      );
    });

    it('should throw NotFoundException if monitor not found', async () => {
      monitorRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.resumeMonitor('monitor-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLatestCheckResult', () => {
    it('should return latest check result', async () => {
      const mockCheckResult = {
        id: 'check-123',
        status: 200,
        isUp: true,
        responseTime: 150,
        createdAt: new Date(),
      };

      checkResultRepository.findOne.mockResolvedValue(mockCheckResult);

      const result = await service.getLatestCheckResult('monitor-123');

      expect(checkResultRepository.findOne).toHaveBeenCalledWith({
        where: { monitorId: 'monitor-123' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockCheckResult);
    });

    it('should return null if no check results', async () => {
      checkResultRepository.findOne.mockResolvedValue(null);

      const result = await service.getLatestCheckResult('monitor-123');

      expect(result).toBeNull();
    });
  });
});
