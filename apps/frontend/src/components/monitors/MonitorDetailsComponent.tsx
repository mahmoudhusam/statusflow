'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Monitor, TimeRange, MonitorStats } from '@/types/monitor';
import { formatRelative } from 'date-fns/formatRelative';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { monitorsApi } from '@/lib/api/monitors';
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

// Prepare chart data from metrics API response
function prepareChartData(metricsData: any) {
  if (!metricsData?.metrics || metricsData.metrics.length === 0) {
    return { uptimeData: null, latencyData: null };
  }

  const labels: string[] = [];
  const uptimePercentages: number[] = [];
  const avgLatencies: number[] = [];
  const p95Latencies: number[] = [];

  metricsData.metrics.forEach((metric: any) => {
    const date = new Date(metric.timestamp);
    const label = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    labels.push(label);
    uptimePercentages.push(metric.uptime || 0);
    avgLatencies.push(metric.avgResponseTime || 0);
    p95Latencies.push(metric.p95ResponseTime || 0);
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
  const { token } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [refreshKey, setRefreshKey] = useState(0);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<Error | null>(null);
  const [latestCheckResult, setLatestCheckResult] = useState<any>(null);

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

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!token) return;

      try {
        setIsLoadingMetrics(true);
        setMetricsError(null);

        // Calculate time range
        const now = new Date();
        const from = new Date();

        switch (selectedTimeRange) {
          case '1h':
            from.setHours(now.getHours() - 1);
            break;
          case '24h':
            from.setHours(now.getHours() - 24);
            break;
          case '7d':
            from.setDate(now.getDate() - 7);
            break;
          case '30d':
            from.setDate(now.getDate() - 30);
            break;
        }

        const data = await monitorsApi.getMonitorMetrics(
          monitor.id,
          { from, to: now, interval: selectedTimeRange === '1h' ? '1m' : '1h' },
          token
        );
        setMetricsData(data);

        // Get the latest check result from the metrics data
        if (data?.metrics && data.metrics.length > 0) {
          const latest = data.metrics[data.metrics.length - 1];
          setLatestCheckResult({
            status: latest.uptime > 0 ? 'UP' : 'DOWN',
            responseTime: latest.avgResponseTime,
          });
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setMetricsError(
          error instanceof Error ? error : new Error('Failed to fetch metrics')
        );
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();
  }, [monitor.id, selectedTimeRange, refreshKey, token]);

  const stats: MonitorStats | null = useMemo(() => {
    if (!metricsData?.summary) return null;

    return {
      uptimePercentage: metricsData.summary.totalUptime || 0,
      averageLatency: Math.round(metricsData.summary.avgResponseTime || 0),
      p95Latency: 0, // Not in summary, would need to calculate from metrics
      errorCount: metricsData.summary.totalErrors || 0,
      totalChecks: metricsData.summary.totalChecks || 0,
    };
  }, [metricsData]);

  const { uptimeData, latencyData } = useMemo(
    () => prepareChartData(metricsData),
    [metricsData]
  );

  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  const isUp =
    monitor.latestStatus?.isUp ||
    (latestCheckResult && latestCheckResult.status === 'UP') ||
    false;

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

  const retryMetrics = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

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
              <span className="text-gray-600  font-mono">{monitor.url}</span>
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
              <span className="font-medium text-gray-500 ">Created:</span>
              <div className="text-gray-900 ">
                {monitor.createdAt
                  ? new Date(monitor.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 ">Method:</span>
              <div className="text-gray-900  font-mono">
                {monitor.httpMethod || 'GET'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 ">Interval:</span>
              <div className="text-gray-900 ">
                {monitor.interval ? `${monitor.interval}s` : 'Default'}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-500 ">Last Check:</span>
              <div className="text-gray-900 ">{lastChecked}</div>
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
                  <dt className="text-gray-500 ">Max Latency:</dt>
                  <dd className="text-gray-900 ">
                    {monitor.maxLatencyMs
                      ? `${monitor.maxLatencyMs}ms`
                      : 'Not set'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">Max Failures:</dt>
                  <dd className="text-gray-900 ">
                    {monitor.maxConsecutiveFailures || 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-medium text-gray-900  mb-3">Timestamps</h3>
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
                  <dt className="text-gray-500 ">Last Updated:</dt>
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
                    <span className="font-mono text-gray-600 ">{key}:</span>
                    <span className="font-mono text-gray-900 ">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monitor.body && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900  mb-3">Request Body</h3>
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
