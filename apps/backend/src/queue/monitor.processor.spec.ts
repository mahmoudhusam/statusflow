import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { MonitorProcessor } from './monitor.processor';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';
import { AlertService } from '../alert/alert.service';
import { Job } from 'bullmq';
import { MonitorCheckJobData } from './monitor-queue.service';
import { AxiosError } from 'axios';

describe('MonitorProcessor', () => {
  let processor: MonitorProcessor;
  let httpService: any;
  let checkResultRepository: any;
  let monitorRepository: any;
  let alertService: any;

  // Mock repositories
  const mockCheckResultRepository = {
    save: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };

  const mockMonitorRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockHttpService = {
    axiosRef: jest.fn(),
  };

  const mockAlertService = {
    checkAndSendAlerts: jest.fn(),
  };

  // Mock monitor data
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
    headers: {},
    body: null,
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

  // Mock job data
  const mockJobData: MonitorCheckJobData = {
    monitorId: 'monitor-123',
    url: 'https://example.com',
    httpMethod: 'GET',
    timeout: 10000,
    headers: {},
    body: undefined,
    maxLatencyMs: 2000,
    maxConsecutiveFailures: 3,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorProcessor,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: getRepositoryToken(CheckResult),
          useValue: mockCheckResultRepository,
        },
        {
          provide: getRepositoryToken(Monitor),
          useValue: mockMonitorRepository,
        },
        {
          provide: AlertService,
          useValue: mockAlertService,
        },
      ],
    }).compile();

    processor = module.get<MonitorProcessor>(MonitorProcessor);
    httpService = module.get<HttpService>(HttpService);
    checkResultRepository = module.get(getRepositoryToken(CheckResult));
    monitorRepository = module.get(getRepositoryToken(Monitor));
    alertService = module.get<AlertService>(AlertService);
  });

  describe('process', () => {
    let mockJob: Partial<Job<MonitorCheckJobData>>;

    beforeEach(() => {
      mockJob = {
        data: mockJobData,
      };
    });

    it('should process successful HTTP request and save result', async () => {
      const mockResponse = {
        status: 200,
        headers: {
          'content-type': 'text/html',
          server: 'nginx',
        },
      };

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockResolvedValue(mockResponse);
      mockCheckResultRepository.save.mockResolvedValue({
        id: 'result-123',
        status: 200,
        responseTime: 150,
        isUp: true,
      });
      mockMonitorRepository.update.mockResolvedValue({});
      mockAlertService.checkAndSendAlerts.mockResolvedValue(undefined);

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      // Verify HTTP request was made
      expect(mockHttpService.axiosRef).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://example.com',
        timeout: 10000,
        headers: {},
        data: undefined,
        validateStatus: expect.any(Function),
      });

      // Verify check result was saved
      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          monitor: mockMonitor,
          monitorId: 'monitor-123',
          status: 200,
          isUp: true,
          responseTime: expect.any(Number),
          responseHeaders: {
            'content-type': 'text/html',
            server: 'nginx',
          },
        }),
      );

      // Verify monitor lastCheckedAt was updated
      expect(mockMonitorRepository.update).toHaveBeenCalledWith('monitor-123', {
        lastCheckedAt: expect.any(Date),
      });
    });

    it('should handle 4xx/5xx status codes as down', async () => {
      const mockResponse = {
        status: 404,
        headers: {},
      };

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockResolvedValue(mockResponse);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 404,
          isUp: false,
          responseTime: expect.any(Number),
        }),
      );
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout') as AxiosError;
      timeoutError.code = 'ECONNABORTED';

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(timeoutError);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          responseTime: 0,
          isUp: false,
          errorMessage: expect.stringContaining('timed out after 10000ms'),
        }),
      );
    });

    it('should handle DNS lookup failures', async () => {
      const dnsError = new Error('DNS lookup failed') as AxiosError;
      dnsError.code = 'ENOTFOUND';

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(dnsError);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          isUp: false,
          errorMessage: expect.stringContaining('DNS lookup failed'),
        }),
      );
    });

    it('should handle connection refused errors', async () => {
      const connError = new Error('Connection refused') as AxiosError;
      connError.code = 'ECONNREFUSED';

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(connError);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          isUp: false,
          errorMessage: expect.stringContaining('Connection refused'),
        }),
      );
    });

    it('should handle connection reset errors', async () => {
      const resetError = new Error('Connection reset') as AxiosError;
      resetError.code = 'ECONNRESET';

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(resetError);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          isUp: false,
          errorMessage: expect.stringContaining('Connection reset by peer'),
        }),
      );
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Some unknown error') as AxiosError;

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(genericError);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          isUp: false,
          errorMessage: 'Some unknown error',
        }),
      );
    });

    it('should skip processing if monitor not found', async () => {
      mockMonitorRepository.findOne.mockResolvedValue(null);

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockHttpService.axiosRef).not.toHaveBeenCalled();
      expect(mockCheckResultRepository.save).not.toHaveBeenCalled();
    });

    it('should skip processing if monitor is paused', async () => {
      const pausedMonitor = { ...mockMonitor, paused: true };
      mockMonitorRepository.findOne.mockResolvedValue(pausedMonitor);

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockHttpService.axiosRef).not.toHaveBeenCalled();
      expect(mockCheckResultRepository.save).not.toHaveBeenCalled();
    });

    it('should process POST request with body', async () => {
      const postJobData: MonitorCheckJobData = {
        ...mockJobData,
        httpMethod: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: { 'Content-Type': 'application/json' },
      };

      const postJob = { data: postJobData };
      const mockResponse = { status: 201, headers: {} };

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockResolvedValue(mockResponse);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(postJob as Job<MonitorCheckJobData>);

      expect(mockHttpService.axiosRef).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://example.com',
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
        data: '{"test":"data"}',
        validateStatus: expect.any(Function),
      });

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 201,
          isUp: true,
        }),
      );
    });

    it('should trigger alerts when monitor is down', async () => {
      const mockResponse = { status: 500, headers: {} };
      const savedResult = {
        id: 'result-123',
        status: 500,
        isUp: false,
        responseTime: 100,
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockResolvedValue(mockResponse);
      mockCheckResultRepository.save.mockResolvedValue(savedResult);
      mockCheckResultRepository.count.mockResolvedValue(3); // 3 consecutive failures
      mockMonitorRepository.update.mockResolvedValue({});
      mockAlertService.checkAndSendAlerts.mockResolvedValue(undefined);

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      // Verify alert service was called for downtime
      expect(mockCheckResultRepository.count).toHaveBeenCalledWith({
        where: {
          monitorId: 'monitor-123',
          isUp: false,
          createdAt: expect.anything(),
        },
        order: { createdAt: 'DESC' },
        take: 3,
      });

      expect(mockAlertService.checkAndSendAlerts).toHaveBeenCalledWith(
        mockMonitor,
        savedResult,
        3,
      );
    });

    it('should trigger alerts when latency is too high', async () => {
      // Mock a slow response (simulate 3000ms response time)
      const mockResponse = { status: 200, headers: {} };
      const savedResult = {
        id: 'result-123',
        status: 200,
        isUp: true,
        responseTime: 3000, // Higher than maxLatencyMs (2000)
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);

      // Mock Date.now to simulate slow response
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // Start time
        return 4000; // End time (3000ms later)
      });

      mockHttpService.axiosRef.mockResolvedValue(mockResponse);
      mockCheckResultRepository.save.mockResolvedValue(savedResult);
      mockMonitorRepository.update.mockResolvedValue({});
      mockAlertService.checkAndSendAlerts.mockResolvedValue(undefined);

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      // Verify alert service was called for high latency
      expect(mockAlertService.checkAndSendAlerts).toHaveBeenCalledWith(
        mockMonitor,
        savedResult,
        0, // No consecutive failures for latency alert
      );

      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should handle custom headers correctly', async () => {
      const customHeaders = {
        Authorization: 'Bearer token123',
        'User-Agent': 'StatusFlow/1.0',
      };

      const jobWithHeaders = {
        data: { ...mockJobData, headers: customHeaders },
      };

      const mockResponse = { status: 200, headers: {} };

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockResolvedValue(mockResponse);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(jobWithHeaders as Job<MonitorCheckJobData>);

      expect(mockHttpService.axiosRef).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: customHeaders,
        }),
      );
    });
  });

  describe('error handling edge cases', () => {
    it('should handle axios error without code property', async () => {
      const mockJob = { data: mockJobData };
      const errorWithoutCode = new Error('Network error') as AxiosError;
      // Don't set error.code

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(errorWithoutCode);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          isUp: false,
          errorMessage: 'Network error',
        }),
      );
    });

    it('should handle axios error without message', async () => {
      const mockJob = { data: mockJobData };
      const errorWithoutMessage = new Error() as AxiosError;
      errorWithoutMessage.message = ''; // Empty message

      mockMonitorRepository.findOne.mockResolvedValue(mockMonitor);
      mockHttpService.axiosRef.mockRejectedValue(errorWithoutMessage);
      mockCheckResultRepository.save.mockResolvedValue({});
      mockMonitorRepository.update.mockResolvedValue({});

      await processor.process(
        jobWithHeaders as unknown as Job<MonitorCheckJobData>,
      );

      expect(mockCheckResultRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 0,
          isUp: false,
          errorMessage: 'Unknown error',
        }),
      );
    });
  });
});
