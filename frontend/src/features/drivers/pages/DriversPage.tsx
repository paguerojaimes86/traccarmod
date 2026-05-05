import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useDriversList } from '@features/drivers/hooks/useDriversList';
import { useDeleteDriver } from '@features/drivers/hooks/useDeleteDriver';
import { DriverTable } from '@features/drivers/components/DriverTable';
import { DriverForm } from '@features/drivers/components/DriverForm';
import { IconPlus } from '@shared/ui/icons';
import type { Driver } from '@shared/api/types.models';

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

export function DriversPage() {
  const { canManage } = usePermissions();
  const { data: drivers = [], isLoading, isError, refetch } = useDriversList();
  const deleteDriver = useDeleteDriver();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const deleteError = deleteDriver.error ? (deleteDriver.error as Error).message : null;

  const handleAdd = () => {
    setEditingDriver(null);
    setFormOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormOpen(true);
  };

  const handleDelete = (driver: Driver) => {
    if (driver.id != null) {
      deleteDriver.mutate(driver.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Conductores</h1>
          <p style={subStyle}>Gestión de conductores del sistema.</p>
        </div>
        {canManage && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nuevo Conductor
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <DriverTable
        items={drivers}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <DriverForm
        open={formOpen}
        item={editingDriver}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setEditingDriver(null);
        }}
      />
    </div>
  );
}

export default DriversPage;
