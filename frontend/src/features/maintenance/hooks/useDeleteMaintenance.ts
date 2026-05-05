import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Maintenance } from '@shared/api/types.models';

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/maintenance/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.maintenance });
      const previous = queryClient.getQueryData<Maintenance[]>(QUERY_KEYS.maintenance);
      queryClient.setQueryData<Maintenance[]>(QUERY_KEYS.maintenance, (old) => {
        if (!old) return old;
        return old.filter((g) => g.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.maintenance, context.previous);
      }
    },
  });
}
