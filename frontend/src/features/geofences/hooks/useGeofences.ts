import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useGeofences() {
  return useQuery({
    queryKey: QUERY_KEYS.geofences,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/geofences');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
