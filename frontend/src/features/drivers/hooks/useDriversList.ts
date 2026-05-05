import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useDriversList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.drivers],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/drivers');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
