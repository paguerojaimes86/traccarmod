import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Attribute } from '@shared/api/types.models';

export function useUpdateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<Attribute> & { id: number }) => {
      const { data, error } = await apiClient.PUT('/attributes/computed/{id}', { params: { path: { id } }, body: u as Attribute });
      if (error) throw error;
      return { ...data!, id };
    },
    onMutate: async ({ id, ...u }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.attributes });
      const prev = qc.getQueryData<Attribute[]>(QUERY_KEYS.attributes);
      qc.setQueryData<Attribute[]>(QUERY_KEYS.attributes, (old) => old ? old.map((g) => g.id === id ? { ...g, ...u } : g) : old);
      return { prev };
    },
    onSuccess: (s) => { qc.setQueryData<Attribute[]>(QUERY_KEYS.attributes, (old) => old ? old.map((g) => g.id === s.id ? { ...g, ...s } : g) : old); },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.attributes, ctx.prev); },
  });
}
