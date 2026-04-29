import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store';
import type { User } from '@shared/api/types.models';

interface LoginCredentials {
  email: string;
  password: string;
}

const BASE_URL = import.meta.env.DEV ? '/api' : 'https://gps.msglobalgps.com/api';

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<User> => {
      const body = new URLSearchParams();
      body.append('email', credentials.email);
      body.append('password', credentials.password);

      const response = await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Login failed');
        throw new Error(text || `Login failed (${response.status})`);
      }

      return response.json() as Promise<User>;
    },
    onSuccess: (user) => {
      useAuthStore.getState().setSession(user);
    },
  });
}
