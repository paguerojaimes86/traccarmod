import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateDevice } from './useCreateDevice';
import { apiClient } from '@shared/api/client';

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

  it('invalidates devices query on success', async () => {
    const mockDevice = { id: 1, name: 'Test Device', uniqueId: '123' };
    (apiClient.POST as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockDevice, error: undefined });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateDevice(), { wrapper });

    result.current.mutate({ name: 'Test Device', uniqueId: '123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['devices'] });
  });
});
