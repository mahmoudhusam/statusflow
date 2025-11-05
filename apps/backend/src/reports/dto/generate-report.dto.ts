import { IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
}

export class GenerateReportDto {
  @IsOptional()
  @IsArray()
  monitorIds?: string[];

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(ReportFormat)
  format: ReportFormat;
}

export interface MonitorReportData {
  id: string;
  monitorName: string;
  monitorUrl: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
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

export interface ReportData {
  format: ReportFormat;
  generatedAt: Date;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  monitors: MonitorReportData[];
  summary: {
    totalMonitors: number;
    totalChecks: number;
    overallUptime: number;
    avgResponseTime: number;
  };
}
