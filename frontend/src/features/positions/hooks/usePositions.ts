import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function usePositions() {
  return useQuery({
    queryKey: QUERY_KEYS.allPositions,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/positions');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10_000,
  });
}

export function useDevicePositions(deviceId: number, from: string, to: string) {
  return useQuery({
    queryKey: QUERY_KEYS.positions({ deviceId, from, to }),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/positions', {
        params: { query: { deviceId, from, to } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!deviceId && !!from && !!to,
  });
}
