import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

/**
 * Fetches computed attribute IDs linked to a device.
 * Uses GET /attributes/computed?deviceId=X as inverse query.
 */
export function useDeviceLinkedAttributes(deviceId: number | null | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.attributes, 'linked', deviceId],
    queryFn: async (): Promise<number[]> => {
      if (deviceId == null) return [];
      const { data } = await apiClient.GET('/attributes/computed', {
        params: { query: { deviceId } },
      });
      return (data ?? []).map((a) => a.id!).filter(Boolean);
    },
    enabled: deviceId != null,
    staleTime: 30_000,
  });
}
