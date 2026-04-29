import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateDevice } from './useCreateDevice';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

vi.mock('@shared/api/client', () => ({
  apiClient: {
    POST: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useCreateDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /devices and returns created device', async () => {
    const mockDevice = { id: 1, name: 'Test Device', uniqueId: '123' };
    (apiClient.POST as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockDevice, error: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDevice(), { wrapper });

    result.current.mutate({ name: 'Test Device', uniqueId: '123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.POST).toHaveBeenCalledWith('/devices', {
      body: { name: 'Test Device', uniqueId: '123' },
    });
    expect(result.current.data).toEqual(mockDevice);
  });

  it('uses optimistic update — adds device to cache without invalidation', async () => {
    const mockDevice = { id: 1, name: 'Test Device', uniqueId: '123' };
    (apiClient.POST as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockDevice, error: undefined });

    const { queryClient, wrapper } = createWrapper();
    // Seed initial cache
    queryClient.setQueryData(QUERY_KEYS.devices, [
      { id: 99, name: 'Existing', uniqueId: '999' },
    ]);

    const { result } = renderHook(() => useCreateDevice(), { wrapper });

    result.current.mutate({ name: 'Test Device', uniqueId: '123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should now include both devices (optimistic update)
    const cached = queryClient.getQueryData(QUERY_KEYS.devices) as { id: number }[];
    expect(cached).toHaveLength(2);
    expect(cached.find((d) => d.id === 1)).toBeTruthy();
  });
});
