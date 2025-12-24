'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api/dashboard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { StatsCard } from './components/StatsCard';
import { IncidentsList } from './components/IncidentsList';
import { QuickActions } from './components/QuickActions';
import { SystemNotifications } from './components/SystemNotifications';
import { PerformanceTrends } from './components/PerformanceTrends';
import { ResponseTimeTrends } from './components/ResponseTimeTrends';
import { MonitorStatusGrid } from './components/MonitorStatusGrid';
import { CheckStatusChart } from './components/CheckStatusChart';
import type {
  DashboardStats,
  DashboardIncident,
  DashboardNotifications,
  PerformanceTrend,
  MonitorStatus,
} from '@/types/dashboard';

interface DashboardData {
  stats: DashboardStats | null;
  incidents: DashboardIncident[];
  notifications: DashboardNotifications | null;
  trends: PerformanceTrend[];
  monitorStatuses: MonitorStatus[];
}

export function DashboardClient() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: null,
    incidents: [],
    notifications: null,
    trends: [],
    monitorStatuses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [incidentSort, setIncidentSort] = useState<'latest' | 'oldest'>('latest');

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [stats, incidents, notifications, trends, monitorStatuses] = await Promise.all([
        dashboardApi.getStats(token),
        dashboardApi.getIncidents(token, { limit: 10, sort: incidentSort }),
        dashboardApi.getNotifications(token),
        dashboardApi.getPerformanceTrends(token, 24),
        dashboardApi.getMonitorStatuses(token),
      ]);

      setData({ stats, incidents, notifications, trends, monitorStatuses });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load dashboard data')
      );
    } finally {
      setLoading(false);
    }
  }, [token, incidentSort]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleIncidentSort = async (sort: 'latest' | 'oldest') => {
    if (!token) return;
    setIncidentSort(sort);
    try {
      const incidents = await dashboardApi.getIncidents(token, { limit: 10, sort });
      setData((prev) => ({ ...prev, incidents }));
    } catch (err) {
      console.error('Failed to sort incidents:', err);
    }
  };

  const formatMonitorCount = (stats: DashboardStats) => {
    const parts = [];
    if (stats.activeMonitors > 0) {
      parts.push(`${stats.activeMonitors} active`);
    }
    if (stats.pausedMonitors > 0) {
      parts.push(`${stats.pausedMonitors} paused`);
    }
    return parts.join(' / ') || '0 monitors';
  };

  const formatIncidentCount = (stats: DashboardStats) => {
    const parts = [];
    if (stats.criticalIncidents > 0) {
      parts.push(`${stats.criticalIncidents} critical`);
    }
    if (stats.warningIncidents > 0) {
      parts.push(`${stats.warningIncidents} warning`);
    }
    return parts.join(', ') || 'None';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        {/* Header skeleton */}
        <div className="mb-4">
          <div className="h-7 bg-gray-200 rounded w-36 animate-pulse mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-72 animate-pulse"></div>
        </div>
        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <SkeletonLoader variant="metric" count={4} />
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
          <SkeletonLoader variant="chart" count={3} />
        </div>
        {/* Quick actions skeleton */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="h-4 bg-gray-300 rounded w-28 animate-pulse mb-3"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          title="Failed to load dashboard"
          message="We couldn't fetch your dashboard data. Please check your connection and try again."
          error={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  const { stats, incidents, notifications, trends, monitorStatuses } = data;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header - compact */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Welcome back! Here&apos;s an overview of your monitoring status.
        </p>
      </div>

      {/* Row 1: Stats Cards (4 columns) - single row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <StatsCard
            title="Total Monitors"
            value={stats.totalMonitors}
            subtitle={formatMonitorCount(stats)}
            variant="default"
            size="compact"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <StatsCard
            title="Overall Uptime"
            value={stats.overallUptime !== null ? `${stats.overallUptime.toFixed(1)}%` : 'N/A'}
            subtitle="Last 24 hours"
            variant={
              stats.overallUptime === null
                ? 'default'
                : stats.overallUptime >= 99
                ? 'success'
                : stats.overallUptime >= 95
                ? 'warning'
                : 'danger'
            }
            size="compact"
            trend={
              stats.overallUptime !== null
                ? {
                    direction: stats.overallUptime >= 99 ? 'up' : stats.overallUptime >= 95 ? 'neutral' : 'down',
                  }
                : undefined
            }
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatsCard
            title="Active Incidents"
            value={stats.activeIncidents}
            subtitle={formatIncidentCount(stats)}
            variant={
              stats.activeIncidents === 0
                ? 'success'
                : stats.criticalIncidents > 0
                ? 'danger'
                : 'warning'
            }
            size="compact"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          <StatsCard
            title="Avg Response Time"
            value={stats.avgResponseTime !== null ? `${stats.avgResponseTime}ms` : 'N/A'}
            subtitle="Last 24 hours"
            variant={
              stats.avgResponseTime === null
                ? 'default'
                : stats.avgResponseTime <= 200
                ? 'success'
                : stats.avgResponseTime <= 500
                ? 'warning'
                : 'danger'
            }
            size="compact"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Row 2: Charts - 2 line charts + pie chart with compact layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="h-[200px] overflow-hidden">
          <PerformanceTrends trends={trends} />
        </div>
        <div className="h-[200px] overflow-hidden">
          <ResponseTimeTrends trends={trends} />
        </div>
        <div className="h-[200px] overflow-hidden">
          {stats && (
            <CheckStatusChart
              successfulChecks={stats.successfulChecks}
              failedChecks={stats.failedChecks}
              variant="compact"
            />
          )}
        </div>
      </div>

      {/* Row 3: Quick Actions - compact horizontal */}
      <div className="mb-6">
        <QuickActions variant="horizontal" />
      </div>

      {/* Below the fold content */}
      {/* Row 4: Notifications - full width */}
      <div className="mb-4 h-[280px]">
        {notifications && <SystemNotifications data={notifications} />}
      </div>

      {/* Row 5: Monitor Status - full width */}
      <div className="mb-6">
        <MonitorStatusGrid monitors={monitorStatuses} />
      </div>

      {/* Row 6: Recent Incidents - full width */}
      <div>
        <IncidentsList
          incidents={incidents}
          onSort={handleIncidentSort}
          currentSort={incidentSort}
        />
      </div>
    </div>
  );
}
