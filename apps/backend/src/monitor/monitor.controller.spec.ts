import { Test, TestingModule } from '@nestjs/testing';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { CreateMonitorDto, UpdateMonitorDto } from './dto';
import { NotFoundException } from '@nestjs/common';

describe('MonitorController', () => {
  let controller: MonitorController;
  let service: MonitorService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockMonitor = {
    id: 'monitor-123',
    name: 'Test Monitor',
    url: 'https://example.com',
    interval: 60,
    paused: false,
    user: mockUser,
  };

  beforeEach(async () => {
    const mockMonitorService = {
      createMonitor: jest.fn(),
      getMonitorsByUser: jest.fn(),
      getMonitorById: jest.fn(),
      updateMonitor: jest.fn(),
      deleteMonitor: jest.fn(),
      pauseMonitor: jest.fn(),
      resumeMonitor: jest.fn(),
      getLatestCheckResult: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitorController],
      providers: [
        {
          provide: MonitorService,
          useValue: mockMonitorService,
        },
      ],
    }).compile();

    controller = module.get<MonitorController>(MonitorController);
    service = module.get<MonitorService>(MonitorService);
  });

  describe('POST /monitors', () => {
    it('should create a new monitor', async () => {
      const createDto: CreateMonitorDto = {
        name: 'Test Monitor',
        url: 'https://example.com',
        interval: 60,
      };

      jest
        .spyOn(service, 'createMonitor')
        .mockResolvedValue(mockMonitor as any);

      const result = await controller.createMonitor(createDto, mockUser as any);

      expect(service.createMonitor).toHaveBeenCalledWith(
        createDto.name,
        createDto.interval,
        createDto.url,
        mockUser.id,
      );
      expect(result).toEqual(mockMonitor);
    });
  });

  describe('GET /monitors', () => {
    it('should return all monitors for user', async () => {
      const monitors = [mockMonitor];
      jest
        .spyOn(service, 'getMonitorsByUser')
        .mockResolvedValue(monitors as any);

      const result = await controller.getAllMonitors(mockUser.id);

      expect(service.getMonitorsByUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(monitors);
    });
  });

  describe('GET /monitors/:id', () => {
    it('should return monitor with latest status', async () => {
      const mockCheckResult = {
        id: 'check-123',
        status: 200,
        isUp: true,
        responseTime: 150,
        createdAt: new Date(),
      };

      jest
        .spyOn(service, 'getMonitorById')
        .mockResolvedValue(mockMonitor as any);
      jest
        .spyOn(service, 'getLatestCheckResult')
        .mockResolvedValue(mockCheckResult as any);

      const result = await controller.getMonitorById(
        mockUser.id,
        'monitor-123',
      );

      expect(service.getMonitorById).toHaveBeenCalledWith(
        'monitor-123',
        mockUser.id,
      );
      expect(service.getLatestCheckResult).toHaveBeenCalledWith('monitor-123');
      expect(result).toEqual({
        ...mockMonitor,
        latestStatus: mockCheckResult,
      });
    });

    it('should throw NotFoundException if monitor not found', async () => {
      jest.spyOn(service, 'getMonitorById').mockResolvedValue(null);

      await expect(
        controller.getMonitorById(mockUser.id, 'monitor-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /monitors/:id', () => {
    it('should update monitor', async () => {
      const updateDto: UpdateMonitorDto = {
        name: 'Updated Monitor',
        interval: 120,
      };
      const updatedMonitor = { ...mockMonitor, ...updateDto };

      jest
        .spyOn(service, 'updateMonitor')
        .mockResolvedValue(updatedMonitor as any);

      const result = await controller.updateMonitor(
        mockUser.id,
        'monitor-123',
        updateDto,
      );

      expect(service.updateMonitor).toHaveBeenCalledWith(
        'monitor-123',
        mockUser.id,
        updateDto,
      );
      expect(result).toEqual(updatedMonitor);
    });
  });

  describe('DELETE /monitors/:id', () => {
    it('should delete monitor', async () => {
      jest.spyOn(service, 'deleteMonitor').mockResolvedValue(undefined);

      await controller.deleteMonitor(mockUser.id, 'monitor-123');

      expect(service.deleteMonitor).toHaveBeenCalledWith(
        'monitor-123',
        mockUser.id,
      );
    });

    it('should throw NotFoundException if monitor not found', async () => {
      jest
        .spyOn(service, 'deleteMonitor')
        .mockRejectedValue(new Error('Monitor not found or access denied'));

      await expect(
        controller.deleteMonitor(mockUser.id, 'monitor-123'),
      ).rejects.toThrow();
    });
  });

  describe('PATCH /monitors/:id/pause', () => {
    it('should pause monitor', async () => {
      jest.spyOn(service, 'pauseMonitor').mockResolvedValue(undefined);

      const result = await controller.pauseMonitor(mockUser.id, 'monitor-123');

      expect(service.pauseMonitor).toHaveBeenCalledWith(
        'monitor-123',
        mockUser.id,
      );
      expect(result).toEqual({ message: 'Monitor paused successfully' });
    });
  });

  describe('PATCH /monitors/:id/resume', () => {
    it('should resume monitor', async () => {
      jest.spyOn(service, 'resumeMonitor').mockResolvedValue(undefined);

      const result = await controller.resumeMonitor(mockUser.id, 'monitor-123');

      expect(service.resumeMonitor).toHaveBeenCalledWith(
        'monitor-123',
        mockUser.id,
      );
      expect(result).toEqual({ message: 'Monitor resumed successfully' });
    });
  });
});
