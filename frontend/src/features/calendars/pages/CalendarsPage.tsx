import { useState, type CSSProperties } from 'react';
import { usePermissions } from '@shared/permissions';
import { useCalendarsList } from '@features/calendars/hooks/useCalendarsList';
import { useDeleteCalendar } from '@features/calendars/hooks/useDeleteCalendar';
import { CalendarTable } from '@features/calendars/components/CalendarTable';
import { CalendarForm } from '@features/calendars/components/CalendarForm';
import { IconPlus } from '@shared/ui/icons';
import type { Calendar } from '@shared/api/types.models';

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

function CalendarsPage() {
  const { canManage } = usePermissions();
  const { data: calendars = [], isLoading, isError, refetch } = useCalendarsList();
  const deleteCalendar = useDeleteCalendar();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);

  const deleteError = deleteCalendar.error ? (deleteCalendar.error as Error).message : null;

  const handleAdd = () => {
    setEditingCalendar(null);
    setFormOpen(true);
  };

  const handleEdit = (calendar: Calendar) => {
    setEditingCalendar(calendar);
    setFormOpen(true);
  };

  const handleDelete = (calendar: Calendar) => {
    if (calendar.id != null) {
      deleteCalendar.mutate(calendar.id);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Calendarios</h1>
          <p style={subStyle}>Gestión de calendarios para programación de alertas.</p>
        </div>
        {canManage && (
          <button
            style={buttonStyle}
            onClick={handleAdd}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nuevo Calendario
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      <CalendarTable
        items={calendars}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canManage={canManage}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CalendarForm
        open={formOpen}
        calendar={editingCalendar}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setEditingCalendar(null);
        }}
      />
    </div>
  );
}

export default CalendarsPage;
