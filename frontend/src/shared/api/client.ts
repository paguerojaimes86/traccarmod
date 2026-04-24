import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';
import { useAuthStore } from '@features/auth/store';

const BASE_URL = '/api';

export const apiClient = createClient<paths>({
  baseUrl: BASE_URL,
  fetch: async (request: Request) => {
    const { token } = useAuthStore.getState();
    const headers = new Headers(request.headers);


    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const newRequest = new Request(request, {
      headers,
      credentials: 'include',
    });

    const response = await globalThis.fetch(newRequest);

    if (response.status === 401 && !request.url.includes('/session')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return response;
  },
});
