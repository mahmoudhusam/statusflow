import { apiClient } from '../api-client';
import type { Monitor, MonitorStats } from '@/types/monitor';

export interface CreateMonitorDto {
  name: string;
  url: string;
  interval: number;
  httpMethod?: string;
  timeout?: number;
  headers?: Record<string, string>;
  body?: string;
  maxLatencyMs?: number;
  maxConsecutiveFailures?: number;
}

export interface UpdateMonitorDto extends Partial<CreateMonitorDto> {
  paused?: boolean;
}

export interface MonitorMetricsQuery {
  from: Date;
  to: Date;
  interval?: string;
}

export const monitorsApi = {
  // Get all monitors for the current user
  async getMonitors(token: string): Promise<Monitor[]> {
    return apiClient.get<Monitor[]>('/monitors', token);
  },

  // Get single monitor details
  async getMonitor(id: string, token: string): Promise<Monitor> {
    return apiClient.get<Monitor>(`/monitors/${id}`, token);
  },

  // Create new monitor
  async createMonitor(data: CreateMonitorDto, token: string): Promise<Monitor> {
    return apiClient.post<Monitor>('/monitors', data, token);
  },

  // Update monitor
  async updateMonitor(
    id: string,
    data: UpdateMonitorDto,
    token: string
  ): Promise<Monitor> {
    return apiClient.patch<Monitor>(`/monitors/${id}`, data, token);
  },

  // Delete monitor
  async deleteMonitor(id: string, token: string): Promise<void> {
    return apiClient.delete<void>(`/monitors/${id}`, token);
  },

  // Pause monitor
  async pauseMonitor(id: string, token: string): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `/monitors/${id}/pause`,
      {},
      token
    );
  },

  // Resume monitor
  async resumeMonitor(id: string, token: string): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(
      `/monitors/${id}/resume`,
      {},
      token
    );
  },

  // Get monitor stats
  async getMonitorStats(id: string, token: string): Promise<MonitorStats> {
    return apiClient.get<MonitorStats>(`/monitors/${id}/stats`, token);
  },

  // Get monitor metrics with time range
  async getMonitorMetrics(
    id: string,
    query: MonitorMetricsQuery,
    token: string
  ): Promise<any> {
    const params = new URLSearchParams({
      from: query.from.toISOString(),
      to: query.to.toISOString(),
      ...(query.interval && { interval: query.interval }),
    });
    return apiClient.get<any>(`/monitors/${id}/metrics?${params}`, token);
  },
};
