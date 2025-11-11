import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckResult } from '@/check-result/check-result.entity';
import { LessThan, Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { AlertService } from '@/alert/alert.service';
import { Monitor } from '@/monitor/monitor.entity';
import { AxiosError } from 'axios';
import { Job } from 'bullmq';
import { MonitorCheckJobData } from './monitor-queue.service';

@Processor('monitor-checks')
export class MonitorProcessor extends WorkerHost {
  private readonly logger = new Logger(MonitorProcessor.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(CheckResult)
    private checkResultRepository: Repository<CheckResult>,
    @InjectRepository(Monitor)
    private monitorRepository: Repository<Monitor>,
    private readonly alertService: AlertService,
  ) {
    super();
  }

  async process(job: Job<MonitorCheckJobData>): Promise<void> {
    const {
      monitorId,
      url,
      httpMethod,
      timeout,
      headers,
      body,
      maxLatencyMs,
      maxConsecutiveFailures,
    } = job.data;

    this.logger.debug(`Processing monitor check for ${url} (ID: ${monitorId})`);

    //get full monitor details for relationship
    const monitor = await this.monitorRepository.findOne({
      where: { id: monitorId },
      relations: ['user'],
    });

    if (!monitor) {
      this.logger.warn(`Monitor ${monitorId} not found, skipping check`);
      return;
    }

    if (monitor.paused) {
      this.logger.debug(`Monitor ${monitorId} is paused, skipping check`);
      return;
    }

    const checkResult: Partial<CheckResult> = {
      monitor,
      monitorId,
    };

    try {
      const startTime = Date.now();

      //make the HTTP request
      const response = await this.httpService.axiosRef({
        method: httpMethod,
        url,
        timeout,
        headers,
        data: body,
        validateStatus: () => true, // Accept all responses
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
        `Monitor ${url} responded with status ${response.status} in ${responseTime}ms`,
      );
    } catch (error) {
      const axiosError = error as AxiosError;

      checkResult.status = 0;
      checkResult.responseTime = 0;
      checkResult.isUp = false;

      if (axiosError.code === 'ECONNABORTED') {
        checkResult.errorMessage = `Request timed out after ${timeout}ms`;
      } else if (axiosError.code === 'ENOTFOUND') {
        checkResult.errorMessage = `DNS lookup failed for ${url}`;
      } else if (axiosError.code === 'ECONNREFUSED') {
        checkResult.errorMessage = `Connection refused by ${url}`;
      } else if (axiosError.code === 'ECONNRESET') {
        checkResult.errorMessage = `Connection reset by peer for ${url}`;
      } else {
        checkResult.errorMessage = axiosError.message || 'Unknown error';
      }

      this.logger.error(`Monitor ${url} failed: ${checkResult.errorMessage}`);
    }

    const savedResult = await this.checkResultRepository.save(checkResult);

    await this.monitorRepository.update(monitorId, {
      lastCheckedAt: new Date(),
    });

    await this.checkForAlerts(monitor, savedResult as CheckResult);
  }

  private async checkForAlerts(
    monitor: Monitor,
    result: CheckResult,
  ): Promise<void> {
    if (!result.isUp) {
      const recentFailures = await this.checkResultRepository.count({
        where: {
          monitorId: monitor.id,
          isUp: false,
          createdAt: LessThan(new Date()),
        },
        order: { createdAt: 'DESC' },
        take: monitor.maxConsecutiveFailures,
      });

      await this.alertService.checkAndSendAlerts(
        monitor,
        result,
        recentFailures,
      );
    } else if (result.responseTime > monitor.maxLatencyMs) {
      await this.alertService.checkAndSendAlerts(monitor, result, 0);
    }
  }
}
