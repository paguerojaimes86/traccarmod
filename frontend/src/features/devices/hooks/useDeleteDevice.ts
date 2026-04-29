import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Device } from '@shared/api/types.models';

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/devices/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.devices });
      const previousDevices = queryClient.getQueryData<Device[]>(QUERY_KEYS.devices);
      queryClient.setQueryData<Device[]>(QUERY_KEYS.devices, (old) => {
        if (!old) return old;
        return old.filter((d) => d.id !== id);
      });
      return { previousDevices };
    },
    // No onSuccess invalidate — Traccar's GET returns stale data right after DELETE.
    // The device is already removed from cache by onMutate. Let staleTime handle refetch.
    onError: (_err, _vars, context) => {
      if (context?.previousDevices) {
        queryClient.setQueryData(QUERY_KEYS.devices, context.previousDevices);
      }
    },
  });
}