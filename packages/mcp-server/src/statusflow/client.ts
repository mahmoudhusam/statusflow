import {
  ApiSuccessResponse,
  DashboardIncidentApiItem,
  DashboardStats,
  DashboardStatsApiData,
  Incident,
  Monitor,
  MonitorApiItem,
  MonitorStatus,
  MonitorStatusApiItem,
} from './types';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export class StatusFlowClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // TODO: backend currently expects JWT Bearer token; use a dedicated API key once backend supports it.
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `StatusFlow API error (${response.status} ${response.statusText}) on ${method} ${path}: ${errorText}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json()) as T;
    return data;
  }

  private mapMonitor(raw: MonitorApiItem): Monitor {
    let status: MonitorStatus;
    if (raw.paused) {
      status = 'paused';
    } else if (raw.latestStatus?.isUp === false) {
      status = 'down';
    } else {
      status = 'up';
    }

    return {
      id: raw.id,
      name: raw.name,
      url: raw.url,
      status,
      interval: raw.interval,
      lastCheckedAt:
        raw.latestStatus?.checkedAt ?? raw.latestStatus?.createdAt ?? null,
    };
  }

  async getMonitors(): Promise<Monitor[]> {
    const monitors = await this.request<MonitorApiItem[]>('GET', '/monitors');
    return monitors.map((item) => this.mapMonitor(item));
  }

  async getMonitor(id: string): Promise<Monitor> {
    const monitor = await this.request<MonitorApiItem>(
      'GET',
      `/monitors/${id}`,
    );
    return this.mapMonitor(monitor);
  }

  async pauseMonitor(id: string): Promise<void> {
    await this.request<{ message: string }>('PATCH', `/monitors/${id}/pause`);
  }

  async resumeMonitor(id: string): Promise<void> {
    await this.request<{ message: string }>('PATCH', `/monitors/${id}/resume`);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const statsResponse = await this.request<
      ApiSuccessResponse<DashboardStatsApiData>
    >('GET', '/dashboard/stats');
    const monitorStatusesResponse = await this.request<
      ApiSuccessResponse<MonitorStatusApiItem[]>
    >('GET', '/dashboard/monitor-statuses');

    const statuses = monitorStatusesResponse.data;
    const monitorsUp = statuses.filter((item) => item.status === 'up').length;
    const monitorsDown = statuses.filter(
      (item) => item.status === 'down',
    ).length;

    return {
      totalMonitors: statsResponse.data.totalMonitors,
      monitorsUp,
      monitorsDown,
      averageUptime: statsResponse.data.overallUptime,
    };
  }

  async getIncidents(monitorId?: string): Promise<Incident[]> {
    const incidentsResponse = await this.request<
      ApiSuccessResponse<DashboardIncidentApiItem[]>
    >('GET', '/dashboard/incidents');

    const incidents = incidentsResponse.data
      .filter((item) => (monitorId ? item.monitorId === monitorId : true))
      .map((item) => ({
        id: item.id,
        monitorId: item.monitorId ?? '',
        monitorName: item.monitorName,
        startedAt: item.startedAt,
        resolvedAt: item.resolvedAt,
        duration: item.duration,
      }));

    return incidents;
  }
}
