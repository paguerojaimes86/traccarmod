import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Server } from '@shared/api/types.models';

export function useUpdateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (server: Server) => {
      const { data, error } = await apiClient.PUT('/server', {
        body: server,
      });
      if (error) throw error;
      return data!;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.server, updated);
    },
  });
}
