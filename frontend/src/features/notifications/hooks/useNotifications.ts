import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Notification } from '@shared/api/types.models';
import { alertsDebug, alertsWarn } from '@shared/lib/debug';

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: async () => {
      alertsDebug('notifications', 'fetch /notifications');
      const { data, error } = await apiClient.GET('/notifications');
      if (error) throw error;
      alertsDebug('notifications', 'fetched notifications', {
        count: (data ?? []).length,
        ids: (data ?? []).map((n) => n.id),
      });
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: Partial<Notification>) => {
      alertsDebug('notifications', 'create notification request', notification);
      const { data, error } = await apiClient.POST('/notifications', {
        body: notification,
      });
      if (error) throw error;
      alertsDebug('notifications', 'notification created', { id: data?.id, type: data?.type });
      return data!;
    },
    onSuccess: () => {
      alertsDebug('notifications', 'create success: invalidating notifications query');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      alertsWarn('notifications', 'delete notification request', { id });
      const { error } = await apiClient.DELETE('/notifications/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
      alertsDebug('notifications', 'notification deleted', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}
