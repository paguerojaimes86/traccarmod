import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useSession() {
  return useQuery({
    queryKey: QUERY_KEYS.session,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/session');
      if (error) throw error;
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
