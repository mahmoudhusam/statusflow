'use client';

import { useState, useEffect } from 'react';
import { formatRelative } from 'date-fns/formatRelative';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { monitorsApi } from '@/lib/api/monitors';
import type { Monitor } from '@/types/monitor';

interface MonitorDetailsComponentProps {
  monitor: Monitor;
}

export function MonitorDetailsComponent({
  monitor,
}: MonitorDetailsComponentProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const data = await monitorsApi.getMonitorStats(monitor.id, token);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [monitor.id, token]);

  const lastChecked = monitor.lastCheckedAt
    ? formatRelative(new Date(monitor.lastCheckedAt), new Date())
    : 'Never checked';

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <Link
          href="/dashboard/monitors"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
        >
          ← Back to Monitors
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {monitor.name}
          {monitor.paused && (
            <span className="ml-3 text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700">
              Paused
            </span>
          )}
        </h1>
        <p className="text-gray-600 font-mono">{monitor.url}</p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Configuration
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Method</p>
            <p className="font-mono text-gray-900">
              {monitor.httpMethod || 'GET'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Interval</p>
            <p className="text-gray-900">{monitor.interval}s</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Timeout</p>
            <p className="text-gray-900">{monitor.timeout || 10000}ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Check</p>
            <p className="text-gray-900">{lastChecked}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Uptime</h3>
            <p className="text-3xl font-bold text-gray-900">
              {stats.uptime?.toFixed(2) || 0}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Avg Response
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {stats.avgResponseTime || 0}ms
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Total Checks
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {stats.totalChecks || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              Current Status
            </h3>
            <p className="text-2xl font-bold">
              {stats.currentStatus === 'up' ? (
                <span className="text-green-600">UP</span>
              ) : stats.currentStatus === 'down' ? (
                <span className="text-red-600">DOWN</span>
              ) : (
                <span className="text-gray-400">Unknown</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Alert Thresholds */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Alert Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Max Latency</p>
            <p className="text-gray-900">{monitor.maxLatencyMs || 2000}ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Consecutive Failures</p>
            <p className="text-gray-900">
              {monitor.maxConsecutiveFailures || 3}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Alert Email</p>
            <p className="text-gray-900">{monitor.user?.email || 'Not set'}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-8 text-center text-gray-500">
          Loading statistics...
        </div>
      )}
    </div>
  );
}
