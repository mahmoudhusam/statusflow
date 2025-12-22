import { apiClient } from '../api-client';
import type {
  DashboardStats,
  DashboardIncident,
  DashboardNotifications,
  PerformanceTrend,
  MonitorStatus,
} from '@/types/dashboard';

export type IncidentSortOrder = 'latest' | 'oldest';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const dashboardApi = {
  async getStats(token: string): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      '/dashboard/stats',
      token
    );
    return response.data;
  },

  async getIncidents(
    token: string,
    options?: { limit?: number; sort?: IncidentSortOrder }
  ): Promise<DashboardIncident[]> {
    const params = new URLSearchParams();
    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options?.sort) {
      params.set('sort', options.sort);
    }
    const queryString = params.toString();
    const url = queryString
      ? `/dashboard/incidents?${queryString}`
      : '/dashboard/incidents';

    const response = await apiClient.get<ApiResponse<DashboardIncident[]>>(
      url,
      token
    );
    return response.data;
  },

  async getNotifications(token: string): Promise<DashboardNotifications> {
    const response = await apiClient.get<ApiResponse<DashboardNotifications>>(
      '/dashboard/notifications',
      token
    );
    return response.data;
  },

  async getPerformanceTrends(
    token: string,
    hours?: number
  ): Promise<PerformanceTrend[]> {
    const url = hours
      ? `/dashboard/performance-trends?hours=${hours}`
      : '/dashboard/performance-trends';

    const response = await apiClient.get<ApiResponse<PerformanceTrend[]>>(
      url,
      token
    );
    return response.data;
  },

  async getMonitorStatuses(token: string): Promise<MonitorStatus[]> {
    const response = await apiClient.get<ApiResponse<MonitorStatus[]>>(
      '/dashboard/monitor-statuses',
      token
    );
    return response.data;
  },
};
