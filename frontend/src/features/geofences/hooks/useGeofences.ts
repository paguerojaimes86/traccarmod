import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface UseGeofencesParams {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export function useGeofences({ keyword, limit, offset }: UseGeofencesParams = {}) {
  const hasParams = keyword || limit != null || offset != null;
  const queryKey = hasParams
    ? ([...QUERY_KEYS.geofences, { keyword, limit, offset }])
    : [...QUERY_KEYS.geofences];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/geofences', {
        params: { query: { keyword, limit, offset } },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}