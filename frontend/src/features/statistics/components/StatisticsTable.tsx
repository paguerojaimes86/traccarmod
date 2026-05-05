import { useState, useMemo, type CSSProperties } from 'react';
import { IconSearch } from '@shared/ui/icons';
import { LoadingState, ErrorState } from '@shared/ui';
import type { Statistics } from '@shared/api/types.models';

interface StatisticsTableProps {
  items: Statistics[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
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

function formatDateTime(raw: string | undefined): string {
  if (!raw) return '-';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatNumber(n: number | undefined): string {
  if (n == null) return '-';
  return n.toLocaleString('es-AR');
}

const columns = [
  { key: 'captureTime', label: 'Fecha/Hora' },
  { key: 'activeUsers', label: 'Usuarios activos' },
  { key: 'activeDevices', label: 'Dispositivos activos' },
  { key: 'messagesReceived', label: 'Mensajes recibidos' },
  { key: 'messagesStored', label: 'Mensajes almacenados' },
  { key: 'requests', label: 'Solicitudes' },
] as const;

export function StatisticsTable({ items, isLoading, isError, onRetry }: StatisticsTableProps) {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items;
    const k = keyword.toLowerCase();
    return items.filter((s) => {
      const ct = s.captureTime ?? '';
      return ct.toLowerCase().includes(k);
    });
  }, [items, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  if (isLoading) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <LoadingState message="Cargando estadísticas..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <ErrorState message="Error al cargar estadísticas" onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div>
      <div style={searchContainerStyle}>
        <IconSearch size={18} style={{ color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Buscar por fecha..."
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
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
              <th key={col.key} style={thStyle}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((s, idx) => (
            <tr key={s.captureTime ?? idx} style={rowStyle} className="statistics-row">
              <td style={{ ...tdStyle, borderTopLeftRadius: '1.125rem', borderBottomLeftRadius: '1.125rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8125rem' }}>
                  {formatDateTime(s.captureTime)}
                </div>
              </td>
              <td style={tdStyle}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.activeUsers)}</span>
              </td>
              <td style={tdStyle}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.activeDevices)}</span>
              </td>
              <td style={tdStyle}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.messagesReceived)}</span>
              </td>
              <td style={tdStyle}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.messagesStored)}</span>
              </td>
              <td style={{ ...tdStyle, borderTopRightRadius: '1.125rem', borderBottomRightRadius: '1.125rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatNumber(s.requests)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pageItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.875rem' }}>
          No se encontraron estadísticas
        </div>
      )}

      <div style={paginationStyle}>
        <span>
          {filtered.length > 0
            ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} de ${filtered.length}`
            : '0 resultados'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={pageBtnStyle} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Anterior
          </button>
          <button style={pageBtnStyle} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Siguiente
          </button>
        </div>
      </div>

      <style>{`
        .statistics-row:hover {
          background-color: rgba(99, 102, 241, 0.06) !important;
          transform: scale(1.005) translateX(4px);
          box-shadow: 0 4px 20px -5px rgba(15, 23, 42, 0.1);
        }
      `}</style>
    </div>
  );
}
