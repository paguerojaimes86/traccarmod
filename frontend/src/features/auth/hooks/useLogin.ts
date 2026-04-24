import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { useAuthStore } from '../store';

interface LoginCredentials {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data, error } = await apiClient.POST('/session', {
        body: credentials as unknown as never,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if (error) throw error;
      return data!;
    },
    onSuccess: (user) => {
      useAuthStore.getState().setSession(user);
    },
  });
}
