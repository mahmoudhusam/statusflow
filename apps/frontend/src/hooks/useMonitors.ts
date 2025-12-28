import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { monitorsApi, CreateMonitorDto, UpdateMonitorDto } from '@/lib/api/monitors';

export const monitorKeys = {
  all: ['monitors'] as const,
  detail: (id: string) => ['monitors', id] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: ['dashboard', 'stats'] as const,
  incidents: (sort?: string) => ['dashboard', 'incidents', sort] as const,
  notifications: ['dashboard', 'notifications'] as const,
  trends: ['dashboard', 'trends'] as const,
  monitorStatuses: ['dashboard', 'monitor-statuses'] as const,
};

export function useMonitors() {
  const { token } = useAuth();

  return useQuery({
    queryKey: monitorKeys.all,
    queryFn: () => monitorsApi.getMonitors(token!),
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMonitor(id: string) {
  const { token } = useAuth();

  return useQuery({
    queryKey: monitorKeys.detail(id),
    queryFn: () => monitorsApi.getMonitor(id, token!),
    enabled: !!token && !!id,
  });
}

export function useCreateMonitor() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMonitorDto) =>
      monitorsApi.createMonitor(data, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitorKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateMonitor() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMonitorDto }) =>
      monitorsApi.updateMonitor(id, data, token!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: monitorKeys.all });
      queryClient.invalidateQueries({ queryKey: monitorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteMonitor() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monitorsApi.deleteMonitor(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitorKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function usePauseMonitor() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monitorsApi.pauseMonitor(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitorKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useResumeMonitor() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monitorsApi.resumeMonitor(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitorKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
