'use client'; 

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Monitor not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The monitor you are looking for doesn’t exist or it may have been
          deleted.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard/monitors"
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
          >
            Back to monitors
          </Link>

          <Link
            href="/dashboard/monitors/new"
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50 dark:border-gray-700"
          >
            Create a monitor
          </Link>
        </div>
      </div>
    </main>
  );
}
