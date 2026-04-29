import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { User } from '@shared/api/types.models';

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: User) => {
      if (!user.id) throw new Error('User ID is required');
      const { data, error } = await apiClient.PUT('/users/{id}', {
        params: { path: { id: user.id } },
        body: user,
      });
      if (error) throw error;
      return { ...data!, id: user.id };
    },
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      const previous = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old) => {
        if (!old) return old;
        return old.map((u) => (u.id === user.id ? { ...u, ...user } : u));
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
