import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { useAuthStore } from '../store';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.DELETE('/session');
      if (error) throw error;
    },
    onSuccess: () => {
      useAuthStore.getState().logout();
      queryClient.removeQueries({ queryKey: QUERY_KEYS.session });
    },
  });
}
