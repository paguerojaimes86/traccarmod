import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useAttributesList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.attributes],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/attributes/computed');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
