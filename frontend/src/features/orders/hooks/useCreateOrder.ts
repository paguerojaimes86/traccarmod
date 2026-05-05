import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Order } from '@shared/api/types.models';

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Order>) => {
      const { data, error } = await apiClient.POST('/orders', { body: body as Order });
      if (error) throw error;
      return data!;
    },
    onSuccess: (d) => { qc.setQueryData<Order[]>(QUERY_KEYS.orders, (old) => old ? [...old, d] : [d]); },
    onError: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.orders }); },
  });
}
