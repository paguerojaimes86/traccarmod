import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Calendar } from '@shared/api/types.models';

export function useCreateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Calendar>) => {
      const { data, error } = await apiClient.POST('/calendars', { body: body as Calendar });
      if (error) throw error;
      return data!;
    },
    onSuccess: (d) => { qc.setQueryData<Calendar[]>(QUERY_KEYS.calendars, (old) => old ? [...old, d] : [d]); },
    onError: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.calendars }); },
  });
}
