import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface UseUsersParams {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export function useUsers({ keyword, limit, offset }: UseUsersParams = {}) {
  const hasParams = keyword || limit != null || offset != null;
  const queryKey = hasParams
    ? ([...QUERY_KEYS.users, { keyword, limit, offset }])
    : [...QUERY_KEYS.users];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/users', {
        params: { query: { keyword, limit, offset } },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}