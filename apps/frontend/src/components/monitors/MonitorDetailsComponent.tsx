'use client';

import { useState, useMemo } from 'react';
import type {
  Monitor,
  CheckResult,
  TimeRange,
  MonitorStats,
} from '@/types/monitor';
import { formatRelative } from 'date-fns/formatRelative';
import Link from 'next/link';
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
function generateMockCheckResults(
  monitorId: string,
  timeRange: TimeRange
): CheckResult[] {
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

    // Use monitor ID to create consistent but varied results
    const seed = monitorId.charCodeAt(0) + i;
    const isUp = seed % 7 !== 0; // ~85% uptime
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

  return results.reverse(); // Oldest first
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

  // Group data points for better visualization
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

    // Format label based on time range
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
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

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

  // Generate mock data and calculate stats with loading simulation
  const checkResults = useMemo(() => {
    setIsLoadingMetrics(true);
    const results = generateMockCheckResults(monitor.id, selectedTimeRange);
    setTimeout(() => setIsLoadingMetrics(false), 300);
    return results;
  }, [monitor.id, selectedTimeRange]);

  const stats = useMemo(() => calculateStats(checkResults), [checkResults]);
  const { uptimeData, latencyData } = useMemo(
    () => prepareChartData(checkResults, selectedTimeRange),
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

  // Handle time range change
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setSelectedTimeRange(newRange);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/dashboard/monitors"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Monitors
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {monitor.name}
              {monitor.paused && (
                <span className="ml-3 text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                  Paused
                </span>
              )}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-300 font-mono">
                {monitor.url}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  isUp
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {isUp ? '🟢 UP' : '🔴 DOWN'}
              </span>
            </div>
          </div>
        </div>

        {/* Monitor Metadata */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Created:
              </span>
              <div className="text-gray-900 dark:text-gray-100">
                {monitor.createdAt
                  ? new Date(monitor.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Method:
              </span>
              <div className="text-gray-900 dark:text-gray-100 font-mono">
                {monitor.httpMethod || 'GET'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Interval:
              </span>
              <div className="text-gray-900 dark:text-gray-100">
                {monitor.interval ? `${monitor.interval}s` : 'Default'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 dark:text-gray-400">
                Last Check:
              </span>
              <div className="text-gray-900 dark:text-gray-100">
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
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({stats.totalChecks} total checks)
            </span>
          </div>

          {/* Button Group for Time Range Selection */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTimeRangeChange(option.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  selectedTimeRange === option.value
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoadingMetrics && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8 space-y-8">
        {/* Uptime Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          {isLoadingMetrics ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                Loading chart data...
              </span>
            </div>
          ) : uptimeData ? (
            <div className="h-64">
              <Line data={uptimeData} options={uptimeChartOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">
                No uptime data available
              </p>
              <p className="text-sm">
                Data will appear once monitoring checks are performed
              </p>
            </div>
          )}
        </div>

        {/* Latency Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          {isLoadingMetrics ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                Loading chart data...
              </span>
            </div>
          ) : latencyData ? (
            <div className="h-64">
              <Line data={latencyData} options={latencyChartOptions} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <p className="text-lg font-medium mb-2">
                No latency data available
              </p>
              <p className="text-sm">
                Response time trends will appear once monitoring data is
                collected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Uptime */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Uptime
            </h3>
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
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-500">
            {isLoadingMetrics ? (
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-20 rounded"></div>
            ) : (
              `${stats.uptimePercentage.toFixed(2)}%`
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalChecks - stats.errorCount} / {stats.totalChecks} checks
            successful
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-500">
            {isLoadingMetrics ? (
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-20 rounded"></div>
            ) : (
              `${stats.averageLatency}ms`
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Average response time
          </div>
        </div>

        {/* 95th Percentile */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-500">
            {isLoadingMetrics ? (
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-20 rounded"></div>
            ) : (
              `${stats.p95Latency}ms`
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            95% of requests faster than
          </div>
        </div>

        {/* Error Count */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Errors
            </h3>
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
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-500">
            {isLoadingMetrics ? (
              <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-16 rounded"></div>
            ) : (
              stats.errorCount
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Failed checks in{' '}
            {timeRangeOptions
              .find((opt) => opt.value === selectedTimeRange)
              ?.description.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Recent Check Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Checks
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing last {Math.min(10, checkResults.length)} checks from{' '}
                {timeRangeOptions
                  .find((opt) => opt.value === selectedTimeRange)
                  ?.description.toLowerCase()}
              </p>
            </div>
            {isLoadingMetrics && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status Code
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoadingMetrics
                ? // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-32 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-6 w-12 rounded-full"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-16 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-12 rounded"></div>
                      </td>
                    </tr>
                  ))
                : checkResults
                    .slice(-10)
                    .reverse()
                    .map((result) => (
                      <tr
                        key={result.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(result.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.status === 'UP'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {result.responseTimeMs
                            ? `${result.responseTimeMs}ms`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                          {result.statusCode || '-'}
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Configuration
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Request Settings
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Timeout:</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {monitor.timeout ? `${monitor.timeout}ms` : 'Default'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">
                    Max Latency:
                  </dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {monitor.maxLatencyMs
                      ? `${monitor.maxLatencyMs}ms`
                      : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">
                    Max Failures:
                  </dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {monitor.maxConsecutiveFailures || 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Timestamps
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Created:</dt>
                  <dd className="text-gray-900 dark:text-gray-100">
                    {monitor.createdAt
                      ? new Date(monitor.createdAt).toLocaleString()
                      : 'Unknown'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">
                    Last Updated:
                  </dt>
                  <dd className="text-gray-900 dark:text-gray-100">
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
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Custom Headers
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                {Object.entries(monitor.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      {key}:
                    </span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monitor.body && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Request Body
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                {monitor.body}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
