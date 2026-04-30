import { useState, useMemo, type CSSProperties } from 'react';
import { Pencil } from 'lucide-react';
import { IconSearch, IconTrash2 } from '@shared/ui/icons';
import { LoadingState, ErrorState } from '@shared/ui';
import { getAlertConfig } from '@shared/lib/alert-types';
import type { Notification } from '@shared/api/types.models';

interface NotificationTableProps {
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
  onToggle: (notification: Notification) => void;
}

const PAGE_SIZE = 10;

const NOTIFICATOR_LABELS: Record<string, string> = {
  web: 'Web',
  mail: 'Email',
  sms: 'SMS',
};

const searchContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1.5rem',
};

const searchInputStyle: CSSProperties = {
  flex: 1,
  padding: '0.625rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 600,
  outline: 'none',
  transition: 'all 0.2s',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 0.625rem',
  fontSize: '0.875rem',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0 1rem 0.5rem',
  color: '#64748b',
  fontWeight: 700,
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  cursor: 'pointer',
  userSelect: 'none',
};

const rowStyle: CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
};

const tdStyle: CSSProperties = {
  padding: '1rem',
  borderTop: '1px solid rgba(15, 23, 42, 0.04)',
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
};

const pillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.25rem 0.625rem',
  borderRadius: '2rem',
  backgroundColor: `${color}18`,
  color,
  fontSize: '0.7rem',
  fontWeight: 700,
  border: `1px solid ${color}30`,
  letterSpacing: '0.025em',
});

const actionBtnStyle: CSSProperties = {
  padding: '0.375rem',
  borderRadius: '0.5rem',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const paginationStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: '1rem',
  fontSize: '0.8125rem',
  color: '#64748b',
  fontWeight: 600,
};

const pageBtnStyle: CSSProperties = {
  padding: '0.5rem 0.875rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'Outfit, system-ui, sans-serif',
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(4px)',
};

const confirmCardStyle: CSSProperties = {
  width: '360px',
  maxWidth: '90vw',
  borderRadius: '1.25rem',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
  padding: '1.5rem',
};

const cancelBtnStyle: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'Outfit',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  color: '#64748b',
  border: '1px solid rgba(15, 23, 42, 0.08)',
};

const deleteBtnStyle: CSSProperties = {
  padding: '0.625rem 1.25rem',
  borderRadius: '0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'Outfit',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: '#ef4444',
  color: '#fff',
  border: 'none',
};

const toggleTrackStyle = (active: boolean): CSSProperties => ({
  width: '36px',
  height: '20px',
  borderRadius: '10px',
  backgroundColor: active ? '#10b981' : '#d1d5db',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  border: 'none',
  padding: 0,
  flexShrink: 0,
});

const toggleThumbStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  backgroundColor: '#fff',
  position: 'absolute',
  top: '2px',
  left: '2px',
  transition: 'transform 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

function parseNotificators(notificators?: string): string[] {
  if (!notificators) return [];
  return notificators.split(',').filter(Boolean);
}

function formatNotificators(notificators?: string): string {
  const channels = parseNotificators(notificators);
  if (channels.length === 0) return '—';
  return channels.map((ch) => NOTIFICATOR_LABELS[ch] ?? ch).join(', ');
}

function getSortValue(notification: Notification, key: string): string {
  if (key === 'type') {
    const config = getAlertConfig(notification.type ?? '');
    return config.label.toLowerCase();
  }
  if (key === 'always') {
    return notification.always ? '1' : '0';
  }
  if (key === 'notificators') {
    return (notification.notificators ?? '').toLowerCase();
  }
  return String((notification as Record<string, unknown>)[key] ?? '').toLowerCase();
}

export function NotificationTable({
  notifications,
  isLoading,
  isError,
  onRetry,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onToggle,
}: NotificationTableProps) {
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<string | null>('type');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<Notification | null>(null);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return notifications;
    const k = keyword.toLowerCase();
    return notifications.filter((n) => {
      const config = getAlertConfig(n.type ?? '');
      const typeLabel = config.label.toLowerCase();
      const desc = (n.description ?? '').toLowerCase();
      const notifStr = (n.notificators ?? '').toLowerCase();
      return typeLabel.includes(k) || desc.includes(k) || notifStr.includes(k);
    });
  }, [notifications, keyword]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const showActions = canEdit || canDelete;
  const columns = [
    { key: 'type', label: 'Tipo' },
    { key: 'notificators', label: 'Canales' },
    { key: 'devices', label: 'Dispositivos' },
    { key: 'always', label: 'Modo' },
    { key: 'description', label: 'Descripción' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <LoadingState message="Cargando alertas..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <ErrorState message="Error al cargar alertas" onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div>
      <div style={searchContainerStyle}>
        <IconSearch size={18} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Buscar por tipo, canales, descripción..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={searchInputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)';
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)';
          }}
        />
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={thStyle} onClick={() => handleSort(col.key)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </span>
              </th>
            ))}
            {showActions && <th style={{ ...thStyle, width: '80px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((notification) => {
            const config = getAlertConfig(notification.type ?? '');
            const typeIcon = config.icon || '🔔';
            const typeLabel = config.label || notification.type || 'Desconocido';
            const typeColor = config.color || '#6b7280';

            return (
              <tr key={notification.id} style={rowStyle} className="notif-row">
                {/* Tipo */}
                <td style={{ ...tdStyle, borderTopLeftRadius: '1.125rem', borderBottomLeftRadius: '1.125rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                  <div style={pillStyle(typeColor)}>
                    <span>{typeIcon}</span>
                    <span>{typeLabel}</span>
                  </div>
                </td>

                {/* Canales */}
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                    {formatNotificators(notification.notificators)}
                  </span>
                </td>

                {/* Dispositivos — show count from edit form, placeholder in table */}
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>—</span>
                </td>

                {/* Siempre/Programado toggle */}
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      style={{
                        ...toggleTrackStyle(!!notification.always),
                        ...(canEdit ? {} : { opacity: 0.5, cursor: 'not-allowed' }),
                      }}
                      onClick={canEdit ? () => onToggle(notification) : undefined}
                      title={canEdit ? (notification.always ? 'Cambiar a Programado' : 'Cambiar a Siempre') : 'Sin permisos para editar'}
                      aria-label={notification.always ? 'Desactivar siempre' : 'Activar siempre'}
                      disabled={!canEdit}
                    >
                      <span style={{
                        ...toggleThumbStyle,
                        transform: notification.always ? 'translateX(16px)' : 'translateX(0)',
                      }} />
                    </button>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: notification.always ? '#10b981' : '#6366f1',
                      fontFamily: 'Outfit',
                    }}>
                      {notification.always ? 'Siempre' : 'Programado'}
                    </span>
                  </div>
                </td>

                {/* Descripción */}
                <td style={tdStyle}>
                  {notification.description ? (
                    <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                      {notification.description.length > 50
                        ? `${notification.description.slice(0, 50)}…`
                        : notification.description}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>

                {/* Acciones */}
                {showActions && (
                  <td style={{ ...tdStyle, borderTopRightRadius: '1.125rem', borderBottomRightRadius: '1.125rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {canEdit && (
                        <button
                          style={{ ...actionBtnStyle, color: '#6366f1' }}
                          onClick={() => onEdit(notification)}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Editar"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          style={{ ...actionBtnStyle, color: '#ef4444' }}
                          onClick={() => setConfirmTarget(notification)}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <IconTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageItems.length === 0 && sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>🔔</div>
          <div style={{ fontFamily: 'Outfit', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            No hay alertas configuradas
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Crea tu primera alerta para recibir notificaciones en tiempo real.
          </div>
        </div>
      )}

      {pageItems.length === 0 && sorted.length > 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.875rem' }}>
          No se encontraron alertas para esa búsqueda
        </div>
      )}

      <div style={paginationStyle}>
        <span>
          {sorted.length > 0
            ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} de ${sorted.length}`
            : '0 resultados'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={pageBtnStyle} onClick={handlePrev} disabled={page <= 1}>
            Anterior
          </button>
          <button style={pageBtnStyle} onClick={handleNext} disabled={page >= totalPages}>
            Siguiente
          </button>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {confirmTarget && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setConfirmTarget(null)}>
          <div style={confirmCardStyle}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
              Confirmar eliminación
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
              ¿Eliminar la alerta <strong style={{ color: '#0f172a' }}>{getAlertConfig(confirmTarget.type ?? '').label}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                style={cancelBtnStyle}
                onClick={() => setConfirmTarget(null)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Cancelar
              </button>
              <button
                style={deleteBtnStyle}
                onClick={() => {
                  onDelete(confirmTarget);
                  setConfirmTarget(null);
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .notif-row:hover {
          background-color: rgba(99, 102, 241, 0.06) !important;
          transform: scale(1.005) translateX(4px);
          box-shadow: 0 4px 20px -5px rgba(15, 23, 42, 0.1);
        }
        .notif-row {
          border: 1px solid transparent;
        }
      `}</style>
    </div>
  );
}