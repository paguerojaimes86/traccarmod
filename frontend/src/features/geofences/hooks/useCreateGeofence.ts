import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Geofence } from '@shared/api/types.models';

export function useCreateGeofence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (geofence: Partial<Geofence>) => {
      const { data, error } = await apiClient.POST('/geofences', {
        body: geofence as Geofence,
      });
      if (error) throw error;
      return data!;
    },
    onSuccess: (newGeofence) => {
      queryClient.setQueryData<Geofence[]>(QUERY_KEYS.geofences, (old) => {
        if (!old) return [newGeofence];
        return [...old, newGeofence];
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.geofences });
    },
  });
}