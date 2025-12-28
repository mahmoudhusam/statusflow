import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, IncidentSortOrder } from '@/lib/api/dashboard';
import { dashboardKeys } from './useMonitors';

export function useDashboardStats() {
  const { token } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardApi.getStats(token!),
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useDashboardIncidents(sort: IncidentSortOrder = 'latest') {
  const { token } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.incidents(sort),
    queryFn: () => dashboardApi.getIncidents(token!, { limit: 10, sort }),
    enabled: !!token,
    refetchInterval: 30000,
  });
}

export function useDashboardNotifications() {
  const { token } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.notifications,
    queryFn: () => dashboardApi.getNotifications(token!),
    enabled: !!token,
    refetchInterval: 30000,
  });
}

export function usePerformanceTrends(hours: number = 24) {
  const { token } = useAuth();

  return useQuery({
    queryKey: [...dashboardKeys.trends, hours],
    queryFn: () => dashboardApi.getPerformanceTrends(token!, hours),
    enabled: !!token,
    refetchInterval: 30000,
  });
}

export function useMonitorStatuses() {
  const { token } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.monitorStatuses,
    queryFn: () => dashboardApi.getMonitorStatuses(token!),
    enabled: !!token,
    refetchInterval: 30000,
  });
}
