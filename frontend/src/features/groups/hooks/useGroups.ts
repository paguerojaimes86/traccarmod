import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useGroups() {
  return useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/groups');
      if (error) throw error;
      return data ?? [];
    },
  });
}
