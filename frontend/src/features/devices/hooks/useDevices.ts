import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface UseDevicesParams {
  keyword?: string;
  limit?: number;
  offset?: number;
}

export function useDevices({ keyword, limit, offset }: UseDevicesParams = {}) {
  const hasParams = keyword || limit != null || offset != null;
  const queryKey = hasParams
    ? ([...QUERY_KEYS.devices, { keyword, limit, offset }])
    : [...QUERY_KEYS.devices];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/devices', {
        params: { query: { keyword, limit, offset } },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
