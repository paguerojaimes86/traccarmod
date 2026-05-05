import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Maintenance } from '@shared/api/types.models';

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Maintenance> & { id: number }) => {
      const { data, error } = await apiClient.PUT('/maintenance/{id}', {
        params: { path: { id } },
        body: updates as Maintenance,
      });
      if (error) throw error;
      return { ...data!, id };
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.maintenance });
      const previous = queryClient.getQueryData<Maintenance[]>(QUERY_KEYS.maintenance);
      queryClient.setQueryData<Maintenance[]>(QUERY_KEYS.maintenance, (old) => {
        if (!old) return old;
        return old.map((g) => (g.id === id ? { ...g, ...updates } : g));
      });
      return { previous };
    },
    onSuccess: (serverItem) => {
      queryClient.setQueryData<Maintenance[]>(QUERY_KEYS.maintenance, (old) => {
        if (!old) return old;
        return old.map((g) => (g.id === serverItem.id ? { ...g, ...serverItem } : g));
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.maintenance, context.previous);
      }
    },
  });
}
