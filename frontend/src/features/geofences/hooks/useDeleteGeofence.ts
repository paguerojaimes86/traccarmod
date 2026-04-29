import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Geofence } from '@shared/api/types.models';

export function useDeleteGeofence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/geofences/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.geofences });
      const previous = queryClient.getQueryData<Geofence[]>(QUERY_KEYS.geofences);
      queryClient.setQueryData<Geofence[]>(QUERY_KEYS.geofences, (old) => {
        if (!old) return old;
        return old.filter((g) => g.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.geofences, context.previous);
      }
    },
  });
}