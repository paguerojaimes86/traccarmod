import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';
import { useAuthStore } from '@features/auth/store';

const BASE_URL = import.meta.env.DEV ? '/api' : 'https://gps.msglobalgps.com/api';

const DEBUG = import.meta.env.DEV;

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

    if (DEBUG) {
      const method = newRequest.method;
      const url = newRequest.url;

      if (method !== 'GET') {
        const body = newRequest.bodyUsed ? '[body already consumed]' : await newRequest.clone().text().catch(() => '[unreadable]');
        console.log(`[apiClient] → ${method} ${url}`, body ? `\n  body: ${body}` : '');
      }
    }

    const response = await globalThis.fetch(newRequest);

    if (DEBUG && request.method !== 'GET') {
      const cloned = response.clone();
      const text = await cloned.text().catch(() => '[unreadable]');
      console.log(`[apiClient] ← ${response.status} ${request.method} ${newRequest.url}`, `\n  body: ${text.substring(0, 500)}`);
    }

    if (response.status === 401 && !request.url.includes('/session')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    return response;
  },
});
