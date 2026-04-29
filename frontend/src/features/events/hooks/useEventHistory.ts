import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface UseEventHistoryParams {
  deviceId?: number[];
  groupId?: number[];
  type?: string[];
  from: string;
  to: string;
  enabled?: boolean;
}

export function useEventHistory({
  deviceId,
  groupId,
  type,
  from,
  to,
  enabled = true,
}: UseEventHistoryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.reportEvents({ deviceId, type, from, to }),
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/reports/events', {
        params: {
          query: {
            deviceId,
            groupId,
            type,
            from,
            to,
          },
        },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
    enabled: enabled && !!from && !!to,
  });
}