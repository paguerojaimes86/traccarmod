import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useMaintenanceList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.maintenance],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/maintenance');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
