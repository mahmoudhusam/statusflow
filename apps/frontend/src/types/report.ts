export interface MonitorReport {
  id: string; // This might be the monitor ID
  monitorId?: string; // Alternative ID field
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
  format: 'json' | 'csv' | 'pdf';
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  monitors: MonitorReport[];
  summary: {
    totalMonitors: number;
    totalChecks: number;
    overallUptime: number;
    avgResponseTime: number;
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
