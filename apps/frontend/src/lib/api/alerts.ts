import { apiClient } from '../api-client';
import type {
  AlertRule,
  NotificationChannel,
  NotificationChannelConfig,
  AlertHistory,
  AlertTemplate,
} from '@/types/alert';

interface CreateAlertRuleData {
  name: string;
  description?: string;
  type: string;
  severity: string;
  enabled?: boolean;
  monitorId?: string;
  conditions: Record<string, unknown>;
  channels: Record<string, unknown>;
}

type UpdateAlertRuleData = Partial<CreateAlertRuleData>;

interface CreateNotificationChannelData {
  name: string;
  type: string;
  enabled?: boolean;
  isDefault?: boolean;
  configuration: NotificationChannelConfig;
  quietHours?: Record<string, unknown>;
}

type UpdateNotificationChannelData = Partial<CreateNotificationChannelData>;

interface TestChannelResponse {
  success: boolean;
  message: string;
}

export const alertsApi = {
  // Alert Rules
  async getAlertRules(token: string, monitorId?: string): Promise<AlertRule[]> {
    const params = monitorId ? `?monitorId=${monitorId}` : '';
    return apiClient.get<AlertRule[]>(`/alerts/rules${params}`, token);
  },

  async getAlertRule(id: string, token: string): Promise<AlertRule> {
    return apiClient.get<AlertRule>(`/alerts/rules/${id}`, token);
  },

  async createAlertRule(
    data: CreateAlertRuleData,
    token: string
  ): Promise<AlertRule> {
    return apiClient.post<AlertRule>('/alerts/rules', data, token);
  },

  async updateAlertRule(
    id: string,
    data: UpdateAlertRuleData,
    token: string
  ): Promise<AlertRule> {
    return apiClient.patch<AlertRule>(`/alerts/rules/${id}`, data, token);
  },

  async deleteAlertRule(id: string, token: string): Promise<void> {
    return apiClient.delete<void>(`/alerts/rules/${id}`, token);
  },

  // Notification Channels
  async getNotificationChannels(token: string): Promise<NotificationChannel[]> {
    return apiClient.get<NotificationChannel[]>('/alerts/channels', token);
  },

  async getNotificationChannel(
    id: string,
    token: string
  ): Promise<NotificationChannel> {
    return apiClient.get<NotificationChannel>(`/alerts/channels/${id}`, token);
  },

  async createNotificationChannel(
    data: CreateNotificationChannelData,
    token: string
  ): Promise<NotificationChannel> {
    return apiClient.post<NotificationChannel>('/alerts/channels', data, token);
  },

  async updateNotificationChannel(
    id: string,
    data: UpdateNotificationChannelData,
    token: string
  ): Promise<NotificationChannel> {
    return apiClient.patch<NotificationChannel>(
      `/alerts/channels/${id}`,
      data,
      token
    );
  },

  async deleteNotificationChannel(id: string, token: string): Promise<void> {
    return apiClient.delete<void>(`/alerts/channels/${id}`, token);
  },

  async testNotificationChannel(
    id: string,
    token: string
  ): Promise<TestChannelResponse> {
    return apiClient.post<TestChannelResponse>(
      `/alerts/channels/${id}/test`,
      {},
      token
    );
  },

  // Alert History
  async getAlertHistory(
    token: string,
    filters?: {
      monitorId?: string;
      status?: string;
      from?: Date;
      to?: Date;
    }
  ): Promise<AlertHistory[]> {
    const params = new URLSearchParams();
    if (filters?.monitorId) params.append('monitorId', filters.monitorId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.from) params.append('from', filters.from.toISOString());
    if (filters?.to) params.append('to', filters.to.toISOString());

    const queryString = params.toString();
    return apiClient.get<AlertHistory[]>(
      `/alerts/history${queryString ? `?${queryString}` : ''}`,
      token
    );
  },

  async getAlertHistoryItem(id: string, token: string): Promise<AlertHistory> {
    return apiClient.get<AlertHistory>(`/alerts/history/${id}`, token);
  },

  async acknowledgeAlert(id: string, token: string): Promise<AlertHistory> {
    return apiClient.patch<AlertHistory>(
      `/alerts/history/${id}/acknowledge`,
      {},
      token
    );
  },

  async resolveAlert(id: string, token: string): Promise<AlertHistory> {
    return apiClient.patch<AlertHistory>(
      `/alerts/history/${id}/resolve`,
      {},
      token
    );
  },

  // Templates
  async getAlertTemplates(token: string): Promise<AlertTemplate[]> {
    return apiClient.get<AlertTemplate[]>('/alerts/templates', token);
  },
};
