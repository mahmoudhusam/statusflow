import Link from 'next/link';
import monitors from '../../../mocks/monitors.json';
import { MonitorCard, Monitor } from '../../../components/monitors/MonitorCard';

export default function MonitorsPage() {
  const currentUserId = 'user-uuid-001';
  const myMonitors = monitors.filter((m) => m.user?.id === currentUserId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Monitors
        </h1>
        <Link
          href="/dashboard/monitors/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Monitor
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monitors.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No monitors available. Click &quot;Add Monitor&quot; to create one.
          </p>
        ) : (
          myMonitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor as Monitor} />
          ))
        )}
      </div>
    </div>
  );
}
