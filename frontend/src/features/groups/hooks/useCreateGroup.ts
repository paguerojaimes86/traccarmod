import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Group } from '@shared/api/types.models';

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (group: Partial<Group>) => {
      const { data, error } = await apiClient.POST('/groups', {
        body: group as Group,
      });
      if (error) throw error;
      return data!;
    },
    onMutate: async (newGroup) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups });
      const previous = queryClient.getQueryData<Group[]>(QUERY_KEYS.groups);
      const optimisticId = Date.now();
      const optimistic = { ...newGroup, id: optimisticId } as Group;
      queryClient.setQueryData<Group[]>(QUERY_KEYS.groups, (old) => {
        if (!old) return [optimistic];
        return [...old, optimistic];
      });
      return { previous, optimisticId };
    },
    onSuccess: (serverItem, _vars, context) => {
      queryClient.setQueryData<Group[]>(QUERY_KEYS.groups, (old) => {
        if (!old) return [serverItem];
        // Replace the optimistic temp item with the real server response
        return old.map((g) => (g.id === context?.optimisticId ? serverItem : g));
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.groups, context.previous);
      }
    },
  });
}
