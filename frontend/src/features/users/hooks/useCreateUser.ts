import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { User } from '@shared/api/types.models';

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const { data, error } = await apiClient.POST('/users', {
        body: user as User,
      });
      if (error) throw error;
      return data!;
    },
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.users });
      const previous = queryClient.getQueryData<User[]>(QUERY_KEYS.users);
      const optimisticId = Date.now();
      const optimistic = { ...newUser, id: optimisticId } as User;
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old) => {
        if (!old) return [optimistic];
        return [...old, optimistic];
      });
      return { previous, optimisticId };
    },
    onSuccess: (serverItem, _vars, context) => {
      queryClient.setQueryData<User[]>(QUERY_KEYS.users, (old) => {
        if (!old) return [serverItem];
        return old.map((u) => (u.id === context?.optimisticId ? serverItem : u));
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.users, context.previous);
      }
    },
  });
}
