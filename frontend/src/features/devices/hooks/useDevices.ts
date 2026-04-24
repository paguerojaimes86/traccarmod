import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useDevices() {
  return useQuery({
    queryKey: QUERY_KEYS.devices,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/devices');
      if (error) throw error;
      return data ?? [];
    },
  });
}
