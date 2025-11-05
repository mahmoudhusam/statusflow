
import { apiClient } from '../api-client';
import type { ReportData, ReportFilters } from '@/types/report';

export const reportsApi = {
  /**
   * Generate a report based on the provided filters
   */
  async generateReport(
    filters: ReportFilters,
    token: string
  ): Promise<ReportData> {
    const response = await apiClient.post<ReportData>(
      '/reports/generate',
      {
        monitorIds: filters.monitorIds,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Export report data as CSV
   */
  async exportCsv(filters: ReportFilters, token: string): Promise<Blob> {
    const response = await apiClient.post(
      '/reports/export/csv',
      {
        monitorIds: filters.monitorIds,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Export report data as JSON
   */
  async exportJson(filters: ReportFilters, token: string): Promise<Blob> {
    const response = await apiClient.post(
      '/reports/export/json',
      {
        monitorIds: filters.monitorIds,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
