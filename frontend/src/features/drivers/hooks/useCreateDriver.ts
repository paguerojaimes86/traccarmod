import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Driver } from '@shared/api/types.models';

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Driver>) => {
      const { data, error } = await apiClient.POST('/drivers', { body: body as Driver });
      if (error) throw error;
      return data!;
    },
    onSuccess: (d) => { qc.setQueryData<Driver[]>(QUERY_KEYS.drivers, (old) => old ? [...old, d] : [d]); },
    onError: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.drivers }); },
  });
}
