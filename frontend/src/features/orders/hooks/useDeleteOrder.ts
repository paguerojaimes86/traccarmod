import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Order } from '@shared/api/types.models';

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/orders/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.orders });
      const prev = qc.getQueryData<Order[]>(QUERY_KEYS.orders);
      qc.setQueryData<Order[]>(QUERY_KEYS.orders, (old) => old ? old.filter((g) => g.id !== id) : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.orders, ctx.prev); },
  });
}
