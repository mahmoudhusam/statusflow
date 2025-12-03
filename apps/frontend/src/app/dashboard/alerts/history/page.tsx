'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { alertsApi } from '@/lib/api/alerts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { format } from 'date-fns';
import type { AlertHistory } from '@/types/alert';

export default function AlertHistoryPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '7d',
  });

  const fetchAlertHistory = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const from = new Date();
      if (filters.dateRange === '24h') {
        from.setDate(from.getDate() - 1);
      } else if (filters.dateRange === '7d') {
        from.setDate(from.getDate() - 7);
      } else if (filters.dateRange === '30d') {
        from.setDate(from.getDate() - 30);
      }

      const data = await alertsApi.getAlertHistory(token, {
        status: filters.status !== 'all' ? filters.status : undefined,
        from,
        to: new Date(),
      });

      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch alert history:', err);
      setError('Failed to load alert history');
    } finally {
      setLoading(false);
    }
  }, [token, filters.status, filters.dateRange]);

  useEffect(() => {
    fetchAlertHistory();
  }, [fetchAlertHistory]);

  const handleAcknowledge = async (id: string) => {
    try {
      await alertsApi.acknowledgeAlert(id, token!);
      fetchAlertHistory();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertsApi.resolveAlert(id, token!);
      fetchAlertHistory();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message="Loading alert history..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load alert history"
        message={error}
        onRetry={fetchAlertHistory}
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="all">All</option>
              <option value="triggered">Triggered</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters({ ...filters, dateRange: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert History Table */}
      {history.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-600">
            No alerts found for the selected filters
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Triggered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'triggered'
                          ? 'bg-red-100 text-red-800'
                          : item.status === 'acknowledged'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.message}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.monitor?.name || 'Global'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(item.triggeredAt), 'MMM d, HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.status === 'triggered' && (
                        <>
                          <button
                            onClick={() => handleAcknowledge(item.id)}
                            className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolve(item.id)}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {item.status === 'acknowledged' && (
                        <button
                          onClick={() => handleResolve(item.id)}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
