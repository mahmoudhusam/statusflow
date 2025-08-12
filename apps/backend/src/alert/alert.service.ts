import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';

export class AlertRule {
  consecutiveFailures: number;
  latencyThresholdMs: number;
  emailNotifications: boolean;
}

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
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

  async checkAndSendAlerts(
    monitor: Monitor,
    checkResult: CheckResult,
    consecutiveFailures: number,
  ): Promise<void> {
    const alerts: string[] = [];

    //check for downtime alert
    if (
      !checkResult.isUp &&
      consecutiveFailures >= monitor.maxConsecutiveFailures
    ) {
      alerts.push(
        `🔴 DOWNTIME: ${monitor.name} has been down for ${consecutiveFailures} consecutive checks`,
      );
    }

    //check for latency alert
    if (checkResult.isUp && checkResult.responseTime > monitor.maxLatencyMs) {
      alerts.push(
        `⚠️ HIGH LATENCY: ${monitor.name} responded in ${checkResult.responseTime}ms (threshold: ${monitor.maxLatencyMs}ms)`,
      );
    }

    //send email alerts if any
    if (alerts.length > 0) {
      await this.sendEmailAlert(monitor, alerts, checkResult);
    }
  }

  private async sendEmailAlert(
    monitor: Monitor,
    alerts: string[],
    checkResult: CheckResult,
  ): Promise<void> {
    try {
      const subject = `🚨 StatusFlow Alert: ${monitor.name}`;
      const html = this.generateAlertEmail(monitor, alerts, checkResult);
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to: monitor.user.email,
        subject,
        html,
      });
      this.logger.log(`Alert email sent for monitor ${monitor.name}`);
    } catch (error) {
      this.logger.error(`Failed to send alert email: ${error.message}`);
    }
  }

  private generateAlertEmail(
    monitor: Monitor,
    alerts: string[],
    checkResult: CheckResult,
  ): string {
    return `
            <h1>StatusFlow Alert </h1>
            <p><strong>Monitor:</strong> ${monitor.name}</p>
            <p><strong>URL:</strong> ${monitor.url}</p>
            <p><strong>Time:</strong> ${checkResult.createdAt.toISOString()}</p>

            <h3>Issues Detected:</h3>
            <ul>
                ${alerts.map((alert) => `<li>${alert}</li>`).join('')}
            </ul>

            <h3>Latest Check Result:</h3>
            <ul>
                <li><strong>Status:</strong> ${checkResult.status}</li>
                <li><strong>Response Time:</strong> ${checkResult.responseTime}ms</li>
                <li><strong>Status:</strong> ${checkResult.isUp ? '✅ UP' : '❌ DOWN'}</li>
                ${checkResult.errorMessage ? `<li><strong>Error:</strong> ${checkResult.errorMessage}</li>` : ''}
            </ul>

            <p><em>This is an automated alert from StatusFlow.</em></p>
        `;
  }
}
