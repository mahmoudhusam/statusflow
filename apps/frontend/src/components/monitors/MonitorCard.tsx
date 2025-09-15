import Link from 'next/link';
import { formatRelative } from 'date-fns/formatRelative';

export type Monitor = {
  id: string;
  name: string;
  url: string;
  lastCheckedAt?: string | null;
  lastStatus?: 'UP' | 'DOWN';
  lastStatusCode?: number;
  lastResponseTimeMs?: number;
  paused?: boolean;
  httpMethod?: string;
  user?: { id: string };
};

interface MonitorCardProps {
  monitor: Monitor;
}

export function MonitorCard({ monitor }: MonitorCardProps) {
  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  const isUp = monitor.id.charCodeAt(0) % 2 === 0;

  return (
    <Link
      href={`/dashboard/monitors/${monitor.id}`}
      className="block border border-gray-200 rounded-lg p-4 transition-shadow
                 dark:border-gray-700 dark:bg-gray-800
                 hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label={`Open monitor ${monitor.name}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {monitor.name}
            {monitor.paused && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                Paused
              </span>
            )}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            {monitor.url}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Last check: <span className="font-medium">{lastChecked}</span>
          </p>
        </div>

        <div className="text-right ml-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
              isUp
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
            aria-live="polite"
          >
            {isUp ? 'UP' : 'DOWN'}
          </span>

          {monitor.lastResponseTimeMs != null && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {monitor.lastResponseTimeMs} ms
            </div>
          )}
          {monitor.lastStatusCode != null && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {monitor.lastStatusCode}
            </div>
          )}

        </div>
      </div>
    </Link>
  );
}
