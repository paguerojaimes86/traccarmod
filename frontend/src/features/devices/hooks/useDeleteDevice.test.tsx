import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteDevice } from './useDeleteDevice';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

vi.mock('@shared/api/client', () => ({
  apiClient: {
    DELETE: vi.fn(),
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

describe('useDeleteDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /devices/{id} with 204 response', async () => {
    (apiClient.DELETE as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteDevice(), { wrapper });

    result.current.mutate(42);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.DELETE).toHaveBeenCalledWith('/devices/{id}', {
      params: { path: { id: 42 } },
    });
  });

  it('uses optimistic update — removes device from cache without invalidation', async () => {
    (apiClient.DELETE as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: undefined });

    const { queryClient, wrapper } = createWrapper();
    // Seed initial cache
    queryClient.setQueryData(QUERY_KEYS.devices, [
      { id: 42, name: 'To Delete', uniqueId: '042' },
      { id: 99, name: 'Keep', uniqueId: '099' },
    ]);

    const { result } = renderHook(() => useDeleteDevice(), { wrapper });

    result.current.mutate(42);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should only have the remaining device
    const cached = queryClient.getQueryData(QUERY_KEYS.devices) as { id: number }[];
    expect(cached).toHaveLength(1);
    expect(cached.find((d) => d.id === 42)).toBeUndefined();
    expect(cached.find((d) => d.id === 99)).toBeTruthy();
  });
});
