export type DashboardStats = {
  totalMonitors: number;
  activeMonitors: number;
  pausedMonitors: number;
  overallUptime: number | null;
  avgResponseTime: number | null;
  activeIncidents: number;
  criticalIncidents: number;
  warningIncidents: number;
};

export type IncidentStatus = 'critical' | 'warning' | 'resolved';

export type DashboardIncident = {
  id: string;
  monitorId: string | null;
  monitorName: string | null;
  status: IncidentStatus;
  duration: number;
  startedAt: string;
  resolvedAt: string | null;
  message: string;
};

export type NotificationType = 'alert' | 'incident' | 'system';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
};

export type DashboardNotifications = {
  unread: number;
  notifications: NotificationItem[];
};

export type PerformanceTrend = {
  timestamp: string;
  uptime: number;
  avgResponseTime: number | null;
};

export type MonitorStatusType = 'up' | 'down' | 'paused' | 'slow';

export type MonitorStatus = {
  id: string;
  name: string;
  url: string;
  status: MonitorStatusType;
  lastCheckedAt: string | null;
  responseTime: number | null;
};
