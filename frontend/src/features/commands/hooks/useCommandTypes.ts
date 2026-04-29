import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';

export function useCommandTypes() {
  return useQuery({
    queryKey: ['commandTypes'] as const,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/commands/types');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}