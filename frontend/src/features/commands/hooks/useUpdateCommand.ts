import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Command } from '@shared/api/types.models';

export function useUpdateCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: Command) => {
      if (!command.id) throw new Error('Command ID is required');
      const { data, error } = await apiClient.PUT('/commands/{id}', {
        params: { path: { id: command.id } },
        body: command,
      });
      if (error) throw error;
      return { ...data!, id: command.id };
    },
    onMutate: async (command) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.commands });
      const previous = queryClient.getQueryData<Command[]>(QUERY_KEYS.commands);
      queryClient.setQueryData<Command[]>(QUERY_KEYS.commands, (old) => {
        if (!old) return old;
        return old.map((c) => (c.id === command.id ? { ...c, ...command } : c));
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
