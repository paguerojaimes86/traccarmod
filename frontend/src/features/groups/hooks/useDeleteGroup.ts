import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Group } from '@shared/api/types.models';

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/groups/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups });
      const previous = queryClient.getQueryData<Group[]>(QUERY_KEYS.groups);
      queryClient.setQueryData<Group[]>(QUERY_KEYS.groups, (old) => {
        if (!old) return old;
        return old.filter((g) => g.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.groups, context.previous);
      }
    },
  });
}