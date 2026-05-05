import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useMaintenanceList } from '../hooks/useMaintenanceList';
import { useDeleteMaintenance } from '../hooks/useDeleteMaintenance';
import { MaintenanceTable } from '../components/MaintenanceTable';
import { MaintenanceForm } from '../components/MaintenanceForm';
import { IconPlus } from '@shared/ui/icons';
import type { Maintenance } from '@shared/api/types.models';

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

export function MaintenancePage() {
  const { canManage } = usePermissions();
  const { data: items = [], isLoading, isError, refetch } = useMaintenanceList();
  const deleteItem = useDeleteMaintenance();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Maintenance | null>(null);

  const deleteError = deleteItem.error ? (deleteItem.error as Error).message : null;

  const handleAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: Maintenance) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDelete = (item: Maintenance) => {
    if (item.id != null) {
      deleteItem.mutate(item.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Mantenimiento</h1>
          <p style={subStyle}>Gestión de tareas de mantenimiento por dispositivo.</p>
        </div>
        {canManage && (
          <button style={buttonStyle} onClick={handleAdd}>
            <IconPlus size={16} />
            Nuevo Mantenimiento
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <MaintenanceTable
        items={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <MaintenanceForm
        open={formOpen}
        item={editingItem}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setEditingItem(null); }}
      />
    </div>
  );
}

export default MaintenancePage;
