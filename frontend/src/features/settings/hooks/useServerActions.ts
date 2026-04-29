import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';

export function useServerActions() {
  const reboot = useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.POST('/server/reboot');
      if (error) throw error;
    },
  });

  const gc = useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.GET('/server/gc');
      if (error) throw error;
    },
  });

  const cacheInfo = useMutation({
    mutationFn: async () => {
      const { data, error } = await apiClient.GET('/server/cache');
      if (error) throw error;
      return data;
    },
  });

  return { reboot, gc, cacheInfo };
}
