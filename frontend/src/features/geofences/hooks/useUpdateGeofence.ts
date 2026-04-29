import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Geofence } from '@shared/api/types.models';

export function useUpdateGeofence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Geofence> & { id: number }) => {
      console.log('[useUpdateGeofence] sending PUT:', { id, updates });
      const { data, error } = await apiClient.PUT('/geofences/{id}', {
        params: { path: { id } },
        body: updates as Geofence,
      });
      console.log('[useUpdateGeofence] server response:', { data, error });
      if (error) throw error;
      return { ...data!, id };
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.geofences });
      const previous = queryClient.getQueryData<Geofence[]>(QUERY_KEYS.geofences);
      queryClient.setQueryData<Geofence[]>(QUERY_KEYS.geofences, (old) => {
        if (!old) return old;
        return old.map((g) => (g.id === id ? { ...g, ...updates } : g));
      });
      return { previous };
    },
    onSuccess: (serverItem) => {
      queryClient.setQueryData<Geofence[]>(QUERY_KEYS.geofences, (old) => {
        if (!old) return old;
        return old.map((g) => (g.id === serverItem.id ? { ...g, ...serverItem } : g));
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.geofences, context.previous);
      }
    },
  });
}