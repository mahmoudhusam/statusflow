'use client';

import { useState, useMemo, use } from 'react';
import { notFound } from 'next/navigation';
import monitors from '@/mocks/monitors.json';
import type {
  Monitor,
  CheckResult,
  TimeRange,
  MonitorStats,
} from '@/types/monitor';
import { formatRelative } from 'date-fns/formatRelative';
import Link from 'next/link';

interface MonitorPageProps {
  params: Promise<{
    id: string;
  }>;
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

export default function MonitorPage({ params }: MonitorPageProps) {
  // Use React's `use` hook to unwrap the Promise
  const { id } = use(params);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');

  // Find the monitor
  const monitor = monitors.find((m) => m.id === id) as Monitor | undefined;

  if (!monitor) {
    notFound();
  }

  // Generate mock data and calculate stats
  const checkResults = useMemo(
    () => generateMockCheckResults(monitor.id, selectedTimeRange),
    [monitor.id, selectedTimeRange]
  );

  const stats = useMemo(() => calculateStats(checkResults), [checkResults]);

  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  const isUp = monitor.id.charCodeAt(0) % 2 === 0;

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

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

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range:
          </span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Uptime */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Uptime
            </h3>
            <div
              className={`w-3 h-3 rounded-full ${stats.uptimePercentage >= 99 ? 'bg-green-500' : stats.uptimePercentage >= 95 ? 'bg-yellow-500' : 'bg-red-500'}`}
            ></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.uptimePercentage.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalChecks - stats.errorCount} / {stats.totalChecks} checks
            successful
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Avg Latency
            </h3>
            <div
              className={`w-3 h-3 rounded-full ${stats.averageLatency <= 200 ? 'bg-green-500' : stats.averageLatency <= 500 ? 'bg-yellow-500' : 'bg-red-500'}`}
            ></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.averageLatency}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Average response time
          </div>
        </div>

        {/* 95th Percentile */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              95th Percentile
            </h3>
            <div
              className={`w-3 h-3 rounded-full ${stats.p95Latency <= 300 ? 'bg-green-500' : stats.p95Latency <= 800 ? 'bg-yellow-500' : 'bg-red-500'}`}
            ></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.p95Latency}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            95% of requests faster than
          </div>
        </div>

        {/* Error Count */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Errors
            </h3>
            <div
              className={`w-3 h-3 rounded-full ${stats.errorCount === 0 ? 'bg-green-500' : stats.errorCount <= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
            ></div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.errorCount}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Failed checks in time range
          </div>
        </div>
      </div>

      {/* Recent Check Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Checks
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing last {Math.min(10, checkResults.length)} checks
          </p>
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
              {checkResults
                .slice(-10)
                .reverse()
                .map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
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

      {/* Configuration Details (Collapsible) */}
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
