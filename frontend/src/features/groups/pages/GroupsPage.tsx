import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useGroups } from '@features/groups/hooks/useGroups';
import { useDeleteGroup } from '@features/groups/hooks/useDeleteGroup';
import { GroupTable } from '@features/groups/components/GroupTable';
import { GroupForm } from '@features/groups/components/GroupForm';
import { IconPlus } from '@shared/ui/icons';
import type { Group } from '@shared/api/types.models';

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

export function GroupsPage() {
  const { canManage } = usePermissions();
  const { data: groups = [], isLoading, isError, refetch } = useGroups();
  const deleteGroup = useDeleteGroup();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const deleteError = deleteGroup.error ? (deleteGroup.error as Error).message : null;

  const handleAdd = () => {
    setEditingGroup(null);
    setFormOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormOpen(true);
  };

  const handleDelete = (group: Group) => {
    if (group.id != null) {
      deleteGroup.mutate(group.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Grupos</h1>
          <p style={subStyle}>Organización de dispositivos en grupos.</p>
        </div>
        {canManage && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nuevo Grupo
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <GroupTable
        groups={groups}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <GroupForm
        open={formOpen}
        group={editingGroup}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setEditingGroup(null);
        }}
      />
    </div>
  );
}

export default GroupsPage;