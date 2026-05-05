import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Driver } from '@shared/api/types.models';

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/drivers/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.drivers });
      const prev = qc.getQueryData<Driver[]>(QUERY_KEYS.drivers);
      qc.setQueryData<Driver[]>(QUERY_KEYS.drivers, (old) => old ? old.filter((g) => g.id !== id) : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.drivers, ctx.prev); },
  });
}
