import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Monitor } from './monitor.entity';
import { LessThan, Repository } from 'typeorm';
import { CheckResult } from '../check-result/check-result.entity';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosError } from 'axios';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    @InjectRepository(Monitor) private monitorRepository: Repository<Monitor>,
    @InjectRepository(CheckResult)
    private checkResultRepository: Repository<CheckResult>,
    private httpService: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkAllMonitors() {
    this.logger.log('Starting monitor checks...');

    try {
      //Find monitors that need checking
      const monitors = await this.getMonitorsToCheck();

      if (monitors.length === 0) {
        this.logger.debug('No monitors to check at this time.');
        return;
      }

      this.logger.log(`Found ${monitors.length} monitors to check.`);

      // Process monitors in parallel but with a reasonable limit
      const batchSize = 10;
      for (let i = 0; i < monitors.length; i += batchSize) {
        const batch = monitors.slice(i, i + batchSize);
        await Promise.all(batch.map((monitor) => this.checkMonitor(monitor)));
      }

      this.logger.log('Monitor checks completed.');
    } catch (error) {
      this.logger.error('Error during monitor checks:', error);
    }
  }

  private async getMonitorsToCheck(): Promise<Monitor[]> {
    const now = new Date();

    //Get all active monitors that are not paused and need checking
    const monitors = await this.monitorRepository.find({
      where: { paused: false },
    });

    //Filter monitors based on their last checked time and interval
    return monitors.filter((monitor) => {
      if (!monitor.lastCheckedAt) {
        return true; // If never checked, we should check it
      }
      const timeSinceLastCheck =
        now.getTime() - monitor.lastCheckedAt.getTime();
      const intervalMs = (monitor.interval || 60) * 1000; // Convert minutes to milliseconds
      return timeSinceLastCheck >= intervalMs;
    });
  }

  private async checkMonitor(monitor: Monitor): Promise<void> {
    this.logger.debug(`Checking monitor: ${monitor.name} (${monitor.url})`);

    const checkResult: Partial<CheckResult> = {
      monitor,
      monitorId: monitor.id,
    };

    try {
      const startTime = Date.now();

      //Make the HTTP request with all configurations
      const response = await this.httpService.axiosRef({
        method: monitor.httpMethod || 'GET',
        url: monitor.url,
        timeout: monitor.timeout || 10000,
        headers: monitor.headers || {},
        data: monitor.body || undefined,
        validateStatus: () => true, // Accept all status codes
      });

      const responseTime = Date.now() - startTime;

      //save successful check result
      checkResult.status = response.status;
      checkResult.responseTime = responseTime;
      checkResult.isUp = response.status >= 200 && response.status < 400;
      checkResult.responseHeaders = Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [
          key,
          String(value),
        ]),
      );

      this.logger.debug(
        `Monitor ${monitor.name} responded with status ${response.status} in ${responseTime}ms`,
      );
    } catch (error) {
      //Handle errors and save failure result
      const axiosError = error as AxiosError;

      checkResult.status = 0;
      checkResult.responseTime = 0;
      checkResult.isUp = false;

      if (axiosError.code === 'ECONNABORTED') {
        checkResult.errorMessage = `Request timed out after ${monitor.timeout}ms`;
      } else if (axiosError.code === 'ENOTFOUND') {
        checkResult.errorMessage = `DNS lookup failed for ${monitor.url}`;
      } else if (axiosError.code === 'ECONNREFUSED') {
        checkResult.errorMessage = `Connection refused by ${monitor.url}`;
      } else if (axiosError.code === 'ECONNRESET') {
        checkResult.errorMessage = `Connection reset by peer for ${monitor.url}`;
      } else {
        checkResult.errorMessage = axiosError.message || 'Unknown error';
      }
      this.logger.error(
        `Monitor ${monitor.name} failed: ${checkResult.errorMessage}`,
      );
    }

    //Save the check result to the database
    await this.checkResultRepository.save(checkResult);

    //Update the monitor's lastCheckedAt timestamp
    await this.monitorRepository.update(monitor.id, {
      lastCheckedAt: new Date(),
    });

    //check if we need to trigger an alert(for future implementation)
    await this.checkForAlerts(monitor, checkResult as CheckResult);
  }

  private async checkForAlerts(
    monitor: Monitor,
    result: CheckResult,
  ): Promise<void> {
    // TODO: Implement alert logic here
    // This is where i will check:
    // 1. If status is down
    // 2. If latency exceeds maxLatencyMs
    // 3. If consecutive failures exceed maxConsecutiveFailures

    if (!result.isUp) {
      //count recent failures
      const recentFailures = await this.checkResultRepository.count({
        where: {
          monitorId: monitor.id,
          isUp: false,
          createdAt: LessThan(new Date()),
        },
        order: {
          createdAt: 'DESC',
        },
        take: monitor.maxConsecutiveFailures,
      });

      if (recentFailures >= monitor.maxConsecutiveFailures) {
        this.logger.warn(
          `Monitor ${monitor.name} has failed ${recentFailures} times consecutively.`,
        );
        // TODO: Trigger alert
      }
    }
    if (result.responseTime > monitor.maxLatencyMs) {
      this.logger.warn(
        `Monitor ${monitor.name} latency (${result.responseTime}ms) exceeds threshold (${monitor.maxLatencyMs}ms)`,
      );
      // TODO: Trigger alert
    }
  }

  //Additional helper methods for the API
  async createMonitor(
    userId: string,
    data: Partial<Monitor>,
  ): Promise<Monitor> {
    const monitor = this.monitorRepository.create({
      ...data,
      user: { id: userId },
    });
    return this.monitorRepository.save(monitor);
  }

  async getMonitorsByUser(userId: string): Promise<Monitor[]> {
    return this.monitorRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async pauseMonitor(monitorId: string, userId: string): Promise<void> {
    await this.monitorRepository.update(
      { id: monitorId, user: { id: userId } },
      { paused: true },
    );
  }

  async resumeMonitor(monitorId: string, userId: string): Promise<void> {
    await this.monitorRepository.update(
      { id: monitorId, user: { id: userId } },
      { paused: false },
    );
  }
}
