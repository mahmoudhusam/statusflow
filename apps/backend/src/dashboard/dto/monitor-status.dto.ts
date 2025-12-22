export type MonitorStatusType = 'up' | 'down' | 'paused' | 'slow';

export class MonitorStatusDto {
  id: string;
  name: string;
  url: string;
  status: MonitorStatusType;
  lastCheckedAt: Date | null;
  responseTime: number | null; // ms
}
