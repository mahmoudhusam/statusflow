export interface MonitorReport {
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

export interface ReportData {
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

export interface ReportFilters {
  monitorIds: string[];
  startDate: Date;
  endDate: Date;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  includeCharts?: boolean;
}
