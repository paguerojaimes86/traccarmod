import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface UseCommandsParams {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export function useCommands({ keyword, limit, offset }: UseCommandsParams = {}) {
  const hasParams = keyword || limit != null || offset != null;
  const queryKey = hasParams
    ? ([...QUERY_KEYS.commands, { keyword, limit, offset }])
    : [...QUERY_KEYS.commands];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/commands', {
        params: { query: { keyword, limit, offset } },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}