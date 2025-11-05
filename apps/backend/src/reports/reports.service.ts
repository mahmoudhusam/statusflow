import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';
import {
  GenerateReportDto,
  ReportData,
  MonitorReportData,
  ReportFormat,
} from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(CheckResult)
    private readonly checkResultRepository: Repository<CheckResult>,
  ) {}

  async generateReport(
    userId: string,
    dto: GenerateReportDto,
  ): Promise<ReportData> {
    const { monitorIds, startDate, endDate, format } = dto;

    // Validate user owns the monitors
    const whereCondition: any = { user: { id: userId } };
    if (monitorIds && monitorIds.length > 0) {
      whereCondition.id = In(monitorIds);
    }

    const monitors = await this.monitorRepository.find({
      where: whereCondition,
    });

    if (monitors.length === 0) {
      throw new Error('No monitors found');
    }

    // Fetch check results for the date range
    const checkResults = await this.checkResultRepository.find({
      where: {
        monitorId: In(monitors.map((m) => m.id)),
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
      order: { createdAt: 'DESC' },
    });

    // Calculate detailed statistics for each monitor
    const monitorReports: MonitorReportData[] = monitors.map((monitor) => {
      const monitorResults = checkResults.filter(
        (r) => r.monitorId === monitor.id,
      );
      const successfulChecks = monitorResults.filter((r) => r.isUp).length;
      const failedChecks = monitorResults.length - successfulChecks;
      const responseTimes = monitorResults
        .map((r) => r.responseTime)
        .filter((rt) => rt > 0)
        .sort((a, b) => a - b);

      // Calculate percentiles
      const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
      const p99Index = Math.ceil(responseTimes.length * 0.99) - 1;

      // Calculate downtime
      const downtimeIncidents = this.calculateDowntimeIncidents(monitorResults);

      return {
        id: monitor.id,
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        uptimePercentage:
          monitorResults.length > 0
            ? (successfulChecks / monitorResults.length) * 100
            : 0,
        totalChecks: monitorResults.length,
        successfulChecks,
        failedChecks,
        avgResponseTime:
          responseTimes.length > 0
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            : 0,
        minResponseTime: responseTimes.length > 0 ? responseTimes[0] : 0,
        maxResponseTime:
          responseTimes.length > 0
            ? responseTimes[responseTimes.length - 1]
            : 0,
        p95ResponseTime:
          responseTimes.length > 0 ? responseTimes[p95Index] || 0 : 0,
        p99ResponseTime:
          responseTimes.length > 0 ? responseTimes[p99Index] || 0 : 0,
        downtime: downtimeIncidents,
      };
    });

    // Calculate overall summary
    const totalChecks = checkResults.length;
    const totalSuccessful = checkResults.filter((r) => r.isUp).length;
    const allResponseTimes = checkResults
      .map((r) => r.responseTime)
      .filter((rt) => rt > 0);

    const summary = {
      totalMonitors: monitors.length,
      totalChecks,
      overallUptime:
        totalChecks > 0 ? (totalSuccessful / totalChecks) * 100 : 0,
      avgResponseTime:
        allResponseTimes.length > 0
          ? allResponseTimes.reduce((a, b) => a + b, 0) /
            allResponseTimes.length
          : 0,
    };

    return {
      format,
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      monitors: monitorReports,
      summary,
    };
  }

  private calculateDowntimeIncidents(results: CheckResult[]): {
    totalMinutes: number;
    incidents: number;
  } {
    let incidents = 0;
    let totalMinutes = 0;
    let currentDowntimeStart: Date | null = null;

    // Sort by date
    const sortedResults = [...results].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    for (const result of sortedResults) {
      if (!result.isUp && !currentDowntimeStart) {
        // Start of a downtime incident
        currentDowntimeStart = result.createdAt;
        incidents++;
      } else if (result.isUp && currentDowntimeStart) {
        // End of a downtime incident
        const duration =
          (result.createdAt.getTime() - currentDowntimeStart.getTime()) /
          (1000 * 60);
        totalMinutes += duration;
        currentDowntimeStart = null;
      }
    }

    // If still down at the end
    if (currentDowntimeStart) {
      const duration =
        (new Date().getTime() - currentDowntimeStart.getTime()) / (1000 * 60);
      totalMinutes += duration;
    }

    return { totalMinutes, incidents };
  }

  async exportReportAsCsv(
    userId: string,
    generateReportDto: GenerateReportDto,
  ): Promise<string> {
    const reportData = await this.generateReport(userId, {
      ...generateReportDto,
      format: ReportFormat.CSV,
    });

    // CSV Header
    const headers = [
      'Monitor Name',
      'URL',
      'Uptime %',
      'Total Checks',
      'Successful',
      'Failed',
      'Avg Response Time (ms)',
      'Min Response Time (ms)',
      'Max Response Time (ms)',
      'P95 Response Time (ms)',
      'P99 Response Time (ms)',
      'Downtime (minutes)',
      'Downtime Incidents',
    ];

    const rows = reportData.monitors.map((monitor) => [
      this.escapeCsvValue(monitor.monitorName),
      this.escapeCsvValue(monitor.monitorUrl),
      monitor.uptimePercentage.toFixed(2),
      monitor.totalChecks,
      monitor.successfulChecks,
      monitor.failedChecks,
      monitor.avgResponseTime.toFixed(2),
      monitor.minResponseTime,
      monitor.maxResponseTime,
      monitor.p95ResponseTime,
      monitor.p99ResponseTime,
      monitor.downtime.totalMinutes.toFixed(2),
      monitor.downtime.incidents,
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportReportAsJson(
    userId: string,
    generateReportDto: GenerateReportDto,
  ): Promise<ReportData> {
    return await this.generateReport(userId, {
      ...generateReportDto,
      format: ReportFormat.JSON,
    });
  }
}
