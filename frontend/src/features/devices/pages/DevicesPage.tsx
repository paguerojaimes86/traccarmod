import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useGroups } from '@features/groups/hooks/useGroups';
import { useDeleteDevice } from '@features/devices/hooks/useDeleteDevice';
import { DeviceTable } from '@features/devices/components/DeviceTable';
import { DeviceForm } from '@features/devices/components/DeviceForm';
import { IconPlus } from '@shared/ui/icons';
import type { Device } from '@shared/api/types.models';

const pageStyle: CSSProperties = {
  padding: '2rem',
  height: '100%',
  overflow: 'auto',
};

const headerStyle: CSSProperties = {
  fontFamily: 'var(--font-family-base)',
  fontWeight: 800,
  fontSize: '1.5rem',
  color: 'var(--text-primary)',
  marginBottom: '0.5rem',
};

const subStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  marginBottom: '1.5rem',
};

const buttonStyle: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.75rem',
  border: '1px solid var(--color-primary-border)',
  backgroundColor: 'var(--color-primary-light)',
  color: 'var(--color-primary)',
  fontSize: '0.8125rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
  fontFamily: 'var(--font-family-base)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
};

export function DevicesPage() {
  const { canManageDevices } = usePermissions();
  const { data: devices = [], isLoading, isError, refetch } = useDevices();
  const { data: groups = [] } = useGroups();
  const deleteDevice = useDeleteDevice();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const deleteError = deleteDevice.error ? (deleteDevice.error as Error).message : null;

  const handleAdd = () => {
    setEditingDevice(null);
    setFormOpen(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormOpen(true);
  };

  const handleDelete = (device: Device) => {
    if (device.id != null) {
      deleteDevice.mutate(device.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Dispositivos</h1>
          <p style={subStyle}>Administración de dispositivos GPS.</p>
        </div>
        {canManageDevices && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nuevo Dispositivo
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <DeviceTable
        devices={devices}
        groups={groups}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManageDevices}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DeviceForm
        open={formOpen}
        device={editingDevice}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

export default DevicesPage;
