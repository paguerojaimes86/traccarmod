import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Calendar } from '@shared/api/types.models';

export function useUpdateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...u }: Partial<Calendar> & { id: number }) => {
      const { data, error } = await apiClient.PUT('/calendars/{id}', { params: { path: { id } }, body: u as Calendar });
      if (error) throw error;
      return { ...data!, id };
    },
    onMutate: async ({ id, ...u }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.calendars });
      const prev = qc.getQueryData<Calendar[]>(QUERY_KEYS.calendars);
      qc.setQueryData<Calendar[]>(QUERY_KEYS.calendars, (old) => old ? old.map((g) => g.id === id ? { ...g, ...u } : g) : old);
      return { prev };
    },
    onSuccess: (s) => { qc.setQueryData<Calendar[]>(QUERY_KEYS.calendars, (old) => old ? old.map((g) => g.id === s.id ? { ...g, ...s } : g) : old); },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(QUERY_KEYS.calendars, ctx.prev); },
  });
}
