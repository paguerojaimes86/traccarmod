import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

interface ReportParams {
  deviceId?: number[];
  groupId?: number[];
  geofenceId?: number[];
  from: string;
  to: string;
}

export function useGeofencesReport(params: ReportParams | null) {
  const hasDevices = params && (params.deviceId?.length ?? 0) > 0;

  return useQuery({
    queryKey: hasDevices
      ? [...QUERY_KEYS.reports, 'geofences', params.from, params.to, params.deviceId, params.geofenceId]
      : [...QUERY_KEYS.reports, 'geofences'],
    queryFn: async () => {
      if (!params || !hasDevices) return [];
      const { data, error } = await apiClient.GET('/reports/geofences', {
        params: {
          query: {
            deviceId: params.deviceId,
            groupId: params.groupId,
            geofenceId: params.geofenceId,
            from: params.from,
            to: params.to,
          },
        },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!hasDevices,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}
