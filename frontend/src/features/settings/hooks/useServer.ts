import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useServer() {
  return useQuery({
    queryKey: QUERY_KEYS.server,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/server');
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
