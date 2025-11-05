'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { monitorsApi } from '@/lib/api/monitors';
import { reportsApi } from '@/lib/api/reports';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import type { Monitor } from '@/types/monitor';
import type { ReportData } from '@/types/report';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type DateRangePreset = '24h' | '7d' | '30d' | 'custom';

export default function ReportsPage() {
  const { token } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    if (dateRangePreset === 'custom') {
      start = customStartDate
        ? startOfDay(new Date(customStartDate))
        : subDays(now, 7);
      end = customEndDate ? endOfDay(new Date(customEndDate)) : endOfDay(now);
    } else {
      switch (dateRangePreset) {
        case '24h':
          start = subDays(now, 1);
          break;
        case '7d':
          start = subDays(now, 7);
          break;
        case '30d':
          start = subDays(now, 30);
          break;
        default:
          start = subDays(now, 7);
      }
    }

    return { start, end };
  }, [dateRangePreset, customStartDate, customEndDate]);

  // Fetch monitors on component mount
  useEffect(() => {
    const fetchMonitors = async () => {
      if (!token) return;

      try {
        const data = await monitorsApi.getMonitors(token);
        setMonitors(data);
        // Select all monitors by default
        setSelectedMonitors(data.map((m) => m.id));
      } catch (err) {
        console.error('Failed to fetch monitors:', err);
        setError('Failed to load monitors');
      }
    };

    fetchMonitors();
  }, [token]);

  // Generate report
  const handleGenerateReport = async () => {
    if (!token || selectedMonitors.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await reportsApi.generateReport(
        {
          monitorIds: selectedMonitors,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        token
      );
      setReportData(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Export report as CSV
  const handleExportCsv = async () => {
    if (!token || selectedMonitors.length === 0) return;

    setExporting(true);
    try {
      const blob = await reportsApi.exportCsv(
        {
          monitorIds: selectedMonitors,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        token
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `status-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setError('Failed to export report as CSV');
    } finally {
      setExporting(false);
    }
  };

  // Export report as JSON
  const handleExportJson = async () => {
    if (!token || selectedMonitors.length === 0) return;

    setExporting(true);
    try {
      const blob = await reportsApi.exportJson(
        {
          monitorIds: selectedMonitors,
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        token
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `status-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export JSON:', err);
      setError('Failed to export report as JSON');
    } finally {
      setExporting(false);
    }
  };

  // Toggle monitor selection
  const toggleMonitor = (monitorId: string) => {
    setSelectedMonitors((prev) =>
      prev.includes(monitorId)
        ? prev.filter((id) => id !== monitorId)
        : [...prev, monitorId]
    );
  };

  // Select/deselect all monitors
  const toggleAllMonitors = () => {
    if (selectedMonitors.length === monitors.length) {
      setSelectedMonitors([]);
    } else {
      setSelectedMonitors(monitors.map((m) => m.id));
    }
  };

  // Prepare chart data
  const uptimeChartData = useMemo(() => {
    if (!reportData) return null;

    return {
      labels: reportData.monitors.map((m) => m.monitorName),
      datasets: [
        {
          label: 'Uptime %',
          data: reportData.monitors.map((m) => m.uptimePercentage),
          backgroundColor: reportData.monitors.map((m) =>
            m.uptimePercentage >= 99
              ? 'rgba(34, 197, 94, 0.8)'
              : m.uptimePercentage >= 95
                ? 'rgba(234, 179, 8, 0.8)'
                : 'rgba(239, 68, 68, 0.8)'
          ),
          borderColor: reportData.monitors.map((m) =>
            m.uptimePercentage >= 99
              ? 'rgb(34, 197, 94)'
              : m.uptimePercentage >= 95
                ? 'rgb(234, 179, 8)'
                : 'rgb(239, 68, 68)'
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [reportData]);

  const responseTimeChartData = useMemo(() => {
    if (!reportData) return null;

    return {
      labels: reportData.monitors.map((m) => m.monitorName),
      datasets: [
        {
          label: 'Avg Response Time (ms)',
          data: reportData.monitors.map((m) => m.avgResponseTime),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'P95 Response Time (ms)',
          data: reportData.monitors.map((m) => m.p95ResponseTime),
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [reportData]);

  const statusDistributionData = useMemo(() => {
    if (!reportData) return null;

    const totalSuccess = reportData.monitors.reduce(
      (sum, m) => sum + m.successfulChecks,
      0
    );
    const totalFailed = reportData.monitors.reduce(
      (sum, m) => sum + m.failedChecks,
      0
    );

    return {
      labels: ['Successful', 'Failed'],
      datasets: [
        {
          data: [totalSuccess, totalFailed],
          backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
          borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
          borderWidth: 1,
        },
      ],
    };
  }, [reportData]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to view reports</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">
          Generate comprehensive reports for your monitors
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Report Filters
        </h2>

        {/* Date Range Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {(['24h', '7d', '30d', 'custom'] as DateRangePreset[]).map(
              (preset) => (
                <button
                  key={preset}
                  onClick={() => setDateRangePreset(preset)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRangePreset === preset
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {preset === '24h'
                    ? 'Last 24 Hours'
                    : preset === '7d'
                      ? 'Last 7 Days'
                      : preset === '30d'
                        ? 'Last 30 Days'
                        : 'Custom Range'}
                </button>
              )
            )}
          </div>

          {dateRangePreset === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={customEndDate || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={customStartDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
          )}
        </div>

        {/* Monitor Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Monitors ({selectedMonitors.length} of {monitors.length}{' '}
              selected)
            </label>
            <button
              onClick={toggleAllMonitors}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedMonitors.length === monitors.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {monitors.map((monitor) => (
              <label
                key={monitor.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedMonitors.includes(monitor.id)}
                  onChange={() => toggleMonitor(monitor.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{monitor.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerateReport}
            disabled={loading || selectedMonitors.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting || !reportData}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={handleExportJson}
            disabled={exporting || !reportData}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <ErrorDisplay
            message={error}
            onRetry={handleGenerateReport}
            compact
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" message="Generating report..." />
        </div>
      )}

      {/* Report Results */}
      {reportData && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Monitors
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.summary.totalMonitors}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Average Uptime
              </div>
              <div className="text-3xl font-bold text-green-600">
                {reportData.summary.overallUptime
                  ? reportData.summary.overallUptime.toFixed(2)
                  : '0.00'}
                %
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Checks
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {reportData.summary.totalChecks.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Avg Response Time
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {reportData.summary.avgResponseTime
                  ? Math.round(reportData.summary.avgResponseTime)
                  : 0}
                ms
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Uptime Chart */}
            {uptimeChartData && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Uptime by Monitor
                </h3>
                <Bar
                  data={uptimeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => value + '%',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `Uptime: ${context.parsed.y?.toFixed(2) ?? 0}%`,
                        },
                      },
                    },
                  }}
                />
              </div>
            )}

            {/* Response Time Chart */}
            {responseTimeChartData && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Response Times</h3>
                <Line
                  data={responseTimeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => value + 'ms',
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) =>
                            `${context.dataset.label}: ${context.parsed.y?.toFixed(2) ?? 0}ms`,
                        },
                      },
                    },
                  }}
                />
              </div>
            )}

            {/* Status Distribution */}
            {statusDistributionData && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Check Status Distribution
                </h3>
                <div className="flex justify-center">
                  <div className="w-64">
                    <Doughnut
                      data={statusDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce(
                                  (a: number, b: number) => a + b,
                                  0
                                ) as number;
                                const percentage = (
                                  (value / total) *
                                  100
                                ).toFixed(1);
                                return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Monitor Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              Detailed Monitor Statistics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monitor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uptime
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Response
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P95
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Checks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downtime
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.monitors.map((monitor) => (
                    <tr
                      key={monitor.id || monitor.monitorId}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {monitor.monitorName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {monitor.monitorUrl}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            monitor.uptimePercentage >= 99
                              ? 'bg-green-100 text-green-800'
                              : monitor.uptimePercentage >= 95
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {monitor.uptimePercentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {monitor.avgResponseTime.toFixed(0)}ms
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {monitor.p95ResponseTime.toFixed(0)}ms
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {monitor.totalChecks} ({monitor.successfulChecks} ✓ /{' '}
                        {monitor.failedChecks} ✗)
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {Math.round(monitor.downtime.totalMinutes)} min
                        {monitor.downtime.incidents > 0 && (
                          <span className="text-gray-500 ml-1">
                            ({monitor.downtime.incidents}{' '}
                            {monitor.downtime.incidents === 1
                              ? 'incident'
                              : 'incidents'}
                            )
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div>
                <span className="font-medium">Report Period:</span>{' '}
                {format(
                  new Date(reportData.dateRange.startDate || dateRange.start),
                  'MMM d, yyyy HH:mm'
                )}{' '}
                -{' '}
                {format(
                  new Date(reportData.dateRange.endDate || dateRange.end),
                  'MMM d, yyyy HH:mm'
                )}
              </div>
              <div>
                <span className="font-medium">Generated:</span>{' '}
                {format(
                  new Date(reportData.generatedAt),
                  'MMM d, yyyy HH:mm:ss'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
