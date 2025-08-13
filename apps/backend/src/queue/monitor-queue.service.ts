import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Monitor } from '../monitor/monitor.entity';

export interface MonitorCheckJobData {
  monitorId: string;
  url: string;
  httpMethod: string;
  timeout: number;
  headers?: Record<string, string>;
  body?: string;
  maxLatencyMs: number;
  maxConsecutiveFailures: number;
}

@Injectable()
export class MonitorQueueService {
  private readonly logger = new Logger(MonitorQueueService.name);
  constructor(@InjectQueue('monitor-checks') private monitorQueue: Queue) {}

  async addMonitorCheck(monitor: Monitor): Promise<void> {
    const jobData: MonitorCheckJobData = {
      monitorId: monitor.id,
      url: monitor.url,
      httpMethod: monitor.httpMethod || 'GET',
      timeout: monitor.timeout || 10000,
      headers: monitor.headers || {},
      body: monitor.body || undefined,
      maxLatencyMs: monitor.maxLatencyMs,
      maxConsecutiveFailures: monitor.maxConsecutiveFailures,
    };

    await this.monitorQueue.add('check-monitor', jobData, {
      repeat: {
        every: monitor.interval * 1000, // Convert seconds to milliseconds
      },
      jobId: `monitor-${monitor.id}`,
    });

    this.logger.log(
      `Scheduled monitor check for ${monitor.name} every ${monitor.interval} seconds`,
    );
  }

  async removeMonitorCheck(monitorId: string): Promise<void> {
    const jobId = `monitor-${monitorId}`;

    //Remove repeated job if it exists
    const repeatedJobs = await this.monitorQueue.getRepeatableJobs();
    const jobToRemove = repeatedJobs.find((job) => job.id === jobId);

    if (jobToRemove) {
      await this.monitorQueue.removeRepeatableByKey(jobToRemove.key);
      this.logger.log(`Removed monitor check for job ID: ${jobId}`);
    }
  }

  async pauseMonitorCheck(monitorId: string): Promise<void> {
    await this.removeMonitorCheck(monitorId);
    this.logger.log(`Paused monitor check for job ID: ${monitorId}`);
  }

  async resumeMonitorCheck(monitor: Monitor): Promise<void> {
    await this.addMonitorCheck(monitor);
    this.logger.log(`Resumed monitor check for job ID: ${monitor.id}`);
  }

  async updateMonitorCheck(monitor: Monitor): Promise<void> {
    //Remove existing job and add new one with updated config
    await this.removeMonitorCheck(monitor.id);
    await this.addMonitorCheck(monitor);
    this.logger.log(`Updated monitor check for job ID: ${monitor.id}`);
  }

  async getQueueStats(): Promise<any> {
    const waiting = await this.monitorQueue.getWaiting();
    const active = await this.monitorQueue.getActive();
    const completed = await this.monitorQueue.getCompleted();
    const failed = await this.monitorQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
