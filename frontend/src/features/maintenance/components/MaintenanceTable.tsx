import { useState, useMemo, type CSSProperties } from 'react';
import { Pencil } from 'lucide-react';
import { IconSearch, IconTrash2 } from '@shared/ui/icons';
import { LoadingState, ErrorState } from '@shared/ui';
import type { Maintenance } from '@shared/api/types.models';

interface MaintenanceTableProps {
  items: Maintenance[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  canManage: boolean;
  onEdit: (item: Maintenance) => void;
  onDelete: (item: Maintenance) => void;
}

const PAGE_SIZE = 10;

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

const progressBgStyle: CSSProperties = {
  width: '100%',
  height: 6,
  borderRadius: 3,
  backgroundColor: 'rgba(15, 23, 42, 0.06)',
  overflow: 'hidden',
};

const progressFillStyle = (pct: number, color: string): CSSProperties => ({
  width: `${Math.min(pct, 100)}%`,
  height: '100%',
  borderRadius: 3,
  backgroundColor: color,
  transition: 'width 0.4s ease',
});

export function MaintenanceTable({
  items,
  isLoading,
  isError,
  onRetry,
  canManage,
  onEdit,
  onDelete,
}: MaintenanceTableProps) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [confirmItem, setConfirmItem] = useState<Maintenance | null>(null);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((m) =>
      [m.name, m.type].some((v) => v?.toLowerCase().includes(k)),
    );
  }, [items, keyword]);

  const sorted = filtered;
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'type', label: 'Tipo' },
    { key: 'progress', label: 'Progreso' },
  ];

  const progressColor = (pct: number) => {
    if (pct >= 90) return '#ef4444';
    if (pct >= 70) return '#f59e0b';
    return '#10b981';
  };

  if (isLoading) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <LoadingState message="Cargando mantenimientos..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <ErrorState message="Error al cargar mantenimientos" onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div>
      <div style={searchContainerStyle}>
        <IconSearch size={18} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, tipo..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
          style={searchInputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; }}
        />
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={thStyle}>{col.label}</th>
            ))}
            {canManage && <th style={{ ...thStyle, width: '80px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((m) => {
            const pct = m.period && m.period > 0
              ? Math.round(((m.start ?? 0) / m.period) * 100)
              : 0;
            const color = progressColor(pct);
            return (
              <tr key={m.id} style={rowStyle} className="maintenance-row">
                <td style={{ ...tdStyle, borderTopLeftRadius: '1.125rem', borderBottomLeftRadius: '1.125rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{m.name}</div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{m.type ?? '-'}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ flex: 1, maxWidth: 200 }}>
                      <div style={progressBgStyle}>
                        <div style={progressFillStyle(pct, color)} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color, minWidth: 36 }}>{pct}%</span>
                  </div>
                </td>
                {canManage && (
                  <td style={{ ...tdStyle, borderTopRightRadius: '1.125rem', borderBottomRightRadius: '1.125rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        style={{ ...actionBtnStyle, color: '#6366f1' }}
                        onClick={() => onEdit(m)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Editar"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        style={{ ...actionBtnStyle, color: '#ef4444' }}
                        onClick={() => setConfirmItem(m)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Eliminar"
                        aria-label="Eliminar"
                      >
                        <IconTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.875rem' }}>
          No se encontraron mantenimientos
        </div>
      )}

      <div style={paginationStyle}>
        <span>
          {sorted.length > 0
            ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} de ${sorted.length}`
            : '0 resultados'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={pageBtnStyle} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</button>
          <button style={pageBtnStyle} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Siguiente</button>
        </div>
      </div>

      {confirmItem && (
        <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setConfirmItem(null)}>
          <div style={confirmCardStyle}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
              Confirmar eliminación
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
              ¿Eliminar el mantenimiento <strong style={{ color: '#0f172a' }}>{confirmItem.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'Outfit', cursor: 'pointer', backgroundColor: 'rgba(15, 23, 42, 0.04)', color: '#64748b', border: '1px solid rgba(15, 23, 42, 0.08)' }}
                onClick={() => setConfirmItem(null)}
              >
                Cancelar
              </button>
              <button
                style={{ padding: '0.625rem 1.25rem', borderRadius: '0.875rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'Outfit', cursor: 'pointer', backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                onClick={() => { onDelete(confirmItem); setConfirmItem(null); }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .maintenance-row:hover {
          background-color: rgba(99, 102, 241, 0.06) !important;
          transform: scale(1.005) translateX(4px);
          box-shadow: 0 4px 20px -5px rgba(15, 23, 42, 0.1);
        }
      `}</style>
    </div>
  );
}
