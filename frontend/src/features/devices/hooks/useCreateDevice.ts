import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Device } from '@shared/api/types.models';

export function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (device: Partial<Device>) => {
      const { data, error } = await apiClient.POST('/devices', {
        body: device as Device,
      });
      if (error) throw error;
      return data!;
    },
    onSuccess: (newDevice) => {
      // Add new device to cache directly — no refetch needed
      queryClient.setQueryData<Device[]>(QUERY_KEYS.devices, (old) => {
        if (!old) return [newDevice];
        return [...old, newDevice];
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices });
    },
  });
}