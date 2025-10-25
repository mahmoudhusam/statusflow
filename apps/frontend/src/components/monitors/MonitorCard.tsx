import Link from 'next/link';
import { formatRelative } from 'date-fns/formatRelative';
import type { Monitor } from '@/types/monitor';

interface MonitorCardProps {
  monitor: Monitor;
  onRefresh?: (monitorId: string) => Promise<void>;
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  const isUp = monitor.id.charCodeAt(0) % 2 === 0;

  return (
    <Link
      href={`/dashboard/monitors/${monitor.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-6 transition-all hover:shadow-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
      aria-label={`Open monitor ${monitor.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {monitor.name}
            </h3>
            {monitor.paused && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Paused
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate font-mono">
            {monitor.url}
          </p>
        </div>

        {/* Status Badge */}
        <div className="ml-3 flex-shrink-0">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              isUp
                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                isUp ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></span>
            {isUp ? 'UP' : 'DOWN'}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {monitor.lastResponseTimeMs != null && (
          <div className="bg-blue-50 rounded-lg px-3 py-2">
            <div className="text-xs text-blue-600 font-medium mb-1">
              Response Time
            </div>
            <div className="text-lg font-bold text-blue-700">
              {monitor.lastResponseTimeMs}ms
            </div>
          </div>
        )}
        {monitor.lastStatusCode != null && (
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-600 font-medium mb-1">
              Status Code
            </div>
            <div className="text-lg font-bold text-gray-700 font-mono">
              {monitor.lastStatusCode}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Last check: {lastChecked}</span>
        </div>

        <svg
          className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
