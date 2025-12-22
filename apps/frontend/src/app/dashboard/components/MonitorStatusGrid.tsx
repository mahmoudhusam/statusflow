'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { MonitorStatus, MonitorStatusType } from '@/types/dashboard';

interface MonitorStatusGridProps {
  monitors: MonitorStatus[];
}

const statusConfig: Record<
  MonitorStatusType,
  { bg: string; text: string; dot: string; label: string }
> = {
  up: {
    bg: 'bg-green-50 hover:bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
    label: 'Up',
  },
  down: {
    bg: 'bg-red-50 hover:bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Down',
  },
  paused: {
    bg: 'bg-gray-50 hover:bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    label: 'Paused',
  },
  slow: {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500',
    label: 'Slow',
  },
};

function MonitorCard({ monitor }: { monitor: MonitorStatus }) {
  const config = statusConfig[monitor.status];

  return (
    <Link
      href={`/dashboard/monitors/${monitor.id}`}
      className={`block p-3 rounded-lg border border-gray-200 ${config.bg} transition-colors`}
    >
      <div className="flex items-start gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${config.dot} mt-1.5 flex-shrink-0`} />
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium truncate ${config.text}`}>
            {monitor.name}
          </h3>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {monitor.url}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs font-medium ${config.text}`}>
              {config.label}
            </span>
            {monitor.responseTime !== null && monitor.status !== 'paused' && (
              <span className="text-xs text-gray-500">
                {monitor.responseTime}ms
              </span>
            )}
          </div>
          {monitor.lastCheckedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(monitor.lastCheckedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MonitorStatusGrid({ monitors }: MonitorStatusGridProps) {
  if (monitors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monitor Status
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No monitors yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first monitor to start tracking
            </p>
            <Link
              href="/dashboard/monitors/new"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Monitor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group monitors by status for the summary
  const statusCounts = monitors.reduce(
    (acc, m) => {
      acc[m.status]++;
      return acc;
    },
    { up: 0, down: 0, paused: 0, slow: 0 } as Record<MonitorStatusType, number>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Monitor Status
        </h2>
        <div className="flex items-center gap-3 text-sm">
          {statusCounts.up > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">{statusCounts.up}</span>
            </span>
          )}
          {statusCounts.down > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">{statusCounts.down}</span>
            </span>
          )}
          {statusCounts.slow > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">{statusCounts.slow}</span>
            </span>
          )}
          {statusCounts.paused > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">{statusCounts.paused}</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {monitors.map((monitor) => (
          <MonitorCard key={monitor.id} monitor={monitor} />
        ))}
      </div>
    </div>
  );
}
