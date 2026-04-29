import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { User } from '@shared/api/types.models';

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/users/{id}', {
        params: { path: { id } },
      });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      const previous = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old) => {
        if (!old) return old;
        return old.filter((u) => u.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.users, context.previous);
      }
    },
  });
}