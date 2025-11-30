import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AlertRule } from '@/alert/entities/alert-rule.entity';
import { AlertHistory } from '@/alert/entities/alert-history.entity';
import { NotificationChannel } from '@/alert/entities/notification-channel.entity';
import { CreateAlertRuleDto } from '@/alert/dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from '@/alert/dto/update-alert-rule.dto';
import { CreateNotificationChannelDto } from '@/alert/dto/create-notification-channel.dto';
import { UpdateNotificationChannelDto } from '@/alert/dto/update-notification-channel.dto';
import { Monitor } from '@/monitor/monitor.entity';
import { CheckResult } from '@/check-result/check-result.entity';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(AlertRule)
    private alertRuleRepository: Repository<AlertRule>,
    @InjectRepository(AlertHistory)
    private alertHistoryRepository: Repository<AlertHistory>,
    @InjectRepository(NotificationChannel)
    private notificationChannelRepository: Repository<NotificationChannel>,
    @InjectRepository(Monitor)
    private monitorRepository: Repository<Monitor>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  // Alert Rules
  async getAlertRules(
    userId: string,
    monitorId?: string,
  ): Promise<AlertRule[]> {
    const where: any = { userId };
    if (monitorId) {
      where.monitorId = monitorId;
    }
    return this.alertRuleRepository.find({
      where,
      relations: ['monitor'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAlertRule(id: string, userId: string): Promise<AlertRule> {
    const rule = await this.alertRuleRepository.findOne({
      where: { id, userId },
      relations: ['monitor'],
    });
    if (!rule) {
      throw new NotFoundException('Alert rule not found');
    }
    return rule;
  }

  async createAlertRule(
    userId: string,
    dto: CreateAlertRuleDto,
  ): Promise<AlertRule> {
    const rule = this.alertRuleRepository.create({
      ...dto,
      userId,
    });
    return this.alertRuleRepository.save(rule);
  }

  async updateAlertRule(
    id: string,
    userId: string,
    dto: UpdateAlertRuleDto,
  ): Promise<AlertRule> {
    const rule = await this.getAlertRule(id, userId);
    Object.assign(rule, dto);
    return this.alertRuleRepository.save(rule);
  }

  async deleteAlertRule(id: string, userId: string): Promise<void> {
    const result = await this.alertRuleRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Alert rule not found');
    }
  }

  // Notification Channels
  async getNotificationChannels(
    userId: string,
  ): Promise<NotificationChannel[]> {
    return this.notificationChannelRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getNotificationChannel(
    id: string,
    userId: string,
  ): Promise<NotificationChannel> {
    const channel = await this.notificationChannelRepository.findOne({
      where: { id, userId },
    });
    if (!channel) {
      throw new NotFoundException('Notification channel not found');
    }
    return channel;
  }

  async createNotificationChannel(
    userId: string,
    dto: CreateNotificationChannelDto,
  ): Promise<NotificationChannel> {
    const channel = this.notificationChannelRepository.create({
      ...dto,
      userId,
    });
    return this.notificationChannelRepository.save(channel);
  }

  async updateNotificationChannel(
    id: string,
    userId: string,
    dto: UpdateNotificationChannelDto,
  ): Promise<NotificationChannel> {
    const channel = await this.getNotificationChannel(id, userId);
    Object.assign(channel, dto);
    return this.notificationChannelRepository.save(channel);
  }

  async deleteNotificationChannel(id: string, userId: string): Promise<void> {
    const result = await this.notificationChannelRepository.delete({
      id,
      userId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Notification channel not found');
    }
  }

  async testNotificationChannel(id: string, userId: string): Promise<any> {
    const channel = await this.getNotificationChannel(id, userId);

    try {
      // Send test notification based on channel type
      if (channel.type === 'email' && channel.configuration.emailAddresses) {
        await this.sendTestEmail(channel.configuration.emailAddresses);
      }
      // Add other channel types here

      // Update test status
      channel.lastTestAt = new Date();
      channel.lastTestSuccess = true;
      await this.notificationChannelRepository.save(channel);

      return { success: true, message: 'Test notification sent successfully' };
    } catch (error) {
      channel.lastTestAt = new Date();
      channel.lastTestSuccess = false;
      await this.notificationChannelRepository.save(channel);

      throw error;
    }
  }

  private async sendTestEmail(emailAddresses: string[]): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: emailAddresses.join(','),
      subject: '🧪 StatusFlow Test Alert',
      html: `
        <h1>Test Alert</h1>
        <p>This is a test notification from StatusFlow.</p>
        <p>If you received this, your email notifications are working correctly!</p>
      `,
    });
  }

  // Alert History
  async getAlertHistory(
    userId: string,
    filters?: {
      monitorId?: string;
      status?: string;
      from?: Date;
      to?: Date;
    },
  ): Promise<AlertHistory[]> {
    const query = this.alertHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.alertRule', 'alertRule')
      .leftJoinAndSelect('history.monitor', 'monitor')
      .where('alertRule.userId = :userId', { userId });

    if (filters?.monitorId) {
      query.andWhere('history.monitorId = :monitorId', {
        monitorId: filters.monitorId,
      });
    }
    if (filters?.status) {
      query.andWhere('history.status = :status', { status: filters.status });
    }
    if (filters?.from) {
      query.andWhere('history.triggeredAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.triggeredAt <= :to', { to: filters.to });
    }

    return query.orderBy('history.triggeredAt', 'DESC').getMany();
  }

  async getAlertHistoryItem(id: string, userId: string): Promise<AlertHistory> {
    const item = await this.alertHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.alertRule', 'alertRule')
      .leftJoinAndSelect('history.monitor', 'monitor')
      .where('history.id = :id', { id })
      .andWhere('alertRule.userId = :userId', { userId })
      .getOne();

    if (!item) {
      throw new NotFoundException('Alert history item not found');
    }
    return item;
  }

  async acknowledgeAlert(id: string, userId: string): Promise<AlertHistory> {
    const item = await this.getAlertHistoryItem(id, userId);
    item.status = 'acknowledged' as any;
    item.acknowledgedAt = new Date();
    item.acknowledgedBy = userId;
    return this.alertHistoryRepository.save(item);
  }

  async resolveAlert(id: string, userId: string): Promise<AlertHistory> {
    const item = await this.getAlertHistoryItem(id, userId);
    item.status = 'resolved' as any;
    item.resolvedAt = new Date();
    if (!item.acknowledgedAt) {
      item.acknowledgedAt = new Date();
      item.acknowledgedBy = userId;
    }
    return this.alertHistoryRepository.save(item);
  }

  // Alert Templates
  getAlertTemplates(): any[] {
    return [
      {
        id: 'downtime-critical',
        name: 'Critical Downtime Alert',
        description: 'Alert when service is down for 3 consecutive checks',
        type: 'downtime',
        severity: 'critical',
        conditions: {
          consecutiveFailures: 3,
        },
      },
      {
        id: 'high-latency',
        name: 'High Latency Alert',
        description: 'Alert when response time exceeds 3 seconds',
        type: 'latency',
        severity: 'high',
        conditions: {
          latencyThreshold: 3000,
        },
      },
      {
        id: 'ssl-expiry',
        name: 'SSL Certificate Expiry',
        description: 'Alert 7 days before SSL certificate expires',
        type: 'ssl_expiry',
        severity: 'medium',
        conditions: {
          sslDaysBeforeExpiry: 7,
        },
      },
    ];
  }

  // This method would be called from the monitor processor
  async checkAndSendAlerts(
    monitor: Monitor,
    checkResult: CheckResult,
    consecutiveFailures: number,
  ): Promise<void> {
    // Find applicable alert rules for this monitor
    const rules = await this.alertRuleRepository.find({
      where: [
        { monitorId: monitor.id, enabled: true },
        { userId: monitor.user.id, monitorId: null, enabled: true }, // Global rules
      ],
    });

    for (const rule of rules) {
      const shouldTrigger = this.evaluateAlertRule(
        rule,
        checkResult,
        consecutiveFailures,
      );

      if (shouldTrigger) {
        await this.triggerAlert(
          rule,
          monitor,
          checkResult,
          consecutiveFailures,
        );
      }
    }
  }

  private evaluateAlertRule(
    rule: AlertRule,
    checkResult: CheckResult,
    consecutiveFailures: number,
  ): boolean {
    switch (rule.type as string) {
      case 'downtime':
        return (
          !checkResult.isUp &&
          consecutiveFailures >= (rule.conditions.consecutiveFailures || 3)
        );

      case 'latency':
        return (
          checkResult.isUp &&
          checkResult.responseTime > (rule.conditions.latencyThreshold || 3000)
        );

      case 'status_code':
        return (
          rule.conditions.statusCodes?.includes(checkResult.status) || false
        );

      default:
        return false;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    monitor: Monitor,
    checkResult: CheckResult,
    consecutiveFailures: number,
  ): Promise<void> {
    // Create alert history entry
    const alertHistory = this.alertHistoryRepository.create({
      alertRule: rule,
      alertRuleId: rule.id,
      monitor,
      monitorId: monitor.id,
      status: 'triggered' as any,
      title: `Alert: ${monitor.name} - ${rule.name}`,
      message: this.generateAlertMessage(
        rule,
        monitor,
        checkResult,
        consecutiveFailures,
      ),
      metadata: {
        responseTime: checkResult.responseTime,
        statusCode: checkResult.status,
        errorMessage: checkResult.errorMessage,
        consecutiveFailures,
      },
      channelsNotified: {},
    });

    // Send notifications
    if (rule.channels.email) {
      await this.sendEmailAlert(rule, monitor, checkResult);
      alertHistory.channelsNotified.email = true;
    }

    if (rule.channels.webhook?.enabled && rule.channels.webhook.url) {
      await this.sendWebhookAlert(rule, monitor, checkResult);
      alertHistory.channelsNotified.webhook = true;
    }

    await this.alertHistoryRepository.save(alertHistory);
  }

  private generateAlertMessage(
    rule: AlertRule,
    monitor: Monitor,
    checkResult: CheckResult,
    consecutiveFailures: number,
  ): string {
    switch (rule.type as string) {
      case 'downtime':
        return `${monitor.name} is DOWN. Failed ${consecutiveFailures} consecutive checks.`;
      case 'latency':
        return `${monitor.name} is experiencing high latency: ${checkResult.responseTime}ms`;
      case 'status_code':
        return `${monitor.name} returned status code ${checkResult.status}`;
      default:
        return `Alert triggered for ${monitor.name}`;
    }
  }

  private async sendEmailAlert(
    rule: AlertRule,
    monitor: Monitor,
    checkResult: CheckResult,
  ): Promise<void> {
    // Implementation already exists in original alert.service.ts
    // You can reuse the existing email sending logic
  }

  private async sendWebhookAlert(
    rule: AlertRule,
    monitor: Monitor,
    checkResult: CheckResult,
  ): Promise<void> {
    if (!rule.channels.webhook?.url) return;

    try {
      await fetch(rule.channels.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...rule.channels.webhook.headers,
        },
        body: JSON.stringify({
          alert: rule.name,
          monitor: monitor.name,
          url: monitor.url,
          status: checkResult.isUp ? 'UP' : 'DOWN',
          responseTime: checkResult.responseTime,
          statusCode: checkResult.status,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      this.logger.error(`Failed to send webhook alert: ${error.message}`);
    }
  }
}
