// File: apps/backend/src/reports/reports.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Monitor } from '../monitor/monitor.entity';
import { CheckResult } from '../check-result/check-result.entity';
import { GenerateReportDto } from './dto/generate-report.dto';

interface MonitorReport {
  monitorId: string;
  monitorName: string;
  monitorUrl: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  downtime: {
    totalMinutes: number;
    incidents: number;
  };
}

interface ReportData {
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  monitors: MonitorReport[];
  summary: {
    totalMonitors: number;
    avgUptimePercentage: number;
    totalChecks: number;
    totalDowntime: number;
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Monitor)
    private readonly monitorRepository: Repository<Monitor>,
    @InjectRepository(CheckResult)
    private readonly checkResultRepository: Repository<CheckResult>,
  ) {}

  /**
   * Generate a comprehensive report for selected monitors
   */
  async generateReport(
    userId: string,
    generateReportDto: GenerateReportDto,
  ): Promise<ReportData> {
    const { monitorIds, startDate, endDate } = generateReportDto;

    // Verify all monitors belong to the user
    const monitors = await this.monitorRepository.find({
      where: {
        id: In(monitorIds),
        userId,
      },
    });

    if (monitors.length !== monitorIds.length) {
      throw new NotFoundException('One or more monitors not found');
    }

    // Generate reports for each monitor
    const monitorReports = await Promise.all(
      monitors.map((monitor) =>
        this.generateMonitorReport(
          monitor,
          new Date(startDate),
          new Date(endDate),
        ),
      ),
    );

    // Calculate summary statistics
    const summary = this.calculateSummary(monitorReports);

    return {
      dateRange: {
        start: startDate,
        end: endDate,
      },
      generatedAt: new Date().toISOString(),
      monitors: monitorReports,
      summary,
    };
  }

  /**
   * Generate report for a single monitor
   */
  private async generateMonitorReport(
    monitor: Monitor,
    startDate: Date,
    endDate: Date,
  ): Promise<MonitorReport> {
    // Fetch all check results for the monitor within the date range
    const checkResults = await this.checkResultRepository.find({
      where: {
        monitorId: monitor.id,
        createdAt: Between(startDate, endDate),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const totalChecks = checkResults.length;
    const successfulChecks = checkResults.filter((r) => r.success).length;
    const failedChecks = totalChecks - successfulChecks;
    const uptimePercentage =
      totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

    // Calculate response time statistics
    const responseTimes = checkResults
      .filter((r) => r.success && r.responseTime !== null)
      .map((r) => r.responseTime);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    // Calculate percentiles
    const sortedResponseTimes = [...responseTimes].sort((a, b) => a - b);
    const p95ResponseTime = this.calculatePercentile(sortedResponseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(sortedResponseTimes, 99);

    // Calculate downtime
    const downtime = this.calculateDowntime(
      checkResults,
      monitor.checkInterval,
    );

    return {
      monitorId: monitor.id,
      monitorName: monitor.name,
      monitorUrl: monitor.url,
      totalChecks,
      successfulChecks,
      failedChecks,
      uptimePercentage,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      downtime,
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(
    sortedArray: number[],
    percentile: number,
  ): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Calculate downtime from check results
   */
  private calculateDowntime(
    checkResults: CheckResult[],
    checkInterval: number,
  ): { totalMinutes: number; incidents: number } {
    let totalMinutes = 0;
    let incidents = 0;
    let currentIncidentStart: Date | null = null;

    for (let i = 0; i < checkResults.length; i++) {
      const result = checkResults[i];

      if (!result.success && currentIncidentStart === null) {
        // Start of a new incident
        currentIncidentStart = result.createdAt;
        incidents++;
      } else if (result.success && currentIncidentStart !== null) {
        // End of an incident
        const incidentDuration =
          (result.createdAt.getTime() - currentIncidentStart.getTime()) /
          (1000 * 60);
        totalMinutes += incidentDuration;
        currentIncidentStart = null;
      }
    }

    // If there's an ongoing incident at the end
    if (currentIncidentStart !== null && checkResults.length > 0) {
      const lastCheck = checkResults[checkResults.length - 1];
      const incidentDuration =
        (lastCheck.createdAt.getTime() - currentIncidentStart.getTime()) /
        (1000 * 60);
      totalMinutes += incidentDuration;
    }

    return {
      totalMinutes,
      incidents,
    };
  }

  /**
   * Calculate summary statistics from all monitor reports
   */
  private calculateSummary(monitorReports: MonitorReport[]): {
    totalMonitors: number;
    avgUptimePercentage: number;
    totalChecks: number;
    totalDowntime: number;
  } {
    const totalMonitors = monitorReports.length;
    const avgUptimePercentage =
      totalMonitors > 0
        ? monitorReports.reduce((sum, r) => sum + r.uptimePercentage, 0) /
          totalMonitors
        : 0;
    const totalChecks = monitorReports.reduce(
      (sum, r) => sum + r.totalChecks,
      0,
    );
    const totalDowntime = monitorReports.reduce(
      (sum, r) => sum + r.downtime.totalMinutes,
      0,
    );

    return {
      totalMonitors,
      avgUptimePercentage,
      totalChecks,
      totalDowntime,
    };
  }

  /**
   * Export report as CSV
   */
  async exportCsv(
    userId: string,
    generateReportDto: GenerateReportDto,
  ): Promise<string> {
    const reportData = await this.generateReport(userId, generateReportDto);

    // CSV Header
    const headers = [
      'Monitor Name',
      'URL',
      'Uptime %',
      'Total Checks',
      'Successful',
      'Failed',
      'Avg Response (ms)',
      'Min Response (ms)',
      'Max Response (ms)',
      'P95 Response (ms)',
      'P99 Response (ms)',
      'Downtime (min)',
      'Incidents',
    ];

    // CSV Rows
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

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Escape CSV values to handle commas and quotes
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Export report as JSON
   */
  async exportJson(
    userId: string,
    generateReportDto: GenerateReportDto,
  ): Promise<ReportData> {
    return await this.generateReport(userId, generateReportDto);
  }
}
