import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DevicesPage } from '../pages/DevicesPage';

const mocks = vi.hoisted(() => ({
  useDevices: vi.fn(),
  useGroups: vi.fn(),
  useCreateDevice: vi.fn(),
  useUpdateDevice: vi.fn(),
  useDeleteDevice: vi.fn(),
  usePermissions: vi.fn(),
}));

vi.mock('@features/devices/hooks/useDevices', () => ({
  useDevices: () => mocks.useDevices(),
}));

vi.mock('@features/groups/hooks/useGroups', () => ({
  useGroups: () => mocks.useGroups(),
}));

vi.mock('@features/devices/hooks/useCreateDevice', () => ({
  useCreateDevice: () => mocks.useCreateDevice(),
}));

vi.mock('@features/devices/hooks/useUpdateDevice', () => ({
  useUpdateDevice: () => mocks.useUpdateDevice(),
}));

vi.mock('@features/devices/hooks/useDeleteDevice', () => ({
  useDeleteDevice: () => mocks.useDeleteDevice(),
}));

vi.mock('@shared/permissions', () => ({
  usePermissions: () => mocks.usePermissions(),
}));

function makeDevice(overrides: Partial<{ id: number; name: string; uniqueId: string }> = {}) {
  return {
    id: 1,
    name: 'GPS 1',
    uniqueId: 'U1',
    status: 'online',
    groupId: null,
    phone: null,
    model: null,
    contact: null,
    category: null,
    ...overrides,
  };
}

describe('DevicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useDevices.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    mocks.useGroups.mockReturnValue({ data: [] });
    mocks.useCreateDevice.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null });
    mocks.useUpdateDevice.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null });
    mocks.useDeleteDevice.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mocks.usePermissions.mockReturnValue({ canManageDevices: true });
  });

  it('renders device table with data', () => {
    mocks.useDevices.mockReturnValue({
      data: [makeDevice()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<DevicesPage />);

    expect(screen.getByText('GPS 1')).toBeInTheDocument();
    expect(screen.getByText('U1')).toBeInTheDocument();
  });

  it('hides add/edit/delete actions when canManageDevices is false', () => {
    mocks.usePermissions.mockReturnValue({ canManageDevices: false });
    mocks.useDevices.mockReturnValue({
      data: [makeDevice()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<DevicesPage />);

    expect(screen.queryByRole('button', { name: /nuevo dispositivo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('opens form when clicking add device', () => {
    render(<DevicesPage />);

    fireEvent.click(screen.getByRole('button', { name: /nuevo dispositivo/i }));

    expect(screen.getByRole('heading', { name: /nuevo dispositivo/i })).toBeInTheDocument();
  });

  it('adds a device and reflects it in the table', async () => {
    const initialDevices = [makeDevice()];
    mocks.useDevices.mockReturnValue({
      data: initialDevices,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useGroups.mockReturnValue({ data: [{ id: 1, name: 'Flota A' }] });
    const createMutateAsync = vi.fn().mockResolvedValue({});
    mocks.useCreateDevice.mockReturnValue({ mutateAsync: createMutateAsync, isPending: false, error: null });

    const { rerender } = render(<DevicesPage />);

    expect(screen.getByText('GPS 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /nuevo dispositivo/i }));

    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'GPS Nuevo' } });
    fireEvent.change(screen.getByLabelText('Unique ID *'), { target: { value: 'U2' } });

    fireEvent.click(screen.getByRole('button', { name: /crear dispositivo/i }));

    await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());

    const updatedDevices = [...initialDevices, makeDevice({ id: 2, name: 'GPS Nuevo', uniqueId: 'U2' })];
    mocks.useDevices.mockReturnValue({
      data: updatedDevices,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    rerender(<DevicesPage />);

    expect(screen.getByText('GPS Nuevo')).toBeInTheDocument();
  });

  it('deletes a device and removes it from the table', async () => {
    const devices = [makeDevice()];
    mocks.useDevices.mockReturnValue({
      data: devices,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useGroups.mockReturnValue({ data: [] });
    const deleteMutate = vi.fn();
    mocks.useDeleteDevice.mockReturnValue({ mutate: deleteMutate, isPending: false });

    const { rerender } = render(<DevicesPage />);

    expect(screen.getByText('GPS 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() => expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /^eliminar$/i });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith(1));

    mocks.useDevices.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: vi.fn() });
    rerender(<DevicesPage />);

    expect(screen.queryByText('GPS 1')).not.toBeInTheDocument();
  });
});
