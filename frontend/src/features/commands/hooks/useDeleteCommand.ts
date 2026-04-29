import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Command } from '@shared/api/types.models';

export function useDeleteCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/commands/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.commands });
      const previous = queryClient.getQueryData<Command[]>(QUERY_KEYS.commands);
      queryClient.setQueryData<Command[]>(QUERY_KEYS.commands, (old) => {
        if (!old) return old;
        return old.filter((c) => c.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.commands, context.previous);
      }
    },
  });
}