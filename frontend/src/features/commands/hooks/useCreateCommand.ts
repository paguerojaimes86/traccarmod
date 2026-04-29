import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Command } from '@shared/api/types.models';

export function useCreateCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: Partial<Command>) => {
      const { data, error } = await apiClient.POST('/commands', {
        body: command as Command,
      });
      if (error) throw error;
      return data!;
    },
    onMutate: async (newCommand) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.commands });
      const previous = queryClient.getQueryData<Command[]>(QUERY_KEYS.commands);
      const optimisticId = Date.now();
      const optimistic = { ...newCommand, id: optimisticId } as Command;
      queryClient.setQueryData<Command[]>(QUERY_KEYS.commands, (old) => {
        if (!old) return [optimistic];
        return [...old, optimistic];
      });
      return { previous, optimisticId };
    },
    onSuccess: (serverItem, _vars, context) => {
      queryClient.setQueryData<Command[]>(QUERY_KEYS.commands, (old) => {
        if (!old) return [serverItem];
        return old.map((c) => (c.id === context?.optimisticId ? serverItem : c));
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.commands, context.previous);
      }
    },
  });
}
