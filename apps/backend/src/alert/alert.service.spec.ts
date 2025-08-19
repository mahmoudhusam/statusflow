import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AlertService } from './alert.service';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Create src/alert/alert.service.spec.ts
describe('AlertService', () => {
  let service: AlertService;
  let configService: ConfigService;
  const mockTransporter = { sendMail: jest.fn() };

  const mockConfigService = {
    get: jest.fn(),
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
    headers: {},
    body: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      email: 'user@example.com',
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
      monitors: [],
    },
    checkResults: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTransporter = {
      sendMail: jest.fn(),
    };

    mockNodemailer.createTransport.mockReturnValue(mockTransporter);

    // Setup config service mock
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_USER: 'test@example.com',
        SMTP_PASS: 'password',
        SMTP_FROM: 'StatusFlow <noreply@statusflow.com>',
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('initialization', () => {
    it('should create nodemailer transporter with correct config', () => {
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'password',
        },
      });
    });
  });

  describe('checkAndSendAlerts', () => {
    let mockCheckResult: CheckResult;

    beforeEach(() => {
      mockCheckResult = {
        id: 'result-123',
        status: 500,
        responseTime: 1500,
        isUp: false,
        createdAt: new Date(),
        errorMessage: 'Server Error',
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };
    });

    it('should send downtime alert when consecutive failures threshold is reached', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-123' });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 3);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('email content validation', () => {
    it('should include all required information in alert email', async () => {
      const mockCheckResult: CheckResult = {
        id: 'result-128',
        status: 503,
        responseTime: 0,
        isUp: false,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        errorMessage: 'Service Unavailable',
        responseHeaders: { 'server': 'nginx' },
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        const html = mailOptions.html;
        
        // Check all required sections are present
        expect(html).toContain('<h2>StatusFlow Alert</h2>');
        expect(html).toContain('<strong>Monitor:</strong> Test Monitor');
        expect(html).toContain('<strong>URL:</strong> https://example.com');
        expect(html).toContain('<strong>Time:</strong> 2024-01-15T10:30:00.000Z');
        expect(html).toContain('<h3>Issues Detected:</h3>');
        expect(html).toContain('<h3>Latest Check Result:</h3>');
        expect(html).toContain('<strong>Status:</strong> 503');
        expect(html).toContain('<strong>Response Time:</strong> 0ms');
        expect(html).toContain('❌ DOWN');
        expect(html).toContain('<strong>Error:</strong> Service Unavailable');
        
        return Promise.resolve({ messageId: 'msg-128' });
      });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 3);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'StatusFlow <noreply@statusflow.com>',
        to: 'user@example.com',
        subject: '🚨 StatusFlow Alert: Test Monitor',
        html: expect.any(String),
      });
    });

    it('should not include error section when there is no error', async () => {
      const successfulResult: CheckResult = {
        id: 'result-129',
        status: 200,
        responseTime: 3000, // High latency but successful
        isUp: true,
        createdAt: new Date(),
        errorMessage: undefined,
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        const html = mailOptions.html;
        expect(html).toContain('✅ UP');
        expect(html).not.toContain('<strong>Error:</strong>');
        return Promise.resolve({ messageId: 'msg-129' });
      });

      await service.checkAndSendAlerts(mockMonitor, successfulResult, 0);
    });
  });

  describe('alert thresholds', () => {
    it('should respect custom maxConsecutiveFailures threshold', async () => {
      const customMonitor = {
        ...mockMonitor,
        maxConsecutiveFailures: 5, // Custom threshold
      };

      const mockCheckResult: CheckResult = {
        id: 'result-130',
        status: 500,
        responseTime: 0,
        isUp: false,
        createdAt: new Date(),
        errorMessage: 'Server Error',
        responseHeaders: {},
        monitor: customMonitor,
        monitorId: 'monitor-123',
      };

      // Should not send alert with 4 failures (below threshold of 5)
      await service.checkAndSendAlerts(customMonitor, mockCheckResult, 4);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();

      // Should send alert with 5 failures (meets threshold)
      await service.checkAndSendAlerts(customMonitor, mockCheckResult, 5);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should respect custom maxLatencyMs threshold', async () => {
      const customMonitor = {
        ...mockMonitor,
        maxLatencyMs: 5000, // 5 second threshold
      };

      const fastResult: CheckResult = {
        id: 'result-131',
        status: 200,
        responseTime: 4000, // Under 5000ms threshold
        isUp: true,
        createdAt: new Date(),
        errorMessage: undefined,
        responseHeaders: {},
        monitor: customMonitor,
        monitorId: 'monitor-123',
      };

      const slowResult: CheckResult = {
        ...fastResult,
        id: 'result-132',
        responseTime: 6000, // Over 5000ms threshold
      };

      // Should not send alert for 4000ms response
      await service.checkAndSendAlerts(customMonitor, fastResult, 0);
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();

      // Should send alert for 6000ms response
      await service.checkAndSendAlerts(customMonitor, slowResult, 0);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('error scenarios', () => {
    it('should handle transporter creation failure', () => {
      mockNodemailer.createTransport.mockImplementation(() => {
        throw new Error('SMTP configuration invalid');
      });

      // Should not throw during service initialization
      expect(() => new AlertService(configService)).toThrow('SMTP configuration invalid');
    });

    it('should handle sendMail failures without throwing', async () => {
      const mockCheckResult: CheckResult = {
        id: 'result-133',
        status: 500,
        responseTime: 0,
        isUp: false,
        createdAt: new Date(),
        errorMessage: 'Server Error',
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP server down'));

      // Should not throw error, just log it
      await expect(
        service.checkAndSendAlerts(mockMonitor, mockCheckResult, 3)
      ).resolves.not.toThrow();

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('email formatting edge cases', () => {
    it('should handle monitors with special characters in name', async () => {
      const specialMonitor = {
        ...mockMonitor,
        name: 'Test Monitor & API (v2.0) <critical>',
        url: 'https://api-v2.example.com/health?check=true',
      };

      const mockCheckResult: CheckResult = {
        id: 'result-134',
        status: 500,
        responseTime: 0,
        isUp: false,
        createdAt: new Date(),
        errorMessage: 'Connection refused',
        responseHeaders: {},
        monitor: specialMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        expect(mailOptions.subject).toContain('Test Monitor & API (v2.0) <critical>');
        expect(mailOptions.html).toContain('Test Monitor &amp; API (v2.0) &lt;critical&gt;'); // Should be HTML escaped
        expect(mailOptions.html).toContain('https://api-v2.example.com/health?check=true');
        return Promise.resolve({ messageId: 'msg-134' });
      });

      await service.checkAndSendAlerts(specialMonitor, mockCheckResult, 3);
    });

    it('should handle very long error messages', async () => {
      const longErrorMessage = 'A'.repeat(1000); // Very long error
      
      const mockCheckResult: CheckResult = {
        id: 'result-135',
        status: 500,
        responseTime: 0,
        isUp: false,
        createdAt: new Date(),
        errorMessage: longErrorMessage,
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        expect(mailOptions.html).toContain(longErrorMessage);
        return Promise.resolve({ messageId: 'msg-135' });
      });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 3);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});toHaveBeenCalledWith({
        from: 'StatusFlow <noreply@statusflow.com>',
        to: 'user@example.com',
        subject: '🚨 StatusFlow Alert: Test Monitor',
        html: expect.stringContaining('DOWNTIME: Test Monitor has been down for 3 consecutive checks'),
      });
    });

    it('should send latency alert when response time exceeds threshold', async () => {
      const slowCheckResult = {
        ...mockCheckResult,
        isUp: true,
        status: 200,
        responseTime: 3000, // Exceeds 2000ms threshold
        errorMessage: undefined,
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-124' });

      await service.checkAndSendAlerts(mockMonitor, slowCheckResult, 0);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'StatusFlow <noreply@statusflow.com>',
        to: 'user@example.com',
        subject: '🚨 StatusFlow Alert: Test Monitor',
        html: expect.stringContaining('HIGH LATENCY: Test Monitor responded in 3000ms (threshold: 2000ms)'),
      });
    });

    it('should send both downtime and latency alerts if both conditions are met', async () => {
      const slowDownCheckResult = {
        ...mockCheckResult,
        responseTime: 5000, // Both down AND slow (though this is unusual)
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-125' });

      await service.checkAndSendAlerts(mockMonitor, slowDownCheckResult, 5);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringMatching(/DOWNTIME.*consecutive checks/),
        })
      );
    });

    it('should not send alerts when monitor is up and response time is acceptable', async () => {
      const goodCheckResult = {
        ...mockCheckResult,
        isUp: true,
        status: 200,
        responseTime: 150, // Well under threshold
        errorMessage: undefined,
      };

      await service.checkAndSendAlerts(mockMonitor, goodCheckResult, 0);

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should not send downtime alert when consecutive failures is below threshold', async () => {
      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 2); // Below threshold of 3

      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      const emailError = new Error('SMTP server unavailable');
      mockTransporter.sendMail.mockRejectedValue(emailError);

      // Should not throw, but log error internally
      await expect(service.checkAndSendAlerts(mockMonitor, mockCheckResult, 3)).resolves.not.toThrow();

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('generateAlertEmail', () => {
    it('should generate properly formatted HTML email', async () => {
      const mockCheckResult: CheckResult = {
        id: 'result-123',
        status: 500,
        responseTime: 1500,
        isUp: false,
        createdAt: new Date('2024-01-01T12:00:00Z'),
        errorMessage: 'Internal Server Error',
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        // Verify the HTML content structure
        expect(mailOptions.html).toContain('StatusFlow Alert');
        expect(mailOptions.html).toContain('Test Monitor');
        expect(mailOptions.html).toContain('https://example.com');
        expect(mailOptions.html).toContain('2024-01-01T12:00:00.000Z');
        expect(mailOptions.html).toContain('Status: 500');
        expect(mailOptions.html).toContain('Response Time: 1500ms');
        expect(mailOptions.html).toContain('❌ DOWN');
        expect(mailOptions.html).toContain('Internal Server Error');
        expect(mailOptions.html).toContain('automated message from StatusFlow');
        
        return Promise.resolve({ messageId: 'msg-123' });
      });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 3);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should handle check results without error messages', async () => {
      const mockCheckResult: CheckResult = {
        id: 'result-124',
        status: 200,
        responseTime: 3000,
        isUp: true,
        createdAt: new Date(),
        errorMessage: undefined, // No error message
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        // Should not contain error section when no error
        expect(mailOptions.html).not.toContain('<li><strong>Error:</strong>');
        expect(mailOptions.html).toContain('✅ UP');
        return Promise.resolve({ messageId: 'msg-124' });
      });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 0);
    });
  });

  describe('configuration edge cases', () => {
    it('should handle missing SMTP configuration gracefully', async () => {
      // Simulate missing config
      mockConfigService.get.mockReturnValue(undefined);

      const newService = new AlertService(configService);
      const mockCheckResult: CheckResult = {
        id: 'result-125',
        status: 500,
        responseTime: 1000,
        isUp: false,
        createdAt: new Date(),
        errorMessage: 'Server Error',
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      // Should not throw even with missing config
      await expect(newService.checkAndSendAlerts(mockMonitor, mockCheckResult, 3)).resolves.not.toThrow();
    });

    it('should handle SMTP_SECURE as string "true"', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_SECURE') return 'true';
        return 'default-value';
      });

      // Create new service instance to test config parsing
      new AlertService(configService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true,
        })
      );
    });

    it('should handle SMTP_SECURE as string "false"', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_SECURE') return 'false';
        return 'default-value';
      });

      // Create new service instance
      new AlertService(configService);

      expect(mockNodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: false,
        })
      );
    });
  });

  describe('alert message formatting', () => {
    it('should format downtime alert message correctly', async () => {
      const mockCheckResult: CheckResult = {
        id: 'result-126',
        status: 0,
        responseTime: 0,
        isUp: false,
        createdAt: new Date(),
        errorMessage: 'Connection timeout',
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        expect(mailOptions.html).toContain('🔴 DOWNTIME: Test Monitor has been down for 5 consecutive checks');
        return Promise.resolve({ messageId: 'msg-126' });
      });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 5);

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should format latency alert message correctly', async () => {
      const mockCheckResult: CheckResult = {
        id: 'result-127',
        status: 200,
        responseTime: 4500,
        isUp: true,
        createdAt: new Date(),
        errorMessage: undefined,
        responseHeaders: {},
        monitor: mockMonitor,
        monitorId: 'monitor-123',
      };

      mockTransporter.sendMail.mockImplementation((mailOptions) => {
        expect(mailOptions.html).toContain('⚠️ HIGH LATENCY: Test Monitor responded in 4500ms (threshold: 2000ms)');
        return Promise.resolve({ messageId: 'msg-127' });
      });

      await service.checkAndSendAlerts(mockMonitor, mockCheckResult, 0);

      expect(mockTransporter.sendMail).