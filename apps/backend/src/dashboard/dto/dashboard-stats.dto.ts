export class DashboardStatsDto {
  totalMonitors: number;
  activeMonitors: number;
  pausedMonitors: number;
  overallUptime: number | null; // percentage 0-100, null if no data
  avgResponseTime: number | null; // milliseconds, null if no data
  activeIncidents: number;
  criticalIncidents: number;
  warningIncidents: number;
}
