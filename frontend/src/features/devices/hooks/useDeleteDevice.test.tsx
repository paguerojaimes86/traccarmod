import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeleteDevice } from './useDeleteDevice';
import { apiClient } from '@shared/api/client';

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

  it('invalidates devices query on success', async () => {
    (apiClient.DELETE as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ error: undefined });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteDevice(), { wrapper });

    result.current.mutate(42);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['devices'] });
  });
});
