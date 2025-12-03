'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Rules', href: '/dashboard/alerts', icon: '🔔' },
    { name: 'Channels', href: '/dashboard/alerts/channels', icon: '📡' },
    { name: 'History', href: '/dashboard/alerts/history', icon: '📜' },
    { name: 'Templates', href: '/dashboard/alerts/templates', icon: '📋' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts</h1>
        <p className="text-gray-600">
          Manage alert rules, notification channels, and view alert history
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
