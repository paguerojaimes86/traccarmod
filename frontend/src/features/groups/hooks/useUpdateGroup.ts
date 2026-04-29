import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Group } from '@shared/api/types.models';

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (group: Group) => {
      if (!group.id) throw new Error('Group ID is required');
      const { data, error } = await apiClient.PUT('/groups/{id}', {
        params: { path: { id: group.id } },
        body: group,
      });
      if (error) throw error;
      return { ...data!, id: group.id };
    },
    onMutate: async (group) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.groups });
      const previous = queryClient.getQueryData<Group[]>(QUERY_KEYS.groups);
      queryClient.setQueryData<Group[]>(QUERY_KEYS.groups, (old) => {
        if (!old) return old;
        return old.map((g) => (g.id === group.id ? { ...g, ...group } : g));
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
