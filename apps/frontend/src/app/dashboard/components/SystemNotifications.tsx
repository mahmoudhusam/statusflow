'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { DashboardNotifications, NotificationItem } from '@/types/dashboard';

interface SystemNotificationsProps {
  data: DashboardNotifications;
}

export function SystemNotifications({ data }: SystemNotificationsProps) {
  const getNotificationIcon = (type: NotificationItem['type'], read: boolean) => {
    const baseClasses = read ? 'text-gray-400' : 'text-blue-600';

    switch (type) {
      case 'alert':
        return (
          <svg className={`w-5 h-5 ${baseClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'incident':
        return (
          <svg className={`w-5 h-5 ${baseClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'system':
        return (
          <svg className={`w-5 h-5 ${baseClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {data.unread > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {data.unread}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/alerts/history"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all
        </Link>
      </div>

      {data.notifications.length === 0 ? (
        <div className="px-6 py-8 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No notifications</p>
          <p className="text-sm text-gray-500 mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
          {data.notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-6 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50/50' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type, notification.read)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.read && (
                <div className="flex-shrink-0">
                  <span className="w-2 h-2 bg-blue-600 rounded-full block"></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
