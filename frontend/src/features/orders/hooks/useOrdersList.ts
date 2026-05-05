import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useOrdersList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.orders],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/orders');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
