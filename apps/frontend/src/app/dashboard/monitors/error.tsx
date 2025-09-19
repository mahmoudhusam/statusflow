'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Monitor page error:', error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Oops — something went wrong
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We ran into an error while loading this monitor. Try again or return
          to the monitors list.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
          >
            Try again
          </button>

          <Link
            href="/dashboard/monitors"
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50 dark:border-gray-700"
          >
            Back to monitors
          </Link>
        </div>
      </div>
    </main>
  );
}
