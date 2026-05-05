import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Order } from '@shared/api/types.models';

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<Order> & { id: number }) => {
      const { data, error } = await apiClient.PUT('/orders/{id}', { params: { path: { id } }, body: u as Order });
      if (error) throw error;
      return { ...data!, id };
    },
    onMutate: async ({ id, ...u }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orders });
      const prev = qc.getQueryData<Order[]>(QUERY_KEYS.orders);
      qc.setQueryData<Order[]>(QUERY_KEYS.orders, (old) => old ? old.map((g) => g.id === id ? { ...g, ...u } : g) : old);
      return { prev };
    },
    onSuccess: (s) => { qc.setQueryData<Order[]>(QUERY_KEYS.orders, (old) => old ? old.map((g) => g.id === s.id ? { ...g, ...s } : g) : old); },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.orders, ctx.prev); },
  });
}
