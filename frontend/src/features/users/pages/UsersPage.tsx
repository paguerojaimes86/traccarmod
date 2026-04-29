import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useUsers } from '@features/users/hooks/useUsers';
import { useDeleteUser } from '@features/users/hooks/useDeleteUser';
import { UserTable } from '@features/users/components/UserTable';
import { UserForm } from '@features/users/components/UserForm';
import { IconPlus } from '@shared/ui/icons';
import type { User } from '@shared/api/types.models';

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

export function UsersPage() {
  const { canManageUsers } = usePermissions();
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const deleteUser = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const deleteError = deleteUser.error ? (deleteUser.error as Error).message : null;

  const handleAdd = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleDelete = (user: User) => {
    if (user.id != null) {
      deleteUser.mutate(user.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Usuarios</h1>
          <p style={subStyle}>Gestión de usuarios del sistema.</p>
        </div>
        {canManageUsers && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <UserTable
        users={users}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManageUsers}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <UserForm
        open={formOpen}
        user={editingUser}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setEditingUser(null);
        }}
      />
    </div>
  );
}

export default UsersPage;