import { useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@shared/permissions';
import { useNotifications, useDeleteNotification } from '@features/notifications/hooks/useNotifications';
import { NotificationTable } from '@features/alerts/components/NotificationTable';
import { NotificationEditForm } from '@features/alerts/components/NotificationEditForm';
import { AlertWizard } from '@features/alerts/components/AlertWizard';
import { IconPlus } from '@shared/ui/icons';
import { QUERY_KEYS } from '@shared/lib/constants';
import type { Notification } from '@shared/api/types.models';

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

export function AlertsPage() {
  const { canCreateAlerts, canEditAlerts, canDeleteAlerts } = usePermissions();
  const { data: notifications = [], isLoading, isError, refetch } = useNotifications();
  const deleteNotification = useDeleteNotification();
  const queryClient = useQueryClient();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editNotification, setEditNotification] = useState<Notification | null>(null);

  const deleteError = deleteNotification.error ? (deleteNotification.error as Error).message : null;

  const isEmpty = !isLoading && notifications.length === 0;

  const handleEdit = (notification: Notification) => {
    setEditNotification(notification);
  };

  const handleDelete = (notification: Notification) => {
    if (notification.id != null) {
      deleteNotification.mutate(notification.id);
    }
  };

  const handleWizardSuccess = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    setWizardOpen(false);
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Alertas</h1>
          <p style={subStyle}>Configuración de notificaciones y alertas.</p>
        </div>
        {canCreateAlerts && (
          <button
            style={buttonStyle}
            onClick={() => setWizardOpen(true)}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            <IconPlus size={16} />
            Nueva Alerta
          </button>
        )}
      </div>

      {deleteError && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.625rem',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          fontSize: '0.8125rem',
          marginBottom: '1rem',
          fontWeight: 600,
        }}>
          Error al eliminar: {deleteError}
        </div>
      )}

      {isEmpty && canCreateAlerts && (
        <div style={{ textAlign: 'center', marginTop: '-0.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Hacé clic en <strong style={{ color: '#6366f1' }}>Nueva Alerta</strong> para crear tu primera notificación.
          </p>
        </div>
      )}

      <NotificationTable
        notifications={notifications}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        canEdit={canEditAlerts}
        canDelete={canDeleteAlerts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AlertWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />

      <NotificationEditForm
        open={editNotification !== null}
        notification={editNotification}
        onClose={() => setEditNotification(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default AlertsPage;