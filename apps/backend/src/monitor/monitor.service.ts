import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Monitor } from './monitor.entity';
import { Between, Repository } from 'typeorm';
import { CheckResult } from '../check-result/check-result.entity';
import { User } from '../user/user.entity';
import { MonitorQueueService } from '../queue/monitor-queue.service';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    @InjectRepository(Monitor) private monitorRepository: Repository<Monitor>,
    @InjectRepository(CheckResult)
    private checkResultRepository: Repository<CheckResult>,
    private readonly monitorQueueService: MonitorQueueService,
  ) {}

  //BullMQ service to handle monitor checks

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
      ...additionalData,
      user: { id: userId } as User,
    };

    const monitor = this.monitorRepository.create(monitorData);
    const savedMonitor = await this.monitorRepository.save(monitor);

    //Add to BullMQ queue for monitoring
    await this.monitorQueueService.addMonitorCheck(savedMonitor);

    this.logger.log(`Created monitor ${savedMonitor.name} and added to queue`);
    return savedMonitor;
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

    // Update the monitor
    Object.assign(monitor, safeUpdateData);
    const updatedMonitor = await this.monitorRepository.save(monitor);

    // Update the queue job with new configuration
    await this.monitorQueueService.updateMonitorCheck(updatedMonitor);

    this.logger.log(`Updated monitor ${updatedMonitor.name} and queue job`);
    return updatedMonitor;
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

    // Remove from BullMQ queue
    await this.monitorQueueService.removeMonitorCheck(monitorId);

    this.logger.log(`Deleted monitor ${monitorId} and removed from queue`);
  }

  async pauseMonitor(monitorId: string, userId: string): Promise<void> {
    const result = await this.monitorRepository.update(
      { id: monitorId, user: { id: userId } },
      { paused: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Monitor not found');
    }

    // Pause the queue job
    await this.monitorQueueService.pauseMonitorCheck(monitorId);

    this.logger.log(`Paused monitor ${monitorId}`);
  }

  async resumeMonitor(monitorId: string, userId: string): Promise<void> {
    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId, user: { id: userId } },
    });

    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }

    // Update database
    await this.monitorRepository.update(
      { id: monitorId, user: { id: userId } },
      { paused: false },
    );

    //Resume the queue job
    monitor.paused = false;
    await this.monitorQueueService.resumeMonitorCheck(monitor);

    this.logger.log(`Resumed monitor ${monitorId}`);
  }

  //method to get monitor statistics
  async getMonitorStats(monitorId: string, userId: string) {
    const monitor = await this.getMonitorById(monitorId, userId);

    const results = await this.checkResultRepository.find({
      where: { monitorId: monitor.id },
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
      from: Date;
      to: Date;
      interval: string;
    },
  ) {
    // Verify monitor ownership
    const monitor = await this.getMonitorById(monitorId, userId);

    // Get check results in the time range
    const checkResults = await this.checkResultRepository.find({
      where: {
        monitorId,
        createdAt: Between(options.from, options.to),
      },
      order: { createdAt: 'ASC' },
    });

    // Group by time intervals
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
      timeRange: {
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
    return intervals[interval] || intervals['1h'];
  }

  private groupResultsByInterval(
    results: CheckResult[],
    intervalMs: number,
    from: Date,
    to: Date,
  ): Array<{ timestamp: Date; results: CheckResult[] }> {
    const groups: { [key: string]: CheckResult[] } = {};

    // Create time buckets
    for (let time = from.getTime(); time < to.getTime(); time += intervalMs) {
      const bucket = new Date(time).toISOString();
      groups[bucket] = [];
    }

    // Assign results to buckets
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

  // Add method to get queue statistics
  // async getQueueStats() {
  //   return await this.monitorQueueService.getQueueStats();
  // }
}
