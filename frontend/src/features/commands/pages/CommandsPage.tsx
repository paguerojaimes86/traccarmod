import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useCommands } from '@features/commands/hooks/useCommands';
import { useDeleteCommand } from '@features/commands/hooks/useDeleteCommand';
import { CommandTable } from '@features/commands/components/CommandTable';
import { CommandForm } from '@features/commands/components/CommandForm';
import { IconPlus } from '@shared/ui/icons';
import type { Command } from '@shared/api/types.models';

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

export function CommandsPage() {
  const { canSendCommands } = usePermissions();
  const { data: commands = [], isLoading, isError, refetch } = useCommands();
  const deleteCommand = useDeleteCommand();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);

  const deleteError = deleteCommand.error ? (deleteCommand.error as Error).message : null;

  const handleAdd = () => {
    setEditingCommand(null);
    setFormOpen(true);
  };

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormOpen(true);
  };

  const handleDelete = (command: Command) => {
    if (command.id != null) {
      deleteCommand.mutate(command.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Comandos</h1>
          <p style={subStyle}>Envío de comandos a dispositivos.</p>
        </div>
        {canSendCommands && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nuevo Comando
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <CommandTable
        commands={commands}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canSendCommands}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CommandForm
        open={formOpen}
        command={editingCommand}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setEditingCommand(null);
        }}
      />
    </div>
  );
}

export default CommandsPage;