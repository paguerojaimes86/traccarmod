import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface UseStatsParams {
  from: string;
  to: string;
}

export function useStatisticsList({ from, to }: UseStatsParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.statistics(from, to)],
    enabled: !!from && !!to,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/statistics', {
        params: { query: { from, to } },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
