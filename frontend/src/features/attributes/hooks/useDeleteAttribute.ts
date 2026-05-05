import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Attribute } from '@shared/api/types.models';

export function useDeleteAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/attributes/computed/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.attributes });
      const prev = qc.getQueryData<Attribute[]>(QUERY_KEYS.attributes);
      qc.setQueryData<Attribute[]>(QUERY_KEYS.attributes, (old) => old ? old.filter((g) => g.id !== id) : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.attributes, ctx.prev); },
  });
}
