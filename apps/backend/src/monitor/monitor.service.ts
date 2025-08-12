import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Monitor } from './monitor.entity';
import { Between, LessThan, Repository } from 'typeorm';
import { CheckResult } from '../check-result/check-result.entity';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosError } from 'axios';
import { User } from '../user/user.entity';
import { interval } from 'rxjs';

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
    name: string,
    interval: number,
    url: string,
    userId: string,
    additionalData?: Partial<Monitor>,
  ): Promise<Monitor> {
    const monitorData: Partial<Monitor> = {
      name,
      url,
      interval,
      httpMethod: 'GET',
      timeout: 10000,
      maxLatencyMs: 2000,
      maxConsecutiveFailures: 3,
      paused: false,
      headers: {},
      body: null,
      ...additionalData, // Allow overriding defaults
      user: { id: userId } as User, // Set the user relationship
    };

    const monitor = this.monitorRepository.create(monitorData);
    return this.monitorRepository.save(monitor);
  }

  //List all monitors for current user
  async getMonitorsByUser(userId: string): Promise<Monitor[]> {
    return this.monitorRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  //Get monitor details + latest status
  async getMonitorById(monitorId: string, userId: string): Promise<Monitor> {
    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId, user: { id: userId } },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    return monitor;
  }

  //method to get latest check result for a monitor
  async getLatestCheckResult(monitorId: string): Promise<CheckResult | null> {
    return this.checkResultRepository.findOne({
      where: { monitorId },
      order: { createdAt: 'DESC' },
    });
  }

  //PATCH /monitors/:id: Update monitor configuration
  async updateMonitor(
    monitorId: string,
    userId: string,
    updateData: Partial<Monitor>,
  ): Promise<Monitor> {
    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId, user: { id: userId } },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    //remove fields that should not be updated
    const { id, user, checkResults, createdAt, updatedAt, ...safeUpdateData } =
      updateData;

    //update only the allowed fields
    Object.assign(monitor, safeUpdateData);
    return this.monitorRepository.save(monitor);
  }

  //DELETE /monitors/:id: Delete monitor and stop checks
  async deleteMonitor(monitorId: string, userId: string): Promise<void> {
    const monitor = await this.monitorRepository.delete({
      id: monitorId,
      user: { id: userId },
    });

    if (monitor.affected === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }

  async pauseMonitor(monitorId: string, userId: string): Promise<void> {
    const result = await this.monitorRepository.update(
      { id: monitorId, user: { id: userId } },
      { paused: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }

  async resumeMonitor(monitorId: string, userId: string): Promise<void> {
    const result = await this.monitorRepository.update(
      { id: monitorId, user: { id: userId } },
      { paused: false },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Monitor not found');
    }
  }

  //method to get monitor statistics
  async getMonitorStats(monitorId: string, userId: string) {
    const monitor = await this.getMonitorById(monitorId, userId);

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const results = await this.checkResultRepository.find({
      where: {
        monitorId: monitor.id,
        createdAt: LessThan(new Date()),
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const upCount = results.filter((r) => r.isUp).length;
    const totalCount = results.length;
    const avgResponseTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / totalCount || 0;

    return {
      monitorId: monitor.id,
      name: monitor.name,
      url: monitor.url,
      uptime: totalCount > 0 ? (upCount / totalCount) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      totalChecks: totalCount,
      lastCheck: results[0]?.createdAt || null,
      currentStatus: results[0]?.isUp ? 'up' : 'down',
    };
  }

  //get historical metrics for a monitor
  async getMonitorMetrics(
    monitorId: string,
    userId: string,
    options: {
      from?: Date;
      to?: Date;
      interval?: string;
    },
  ) {
    //verfiy monitor ownership
    const monitor = await this.getMonitorById(monitorId, userId);

    //Get check results within the specified date range
    const checkResults = await this.checkResultRepository.find({
      where: {
        monitorId,
        createdAt: Between(options.from, options.to),
      },
      order: { createdAt: 'ASC' },
    });

    //Group by time intervals
    const intervalMs = this.parseInterval(options.interval);
    const groupedResults = this.groupResultsByInterval(
      checkResults,
      intervalMs,
      options.from,
      options.to,
    );

    // Calculate metrics for each interval
    const metrics = groupedResults.map((group) => ({
      timestamp: group.timestamp,
      uptime:
        group.results.length > 0
          ? (group.results.filter((r) => r.isUp).length /
              group.results.length) *
            100
          : null,
      avgResponseTime:
        group.results.length > 0
          ? group.results.reduce((sum, r) => sum + r.responseTime, 0) /
            group.results.length
          : null,
      p95ResponseTime: this.calculatePercentile(
        group.results.map((r) => r.responseTime),
        95,
      ),
      totalChecks: group.results.length,
      errors: group.results.filter((r) => !r.isUp).length,
    }));

    return {
      monitorId,
      name: monitor.name,
      url: monitor.url,
      TimeRange: {
        from: options.from,
        to: options.to,
        interval: options.interval,
      },
      summary: {
        totalUptime:
          checkResults.length > 0
            ? (checkResults.filter((r) => r.isUp).length /
                checkResults.length) *
              100
            : 0,
        avgResponseTime:
          checkResults.length > 0
            ? checkResults.reduce((sum, r) => sum + r.responseTime, 0) /
              checkResults.length
            : 0,
        totalChecks: checkResults.length,
        totalErrors: checkResults.filter((r) => !r.isUp).length,
      },
      metrics,
    };
  }

  private parseInterval(interval: string): number {
    const intervals = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return intervals[interval] || intervals['1h']; // Default to 1 hour
  }

  private groupResultsByInterval(
    results: CheckResult[],
    intervalMs: number,
    from?: Date,
    to?: Date,
  ): Array<{ timestamp: Date; results: CheckResult[] }> {
    const groups: { [key: string]: CheckResult[] } = {};

    //Create time buckets
    for (let time = from.getTime(); time < to.getTime(); time += intervalMs) {
      const bucket = new Date(time).toISOString();
      groups[bucket] = [];
    }

    //Assign results to buckets
    results.forEach((result) => {
      const resultTime = result.createdAt.getTime();
      const bucketTime =
        Math.floor((resultTime - from.getTime()) / intervalMs) * intervalMs +
        from.getTime();
      const bucketKey = new Date(bucketTime).toISOString();

      if (groups[bucketKey]) {
        groups[bucketKey].push(result);
      }
    });

    //Convert to array format
    return Object.entries(groups).map(([timestamp, results]) => ({
      timestamp: new Date(timestamp),
      results,
    }));
  }

  private calculatePercentile(
    values: number[],
    percentile: number,
  ): number | null {
    if (values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
}
