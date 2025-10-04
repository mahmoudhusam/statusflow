// apps/frontend/src/app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link
                  href="/dashboard/monitors"
                  className="text-xl font-bold text-gray-900 dark:text-gray-100"
                >
                  StatusFlow
                </Link>

                <div className="flex gap-4">
                  <Link
                    href="/dashboard/monitors"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname?.startsWith('/dashboard/monitors')
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Monitors
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}
