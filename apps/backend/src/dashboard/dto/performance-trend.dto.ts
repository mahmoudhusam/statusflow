export class PerformanceTrendDto {
  timestamp: Date;
  uptime: number; // percentage 0-100
  avgResponseTime: number | null; // milliseconds
}
