import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useCalendarsList() {
  return useQuery({
    queryKey: [...QUERY_KEYS.calendars],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/calendars');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}
