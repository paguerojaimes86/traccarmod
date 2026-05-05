import { useState, useMemo, type CSSProperties } from 'react';
import { Pencil } from 'lucide-react';
import { IconSearch, IconTrash2, IconLink } from '@shared/ui/icons';
import { LoadingState, ErrorState } from '@shared/ui';
import { useEscapeKey } from '@shared/hooks';
import type { Device, Group } from '@shared/api/types.models';

interface DeviceTableProps {
  devices: Device[];
  groups: Group[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  canManage: boolean;
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  onLink?: (device: Device) => void;
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
  transition: 'background-color 0.25s var(--ease-default), transform 0.25s var(--ease-default)',
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
  color: color,
  fontSize: '0.7rem',
  fontWeight: 700,
  border: `1px solid ${color}30`,
  textTransform: 'uppercase',
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

function getSortValue(device: Device, key: string, groupMap: Map<number, string>): string {
  if (key === 'group') return groupMap.get(device.groupId ?? -1) ?? '';
  const val = device[key as keyof Device];
  return String(val ?? '').toLowerCase();
}

export function DeviceTable({
  devices,
  groups,
  isLoading,
  isError,
  onRetry,
  canManage,
  onEdit,
  onDelete,
  onLink,
}: DeviceTableProps) {
  const [keyword, setKeyword] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [confirmDevice, setConfirmDevice] = useState<Device | null>(null);

  const closeConfirmModal = () => setConfirmDevice(null);
  useEscapeKey(Boolean(confirmDevice), closeConfirmModal);

  const groupMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const g of groups) {
      if (g.id != null) map.set(g.id, g.name ?? '');
    }
    return map;
  }, [groups]);

  const filtered = useMemo(() => {
    if (!keyword.trim()) return devices;
    const k = keyword.toLowerCase();
    return devices.filter((d) =>
      [d.name, d.uniqueId, d.phone, d.model, d.contact, d.category]
        .some((v) => v?.toLowerCase().includes(k))
    );
  }, [devices, keyword]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const av = getSortValue(a, sortKey, groupMap);
      const bv = getSortValue(b, sortKey, groupMap);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir, groupMap]);

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

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'uniqueId', label: 'Unique ID' },
    { key: 'status', label: 'Estado' },
    { key: 'group', label: 'Grupo' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'model', label: 'Modelo' },
    { key: 'category', label: 'Categoría' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <LoadingState message="Cargando dispositivos..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '4rem 0' }}>
        <ErrorState message="Error al cargar dispositivos" onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div>
      <div style={searchContainerStyle}>
        <IconSearch size={18} style={{ color: '#94a3b8' }} aria-hidden="true" />
        <label htmlFor="device-search" className="sr-only">Buscar dispositivos</label>
        <input
          id="device-search"
          type="text"
          placeholder="Buscar por nombre, ID, teléfono, modelo..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={searchInputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.04)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)';
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)';
          }}
        />
      </div>

      <table style={tableStyle}>
        <caption className="sr-only">Lista de dispositivos GPS</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={thStyle} scope="col" onClick={() => handleSort(col.key)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </span>
              </th>
            ))}
            {canManage && <th style={{ ...thStyle, width: '80px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {pageItems.map((device) => (
            <tr key={device.id} style={rowStyle} className="device-row">
              <td style={{ ...tdStyle, borderTopLeftRadius: '1.125rem', borderBottomLeftRadius: '1.125rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{device.name}</div>
              </td>
              <td style={tdStyle}>{device.uniqueId}</td>
              <td style={tdStyle}>
                <div style={pillStyle(device.status === 'online' ? '#10b981' : '#64748b')}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  {device.status === 'online' ? 'Conectado' : 'Fuera de Línea'}
                </div>
              </td>
              <td style={tdStyle}>{groupMap.get(device.groupId ?? -1) ?? '—'}</td>
              <td style={tdStyle}>{device.phone ?? '—'}</td>
              <td style={tdStyle}>{device.model ?? '—'}</td>
              <td style={tdStyle}>{device.category ?? '—'}</td>
              {canManage && (
                <td style={{ ...tdStyle, borderTopRightRadius: '1.125rem', borderBottomRightRadius: '1.125rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      style={{ ...actionBtnStyle, color: '#6366f1' }}
                      onClick={() => onEdit(device)}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      title="Editar"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    {onLink && (
                      <button
                        style={{ ...actionBtnStyle, color: '#10b981' }}
                        onClick={() => onLink(device)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        title="Vincular atributos"
                        aria-label="Vincular atributos"
                      >
                        <IconLink size={16} />
                      </button>
                    )}
                    <button
                      style={{ ...actionBtnStyle, color: '#ef4444' }}
                      onClick={() => setConfirmDevice(device)}
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
          ))}
        </tbody>
      </table>

      {pageItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b', fontSize: '0.875rem' }}>
          No se encontraron dispositivos
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

      {confirmDevice && (
        <div
          style={overlayStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          onClick={(e) => e.target === e.currentTarget && setConfirmDevice(null)}
        >
          <div style={confirmCardStyle}>
            <h3 id="confirm-delete-title" style={{ margin: '0 0 0.75rem', fontSize: '1.125rem', fontWeight: 700, fontFamily: 'Outfit', color: '#0f172a' }}>
              Confirmar eliminación
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
              ¿Eliminar el dispositivo <strong style={{ color: '#0f172a' }}>{confirmDevice.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                style={cancelBtnStyle}
                onClick={() => setConfirmDevice(null)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
              >
                Cancelar
              </button>
              <button
                style={deleteBtnStyle}
                onClick={() => {
                  onDelete(confirmDevice);
                  setConfirmDevice(null);
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
        .device-row:hover {
          background-color: rgba(99, 102, 241, 0.06) !important;
          transform: scale(1.005) translateX(4px);
          box-shadow: 0 4px 20px -5px rgba(15, 23, 42, 0.1);
        }
        .device-row {
          border: 1px solid transparent;
        }
      `}</style>
    </div>
  );
}
