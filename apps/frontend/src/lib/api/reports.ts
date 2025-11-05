import { apiClient } from '../api-client';
import type { ReportData, ReportFilters } from '@/types/report';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const reportsApi = {
  /**
   * Generate a report based on the provided filters
   */
  async generateReport(
    filters: ReportFilters,
    token: string
  ): Promise<ReportData> {
    return await apiClient.post<ReportData>(
      '/reports/generate',
      {
        monitorIds: filters.monitorIds,
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        format: 'json',
      },
      token
    );
  },

  /**
   * Export report data as CSV
   */
  async exportCsv(filters: ReportFilters, token: string): Promise<Blob> {
    const queryParams = new URLSearchParams({
      startDate: filters.startDate.toISOString(),
      endDate: filters.endDate.toISOString(),
      format: 'csv',
    });

    // Add monitor IDs as array params
    filters.monitorIds.forEach((id) => {
      queryParams.append('monitorIds', id);
    });

    const response = await fetch(
      `${API_BASE_URL}/reports/export/csv?${queryParams}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export CSV: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Export report data as JSON
   */
  async exportJson(filters: ReportFilters, token: string): Promise<Blob> {
    const queryParams = new URLSearchParams({
      startDate: filters.startDate.toISOString(),
      endDate: filters.endDate.toISOString(),
      format: 'json',
    });

    // Add monitor IDs as array params
    filters.monitorIds.forEach((id) => {
      queryParams.append('monitorIds', id);
    });

    const response = await fetch(
      `${API_BASE_URL}/reports/export/json?${queryParams}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export JSON: ${response.statusText}`);
    }

    return response.blob();
  },
};
