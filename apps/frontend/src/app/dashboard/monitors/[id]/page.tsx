import { notFound } from 'next/navigation';
import monitors from '@/mocks/monitors.json';
import type { Monitor } from '@/types/monitor';
import { formatRelative } from 'date-fns/formatRelative';

interface MonitorPageProps {
  params: {
    id: string;
  };
}

function getMonitorById(id: string): Monitor | null {
  try {
    const monitor = monitors.find((m) => m.id === id);
    return monitor ? (monitor as Monitor) : null;
  } catch (error) {
    throw error;
  }
}

export default function MonitorPage({ params }: MonitorPageProps) {
  const { id } = params;

  const monitor = getMonitorById(id);

  if (!monitor) {
    notFound();
  }

  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  const isUp = monitor.id.charCodeAt(0) % 2 === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {monitor.name}
            {monitor.paused && (
              <span className="ml-3 text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                Paused
              </span>
            )}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                isUp
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {isUp ? 'UP' : 'DOWN'}
            </span>
          </div>
        </div>

        <div className="text-lg text-gray-600 dark:text-gray-300">
          <span className="font-mono">{monitor.url}</span>
        </div>
      </div>

      {/* Monitor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Configuration
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                HTTP Method
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                {monitor.httpMethod || 'GET'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Check Interval
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {monitor.interval
                  ? `${monitor.interval} seconds`
                  : 'Not configured'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Timeout
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {monitor.timeout ? `${monitor.timeout}ms` : 'Default'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Max Latency
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {monitor.maxLatencyMs ? `${monitor.maxLatencyMs}ms` : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Max Consecutive Failures
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {monitor.maxConsecutiveFailures || 'Not set'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Latest Status
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Checked
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {lastChecked}
              </dd>
            </div>
            {monitor.lastResponseTimeMs && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Response Time
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">
                  {monitor.lastResponseTimeMs}ms
                </dd>
              </div>
            )}
            {monitor.lastStatusCode && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status Code
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {monitor.lastStatusCode}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {monitor.createdAt
                  ? new Date(monitor.createdAt).toLocaleDateString()
                  : 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Updated
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {monitor.updatedAt
                  ? new Date(monitor.updatedAt).toLocaleDateString()
                  : 'Unknown'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Headers */}
      {monitor.headers && Object.keys(monitor.headers).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Custom Headers
          </h2>
          <div className="space-y-2">
            {Object.entries(monitor.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm">
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

      {/* Request Body */}
      {monitor.body && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Request Body
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
            {monitor.body}
          </pre>
        </div>
      )}
    </div>
  );
}
