import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface SummaryParams {
  deviceId?: number[];
  groupId?: number[];
  from: string;
  to: string;
}

export function useSummaryReport(params: SummaryParams | null) {
  return useQuery({
    queryKey: [QUERY_KEYS.reports, 'summary', params],
    queryFn: async () => {
      if (!params) return [];

      const { data, error } = await apiClient.GET('/reports/summary', {
        params: {
          query: {
            deviceId: params.deviceId,
            groupId: params.groupId,
            from: params.from,
            to: params.to,
          },
        },
      });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!params,
  });
}
