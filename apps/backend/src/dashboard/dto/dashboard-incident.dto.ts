export class DashboardIncidentDto {
  id: string;
  monitorId: string | null;
  monitorName: string | null;
  status: 'critical' | 'warning' | 'resolved';
  duration: number; // milliseconds
  startedAt: Date;
  resolvedAt: Date | null;
  message: string;
}
