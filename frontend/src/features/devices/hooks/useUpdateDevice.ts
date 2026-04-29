import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Device } from '@shared/api/types.models';

export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Device> & { id: number }) => {
      const { data, error } = await apiClient.PUT('/devices/{id}', {
        params: { path: { id } },
        body: updates as Device,
      });
      if (error) throw error;
      // Traccar returns id:0 in PUT response; merge with known id
      return { ...data!, id };
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.devices });
      const previousDevices = queryClient.getQueryData<Device[]>(QUERY_KEYS.devices);
      queryClient.setQueryData<Device[]>(QUERY_KEYS.devices, (old) => {
        if (!old) return old;
        return old.map((d) => (d.id === id ? { ...d, ...updates } : d));
      });
      return { previousDevices };
    },
    onSuccess: (serverDevice) => {
      // Update cache directly with server response (Traccar's GET may return stale data right after POST)
      queryClient.setQueryData<Device[]>(QUERY_KEYS.devices, (old) => {
        if (!old) return old;
        return old.map((d) => (d.id === serverDevice.id ? { ...d, ...serverDevice } : d));
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDevices) {
        queryClient.setQueryData(QUERY_KEYS.devices, context.previousDevices);
      }
    },
  });
}