import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Attribute } from '@shared/api/types.models';

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Attribute>) => {
      const { data, error } = await apiClient.POST('/attributes/computed', { body: body as Attribute });
      if (error) throw error;
      return data!;
    },
    onSuccess: (d) => { qc.setQueryData<Attribute[]>(QUERY_KEYS.attributes, (old) => old ? [...old, d] : [d]); },
    onError: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.attributes }); },
  });
}
