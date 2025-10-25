'use client';

import { useState, useMemo, useCallback } from 'react';
import type {
  Monitor,
  CheckResult,
  TimeRange,
  MonitorStats,
} from '@/types/monitor';
import { formatRelative } from 'date-fns/formatRelative';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAsyncData, simulateApiCall } from '@/hooks/useAsyncData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonitorDetailsComponentProps {
  monitor: Monitor;
}

// Helper function to generate mock check results for demonstration
async function fetchCheckResults(
  monitorId: string,
  timeRange: TimeRange
): Promise<CheckResult[]> {
  const now = new Date();
  const results: CheckResult[] = [];

  let hoursBack = 1;
  let intervalMinutes = 1;

  switch (timeRange) {
    case '1h':
      hoursBack = 1;
      intervalMinutes = 1;
      break;
    case '24h':
      hoursBack = 24;
      intervalMinutes = 5;
      break;
    case '7d':
      hoursBack = 24 * 7;
      intervalMinutes = 30;
      break;
    case '30d':
      hoursBack = 24 * 30;
      intervalMinutes = 120;
      break;
  }

  const totalMinutesBack = hoursBack * 60;
  const checks = Math.floor(totalMinutesBack / intervalMinutes);

  for (let i = 0; i < checks; i++) {
    const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
    const seed = monitorId.charCodeAt(0) + i;
    const isUp = seed % 7 !== 0;
    const baseLatency = 100 + (seed % 200);
    const latency = isUp ? baseLatency + Math.random() * 100 : undefined;

    results.push({
      id: `check-${i}`,
      timestamp: timestamp.toISOString(),
      status: isUp ? 'UP' : 'DOWN',
      statusCode: isUp ? (seed % 2 === 0 ? 200 : 201) : 400 + (seed % 100),
      responseTimeMs: latency ? Math.round(latency) : undefined,
      errorMessage: isUp ? undefined : 'Connection timeout',
    });
  }

  // Simulate API call
  return simulateApiCall(results.reverse(), {
    delay: 600,
    // Uncomment to test error handling
    // shouldFail: true
  });
}

// Calculate monitor statistics from check results
function calculateStats(checkResults: CheckResult[]): MonitorStats {
  const totalChecks = checkResults.length;
  const upChecks = checkResults.filter((r) => r.status === 'UP').length;
  const errorCount = totalChecks - upChecks;

  const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;

  const responseTimes = checkResults
    .filter((r) => r.responseTimeMs !== undefined)
    .map((r) => r.responseTimeMs!)
    .sort((a, b) => a - b);

  const averageLatency =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
  const p95Latency =
    responseTimes.length > 0 ? responseTimes[p95Index] || 0 : 0;

  return {
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    averageLatency: Math.round(averageLatency),
    p95Latency: Math.round(p95Latency),
    errorCount,
    totalChecks,
  };
}

// Prepare chart data from check results
function prepareChartData(checkResults: CheckResult[], timeRange: TimeRange) {
  if (!checkResults.length) {
    return { uptimeData: null, latencyData: null };
  }

  const groupSize =
    timeRange === '1h'
      ? 6
      : timeRange === '24h'
        ? 12
        : timeRange === '7d'
          ? 24
          : 48;
  const groups: CheckResult[][] = [];

  for (let i = 0; i < checkResults.length; i += groupSize) {
    groups.push(checkResults.slice(i, i + groupSize));
  }

  const labels: string[] = [];
  const uptimePercentages: number[] = [];
  const avgLatencies: number[] = [];
  const p95Latencies: number[] = [];

  groups.forEach((group) => {
    if (group.length === 0) return;

    const firstCheck = group[0];
    const upCount = group.filter((r) => r.status === 'UP').length;
    const uptimePercentage = (upCount / group.length) * 100;

    const latencies = group
      .filter((r) => r.responseTimeMs !== undefined)
      .map((r) => r.responseTimeMs!);

    const avgLatency =
      latencies.length > 0
        ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
        : 0;

    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
    const p95Latency =
      sortedLatencies.length > 0 ? sortedLatencies[p95Index] || 0 : 0;

    const date = new Date(firstCheck.timestamp);
    let label = '';

    if (timeRange === '1h') {
      label = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (timeRange === '24h') {
      label = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (timeRange === '7d') {
      label = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
      });
    } else {
      label = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    labels.push(label);
    uptimePercentages.push(Math.round(uptimePercentage * 100) / 100);
    avgLatencies.push(Math.round(avgLatency));
    p95Latencies.push(Math.round(p95Latency));
  });

  const uptimeData = {
    labels,
    datasets: [
      {
        label: 'Uptime %',
        data: uptimePercentages,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const latencyData = {
    labels,
    datasets: [
      {
        label: 'Average Latency (ms)',
        data: avgLatencies,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: '95th Percentile (ms)',
        data: p95Latencies,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  };

  return { uptimeData, latencyData };
}

export function MonitorDetailsComponent({
  monitor,
}: MonitorDetailsComponentProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [refreshKey, setRefreshKey] = useState(0);

  const timeRangeOptions: {
    value: TimeRange;
    label: string;
    description: string;
  }[] = [
    { value: '1h', label: 'Last Hour', description: 'Past 60 minutes' },
    { value: '24h', label: 'Last 24 Hours', description: 'Past day' },
    { value: '7d', label: 'Last 7 Days', description: 'Past week' },
    { value: '30d', label: 'Last 30 Days', description: 'Past month' },
  ];

  // Fetch check results with loading and error handling
  const fetchCheckResultsFn = useCallback(
    () => fetchCheckResults(monitor.id, selectedTimeRange),
    [monitor.id, selectedTimeRange]
  );

  const {
    data: checkResults,
    loading: isLoadingMetrics,
    error: metricsError,
    retry: retryMetrics,
  } = useAsyncData<CheckResult[]>(
    fetchCheckResultsFn,
    [selectedTimeRange, refreshKey],
    {
      simulateDelay: 600,
      simulateErrorRate: 0, // Set to 0.2 to test error handling
      retryCount: 3,
      retryDelay: 1000,
    }
  );

  const stats = useMemo(
    () => (checkResults ? calculateStats(checkResults) : null),
    [checkResults]
  );

  const { uptimeData, latencyData } = useMemo(
    () =>
      checkResults
        ? prepareChartData(checkResults, selectedTimeRange)
        : { uptimeData: null, latencyData: null },
    [checkResults, selectedTimeRange]
  );

  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  const isUp = monitor.id.charCodeAt(0) % 2 === 0;

  // Chart options
  const uptimeChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Uptime Percentage Over Time',
        font: { size: 16, weight: 'bold' },
        color: '#374151',
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function (context) {
            return `Uptime: ${context.parsed.y.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#6B7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Uptime %',
          color: '#6B7280',
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const latencyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Response Time Trends',
        font: { size: 16, weight: 'bold' },
        color: '#374151',
      },
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y}ms`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#6B7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Response Time (ms)',
          color: '#6B7280',
        },
        min: 0,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setSelectedTimeRange(newRange);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/dashboard/monitors"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          ← Back to Monitors
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {monitor.name}
              {monitor.paused && (
                <span className="ml-3 text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 ">
                  Paused
                </span>
              )}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600  font-mono">
                {monitor.url}
              </span>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  isUp
                    ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                    : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                }`}
              >
                {isUp ? '🟢 UP' : '🔴 DOWN'}
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 font-medium shadow-sm"
            disabled={isLoadingMetrics}
          >
            <svg
              className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Monitor Metadata */}
        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500 ">
                Created:
              </span>
              <div className="text-gray-900 ">
                {monitor.createdAt
                  ? new Date(monitor.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 ">
                Method:
              </span>
              <div className="text-gray-900  font-mono">
                {monitor.httpMethod || 'GET'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 ">
                Interval:
              </span>
              <div className="text-gray-900 ">
                {monitor.interval ? `${monitor.interval}s` : 'Default'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 ">
                Last Check:
              </span>
              <div className="text-gray-900 ">
                {lastChecked}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Time Range Selector */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 ">
              Time Range:
            </span>
            {stats && (
              <span className="text-xs text-gray-500 ">
                ({stats.totalChecks} total checks)
              </span>
            )}
          </div>

          {/* Button Group for Time Range Selection */}
          <div className="inline-flex rounded-lg bg-gray-100 p-1 shadow-inner">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeRangeChange(option.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  selectedTimeRange === option.value
                    ? 'bg-white text-blue-700 shadow font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoadingMetrics && (
            <div className="flex items-center gap-2 text-sm text-gray-500 ">
              <LoadingSpinner size="small" message="" />
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Error Display for Metrics */}
      {metricsError && (
        <div className="mb-8">
          <ErrorDisplay
            title="Failed to load metrics"
            message="We couldn't fetch the monitoring data. Please try again."
            error={metricsError}
            onRetry={retryMetrics}
            compact
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="mb-8 space-y-8">
        {/* Uptime Chart */}
        {isLoadingMetrics ? (
          <SkeletonLoader variant="chart" />
        ) : !metricsError && uptimeData ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="h-64">
              <Line data={uptimeData} options={uptimeChartOptions} />
            </div>
          </div>
        ) : null}

        {/* Latency Chart */}
        {isLoadingMetrics ? (
          <SkeletonLoader variant="chart" />
        ) : !metricsError && latencyData ? (
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="h-64">
              <Line data={latencyData} options={latencyChartOptions} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoadingMetrics ? (
          <>
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
            <SkeletonLoader variant="metric" />
          </>
        ) : stats && !metricsError ? (
          <>
            {/* Uptime */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Uptime</h3>
                <div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    stats.uptimePercentage >= 99
                      ? 'bg-green-500'
                      : stats.uptimePercentage >= 95
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                ></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.uptimePercentage.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500  mt-1">
                {stats.totalChecks - stats.errorCount} / {stats.totalChecks}{' '}
                checks successful
              </div>
            </div>

            {/* Average Latency */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  Avg Latency
                </h3>
                <div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    stats.averageLatency <= 200
                      ? 'bg-green-500'
                      : stats.averageLatency <= 500
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                ></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.averageLatency}ms
              </div>
              <div className="text-xs text-gray-500  mt-1">
                Average response time
              </div>
            </div>

            {/* 95th Percentile */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  95th Percentile
                </h3>
                <div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    stats.p95Latency <= 300
                      ? 'bg-green-500'
                      : stats.p95Latency <= 800
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                ></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.p95Latency}ms
              </div>
              <div className="text-xs text-gray-500  mt-1">
                95% of requests faster than
              </div>
            </div>

            {/* Error Count */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Errors</h3>
                <div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    stats.errorCount === 0
                      ? 'bg-green-500'
                      : stats.errorCount <= 5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                ></div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.errorCount}
              </div>
              <div className="text-xs text-gray-500  mt-1">
                Failed checks in{' '}
                {timeRangeOptions
                  .find((opt) => opt.value === selectedTimeRange)
                  ?.description.toLowerCase()}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Recent Check Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 ">
                Recent Checks
              </h2>
              {checkResults && !metricsError && (
                <p className="text-sm text-gray-500 ">
                  Showing last {Math.min(10, checkResults.length)} checks from{' '}
                  {timeRangeOptions
                    .find((opt) => opt.value === selectedTimeRange)
                    ?.description.toLowerCase()}
                </p>
              )}
            </div>
            {isLoadingMetrics && <LoadingSpinner size="small" message="" />}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  uppercase tracking-wider">
                  Status Code
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoadingMetrics ? (
                <>
                  <SkeletonLoader variant="row" count={5} />
                </>
              ) : checkResults && !metricsError ? (
                checkResults
                  .slice(-10)
                  .reverse()
                  .map((result) => (
                    <tr
                      key={result.id}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ">
                        {new Date(result.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.status === 'UP'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ">
                        {result.responseTimeMs
                          ? `${result.responseTimeMs}ms`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 ">
                        {result.statusCode || '-'}
                      </td>
                    </tr>
                  ))
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 ">
            Configuration
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900  mb-3">
                Request Settings
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">Timeout:</dt>
                  <dd className="text-gray-900 ">
                    {monitor.timeout ? `${monitor.timeout}ms` : 'Default'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">
                    Max Latency:
                  </dt>
                  <dd className="text-gray-900 ">
                    {monitor.maxLatencyMs
                      ? `${monitor.maxLatencyMs}ms`
                      : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">
                    Max Failures:
                  </dt>
                  <dd className="text-gray-900 ">
                    {monitor.maxConsecutiveFailures || 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium text-gray-900  mb-3">
                Timestamps
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">Created:</dt>
                  <dd className="text-gray-900 ">
                    {monitor.createdAt
                      ? new Date(monitor.createdAt).toLocaleString()
                      : 'Unknown'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">
                    Last Updated:
                  </dt>
                  <dd className="text-gray-900 ">
                    {monitor.updatedAt
                      ? new Date(monitor.updatedAt).toLocaleString()
                      : 'Unknown'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Headers & Body */}
          {monitor.headers && Object.keys(monitor.headers).length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900  mb-3">
                Custom Headers
              </h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                {Object.entries(monitor.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-mono text-gray-600 ">
                      {key}:
                    </span>
                    <span className="font-mono text-gray-900 ">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monitor.body && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900  mb-3">
                Request Body
              </h3>
              <pre className="bg-gray-50 p-3 rounded text-sm font-mono text-gray-800  overflow-x-auto">
                {monitor.body}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
