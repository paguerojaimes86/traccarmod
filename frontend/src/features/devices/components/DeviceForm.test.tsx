import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { DeviceForm } from '../components/DeviceForm';
import { apiClient } from '@shared/api/client';

vi.mock('@shared/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
    POST: vi.fn(),
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

describe('DeviceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors when required fields are empty', async () => {
    (apiClient.GET as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: undefined });
    const { wrapper } = createWrapper();
    render(<DeviceForm open={true} onClose={vi.fn()} />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: /crear dispositivo/i }));

    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El Unique ID es obligatorio')).toBeInTheDocument();
    });
  });

  it('submits create mutation with correct payload', async () => {
    (apiClient.GET as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ id: 1, name: 'Flota A' }],
      error: undefined,
    });
    (apiClient.POST as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: 10 },
      error: undefined,
    });

    const { wrapper } = createWrapper();
    const onClose = vi.fn();
    render(<DeviceForm open={true} onClose={onClose} />, { wrapper });

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledWith('/groups'));

    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'Nuevo GPS' } });
    fireEvent.change(screen.getByLabelText('Unique ID *'), { target: { value: 'UNIQ-001' } });

    fireEvent.click(screen.getByRole('button', { name: /crear dispositivo/i }));

    await waitFor(() => {
      expect(apiClient.POST).toHaveBeenCalledWith('/devices', {
        body: expect.objectContaining({
          name: 'Nuevo GPS',
          uniqueId: 'UNIQ-001',
          attributes: {},
        }),
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('submits update mutation preserving existing attributes', async () => {
    (apiClient.GET as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ id: 1, name: 'Flota A' }],
      error: undefined,
    });
    (apiClient.PUT as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: 5 },
      error: undefined,
    });

    const device = {
      id: 5,
      name: 'Old Name',
      uniqueId: 'OLD-001',
      groupId: 1,
      phone: null,
      model: null,
      contact: null,
      category: null,
      attributes: { custom: 'value' },
    } as any;

    const { wrapper } = createWrapper();
    const onClose = vi.fn();
    render(<DeviceForm open={true} device={device} onClose={onClose} />, { wrapper });

    await waitFor(() => expect(apiClient.GET).toHaveBeenCalledWith('/groups'));

    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'Updated Name' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(apiClient.PUT).toHaveBeenCalledWith('/devices/{id}', {
        params: { path: { id: 5 } },
        body: expect.objectContaining({
          name: 'Updated Name',
          uniqueId: 'OLD-001',
          attributes: { custom: 'value' },
        }),
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
