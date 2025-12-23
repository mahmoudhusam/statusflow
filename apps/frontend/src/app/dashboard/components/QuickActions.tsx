'use client';

import Link from 'next/link';

interface QuickActionsProps {
  variant?: 'vertical' | 'horizontal';
}

const actions = [
  {
    href: '/dashboard/monitors/new',
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    iconBg: 'bg-blue-100 group-hover:bg-blue-200',
    borderHover: 'hover:border-blue-300 hover:bg-blue-50',
    title: 'Add New Monitor',
    description: 'Start monitoring a new endpoint',
  },
  {
    href: '/dashboard/monitors',
    icon: (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    iconBg: 'bg-gray-100 group-hover:bg-gray-200',
    borderHover: 'hover:border-gray-300 hover:bg-gray-50',
    title: 'View All Monitors',
    description: 'Manage your existing monitors',
  },
  {
    href: '/dashboard/alerts',
    icon: (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    iconBg: 'bg-gray-100 group-hover:bg-gray-200',
    borderHover: 'hover:border-gray-300 hover:bg-gray-50',
    title: 'Configure Alerts',
    description: 'Set up notification rules',
  },
  {
    href: '/dashboard/reports',
    icon: (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconBg: 'bg-gray-100 group-hover:bg-gray-200',
    borderHover: 'hover:border-gray-300 hover:bg-gray-50',
    title: 'Generate Reports',
    description: 'View uptime and performance reports',
  },
];

export function QuickActions({ variant = 'vertical' }: QuickActionsProps) {
  if (variant === 'horizontal') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 ${action.borderHover} transition-all group`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${action.iconBg}`}>
                {action.icon}
              </div>
              <div className="text-left min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{action.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-gray-200 ${action.borderHover} transition-all group`}
          >
            <div className={`p-2 rounded-lg transition-colors ${action.iconBg}`}>
              {action.icon}
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">{action.title}</p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
