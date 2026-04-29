import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useGeofences } from '@features/geofences/hooks/useGeofences';
import { useDeleteGeofence } from '@features/geofences/hooks/useDeleteGeofence';
import { GeofenceTable } from '@features/geofences/components/GeofenceTable';
import { GeofenceForm } from '@features/geofences/components/GeofenceForm';
import { IconPlus } from '@shared/ui/icons';
import type { Geofence } from '@shared/api/types.models';

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

export function GeofencesPage() {
  const { canManage } = usePermissions();
  const { data: geofences = [], isLoading, isError, refetch } = useGeofences();
  const deleteGeofence = useDeleteGeofence();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);

  const deleteError = deleteGeofence.error ? (deleteGeofence.error as Error).message : null;

  const handleAdd = () => {
    setEditingGeofence(null);
    setFormOpen(true);
  };

  const handleEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setFormOpen(true);
  };

  const handleDelete = (geofence: Geofence) => {
    if (geofence.id != null) {
      deleteGeofence.mutate(geofence.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Geocercas</h1>
          <p style={subStyle}>Definición de zonas geográficas.</p>
        </div>
        {canManage && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nueva Geocerca
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <GeofenceTable
        geofences={geofences}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <GeofenceForm
        open={formOpen}
        geofence={editingGeofence}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          // Don't refetch — Traccar's server cache returns stale data after PUT.
          // The optimistic update in useUpdateGeofence already updated the cache.
          setEditingGeofence(null);
        }}
      />
    </div>
  );
}

export default GeofencesPage;