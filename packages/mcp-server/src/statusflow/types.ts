export type MonitorStatus = 'up' | 'down' | 'paused';

export type Monitor = {
  id: string;
  name: string;
  url: string;
  status: MonitorStatus;
  interval: number;
  lastCheckedAt: string | null;
};

export type DashboardStats = {
  totalMonitors: number;
  monitorsUp: number;
  monitorsDown: number;
  averageUptime: number | null;
};

export type Incident = {
  id: string;
  monitorId: string;
  monitorName: string | null;
  startedAt: string;
  resolvedAt: string | null;
  duration: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type MonitorApiItem = {
  id: string;
  name: string;
  url: string;
  interval: number;
  paused: boolean;
  latestStatus: {
    checkedAt?: string;
    createdAt?: string;
    isUp: boolean;
  } | null;
};

export type DashboardStatsApiData = {
  totalMonitors: number;
  overallUptime: number | null;
};

export type MonitorStatusApiItem = {
  id: string;
  status: 'up' | 'down' | 'paused' | 'slow';
};

export type DashboardIncidentApiItem = {
  id: string;
  monitorId: string | null;
  monitorName: string | null;
  startedAt: string;
  resolvedAt: string | null;
  duration: number;
};
