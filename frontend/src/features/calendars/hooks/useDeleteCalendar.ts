import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Calendar } from '@shared/api/types.models';

export function useDeleteCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/calendars/{id}', { params: { path: { id } } });
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.calendars });
      const prev = qc.getQueryData<Calendar[]>(QUERY_KEYS.calendars);
      qc.setQueryData<Calendar[]>(QUERY_KEYS.calendars, (old) => old ? old.filter((g) => g.id !== id) : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.calendars, ctx.prev); },
  });
}
