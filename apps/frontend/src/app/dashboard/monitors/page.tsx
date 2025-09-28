'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import monitors from '@/mocks/monitors.json';
import { MonitorCard } from '@/components/monitors/MonitorCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useAsyncData, simulateApiCall } from '@/hooks/useAsyncData';
import type { Monitor } from '@/types/monitor';

async function fetchMonitors(userId: string): Promise<Monitor[]> {
  // Simulate API call with mock data
  const userMonitors = monitors.filter((m) => m.user?.id === userId);
  return simulateApiCall(userMonitors as Monitor[], {
    delay: 1000,
    // Uncomment to test error handling
    // shouldFail: true
  });
}

export default function MonitorsPage() {
  const currentUserId = 'user-uuid-001';
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMonitorsFn = useCallback(
    () => fetchMonitors(currentUserId),
    [currentUserId]
  );

  const {
    data: myMonitors,
    loading,
    error,
    retry,
  } = useAsyncData<Monitor[]>(fetchMonitorsFn, [refreshKey], {
    simulateDelay: 1000,
    simulateErrorRate: 0, // Set to 0.2 to test error handling (20% error rate)
    retryCount: 3,
    retryDelay: 1000,
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Monitors
          </h1>
          {!loading && !error && myMonitors && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {myMonitors.length} active monitor
              {myMonitors.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!loading && !error && (
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Refresh monitors"
            >
              <svg
                className="w-4 h-4"
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
          )}
          <Link
            href="/dashboard/monitors/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Monitor
          </Link>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader variant="card" count={6} />
        </div>
      )}

      {error && !loading && (
        <ErrorDisplay
          title="Failed to load monitors"
          message="We couldn't fetch your monitors. Please check your connection and try again."
          error={error}
          onRetry={retry}
        />
      )}

      {!loading && !error && myMonitors && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myMonitors.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No monitors yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get started by creating your first monitor to track your
                  services.
                </p>
                <Link
                  href="/dashboard/monitors/new"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create your first monitor
                </Link>
              </div>
            </div>
          ) : (
            myMonitors.map((monitor) => (
              <MonitorCard key={monitor.id} monitor={monitor} />
            ))
          )}
        </div>
      )}

      {/* Loading state indicator in footer */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading monitors...
          </span>
        </div>
      )}
    </div>
  );
}
