import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Maintenance } from '@shared/api/types.models';

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenance: Partial<Maintenance>) => {
      const { data, error } = await apiClient.POST('/maintenance', {
        body: maintenance as Maintenance,
      });
      if (error) throw error;
      return data!;
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<Maintenance[]>(QUERY_KEYS.maintenance, (old) => {
        if (!old) return [newItem];
        return [...old, newItem];
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maintenance });
    },
  });
}
