'use client';

import Link from 'next/link';
import { MonitorCard } from '@/components/monitors/MonitorCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { useMonitors } from '@/hooks/useMonitors';

export default function MonitorsPage() {
  const { data: monitors, isLoading, error, refetch, isFetching } = useMonitors();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Monitors</h1>
            {!isLoading && !error && monitors && (
              <p className="text-gray-600 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  {monitors.length} active monitor
                  {monitors.length !== 1 ? 's' : ''}
                </span>
                {isFetching && !isLoading && (
                  <span className="text-xs text-gray-400">Refreshing...</span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLoading && !error && (
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 font-medium shadow-sm disabled:opacity-50"
                title="Refresh monitors"
              >
                <svg
                  className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
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
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <Link
              href="/dashboard/monitors/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
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
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader variant="card" count={6} />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorDisplay
          title="Failed to load monitors"
          message="We couldn't fetch your monitors. Please check your connection and try again."
          error={error instanceof Error ? error : new Error('Failed to fetch monitors')}
          onRetry={() => refetch()}
        />
      )}

      {/* Monitors Grid */}
      {!isLoading && !error && monitors && (
        <>
          {monitors.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl border border-gray-200 p-12 max-w-2xl mx-auto shadow-sm">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-blue-600"
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
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No monitors yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get started by creating your first monitor to track your
                  services and APIs.
                </p>
                <Link
                  href="/dashboard/monitors/new"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/30"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monitors.map((monitor) => (
                <MonitorCard key={monitor.id} monitor={monitor} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm font-medium text-gray-700">
            Loading monitors...
          </span>
        </div>
      )}
    </div>
  );
}
