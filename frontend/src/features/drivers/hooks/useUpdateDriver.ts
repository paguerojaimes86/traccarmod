import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Driver } from '@shared/api/types.models';

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<Driver> & { id: number }) => {
      const { data, error } = await apiClient.PUT('/drivers/{id}', { params: { path: { id } }, body: u as Driver });
      if (error) throw error;
      return { ...data!, id };
    },
    onMutate: async ({ id, ...u }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.drivers });
      const prev = qc.getQueryData<Driver[]>(QUERY_KEYS.drivers);
      qc.setQueryData<Driver[]>(QUERY_KEYS.drivers, (old) => old ? old.map((g) => g.id === id ? { ...g, ...u } : g) : old);
      return { prev };
    },
    onSuccess: (s) => { qc.setQueryData<Driver[]>(QUERY_KEYS.drivers, (old) => old ? old.map((g) => g.id === s.id ? { ...g, ...s } : g) : old); },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.drivers, ctx.prev); },
  });
}
