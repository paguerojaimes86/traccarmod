import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateDevice } from './useUpdateDevice';
import { apiClient } from '@shared/api/client';

vi.mock('@shared/api/client', () => ({
  apiClient: {
    PUT: vi.fn(),
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

describe('useUpdateDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /devices/{id} and returns updated device', async () => {
    const mockDevice = { id: 1, name: 'Updated Device', uniqueId: '123' };
    (apiClient.PUT as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockDevice, error: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateDevice(), { wrapper });

    result.current.mutate({ id: 1, name: 'Updated Device' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.PUT).toHaveBeenCalledWith('/devices/{id}', {
      params: { path: { id: 1 } },
      body: { name: 'Updated Device' },
    });
    expect(result.current.data).toEqual(mockDevice);
  });

  it('invalidates devices query on success', async () => {
    const mockDevice = { id: 1, name: 'Updated Device', uniqueId: '123' };
    (apiClient.PUT as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockDevice, error: undefined });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateDevice(), { wrapper });

    result.current.mutate({ id: 1, name: 'Updated Device' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['devices'] });
  });
});
