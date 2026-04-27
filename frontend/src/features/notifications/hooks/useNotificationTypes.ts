import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useNotificationTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.notificationTypes,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/notifications/types');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 300_000, // 5 minutes — types rarely change
  });
}