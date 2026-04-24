import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useSummaryReport } from '../hooks/useSummaryReport';
import { LoadingState, ErrorState } from '@shared/ui';
import * as XLSX from 'xlsx';
import { 
  IconClose, 
  IconSpeed, 
  IconMap, 
  IconFileText,
  IconDownload,
  IconChevronDown 
} from '@shared/ui/icons';

const overlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.3)',
  backdropFilter: 'blur(16px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
};

const modalStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1100px',
  maxHeight: '85vh',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(20px)',
  borderRadius: '1.5rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  color: '#0f172a',
};

const headerStyle: CSSProperties = {
  padding: '1.5rem 2rem',
  background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.04), transparent)',
  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const contentStyle: CSSProperties = {
  padding: '1.5rem 2rem',
  overflowY: 'auto',
  flex: 1,
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
  color: color,
  fontSize: '0.7rem',
  fontWeight: 700,
  border: `1px solid ${color}30`,
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
});

const selectContainerStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
};

const selectStyle: CSSProperties = {
  appearance: 'none',
  padding: '0.625rem 2.5rem 0.625rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 600,
  outline: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

interface MileageReportProps {
  onClose: () => void;
}

export function MileageReport({ onClose }: MileageReportProps) {
  const { data: devices = [] } = useDevices();
  const [range, setRange] = useState<'today' | 'yesterday' | 'week'>('today');

  const reportParams = useMemo(() => {
    if (devices.length === 0) return null;
    const from = new Date();
    const to = new Date();

    switch (range) {
      case 'today': from.setHours(0, 0, 0, 0); break;
      case 'yesterday':
        from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1); to.setHours(23, 59, 59, 999);
        break;
      case 'week':
        from.setDate(from.getDate() - 7); from.setHours(0, 0, 0, 0);
        break;
    }
    return { deviceId: devices.map((d) => d.id!), from: from.toISOString(), to: to.toISOString() };
  }, [devices, range]);

  const { data: reportData = [], isLoading, isError, refetch } = useSummaryReport(reportParams);
  const deviceMap = useMemo(() => new Map(devices.map(d => [d.id, d])), [devices]);

  const handleExportXLSX = useCallback(() => {
    const rows = reportData.map((row) => {
      const device = deviceMap.get(row.deviceId);
      const attrs = device?.attributes as Record<string, string> | undefined;
      return {
        'Vehículo': device?.name ?? '',
        'Placa': attrs?.plate ?? '',
        'TID': device?.uniqueId ?? '',
        'Distancia (km)': +((row.distance ?? 0) / 1000).toFixed(2),
        'Velocidad Máx (km/h)': +((row.maxSpeed ?? 0) * 1.852).toFixed(1),
        'Velocidad Prom (km/h)': +((row.averageSpeed ?? 0) * 1.852).toFixed(1),
        'Estado': device?.status === 'online' ? 'Conectado' : 'Fuera de Línea',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 22 }, { wch: 12 }, { wch: 16 },
      { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kilometraje');
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `reporte_kilometraje_${date}.xlsx`);
  }, [reportData, deviceMap]);

  return (
    <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.625rem', borderRadius: '0.875rem', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
                <IconFileText size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 800, color: '#f8fafc' }}>
                Resumen de Actividad
              </h2>
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                Control de Kilometraje Consolidado • {range === 'today' ? 'Hoy' : range === 'yesterday' ? 'Ayer' : 'Últimos 7 días'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(15, 23, 42, 0.04)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.625rem', borderRadius: '0.75rem', display: 'flex' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <div style={contentStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Periodo:</span>
              <div style={selectContainerStyle}>
                  <select 
                      style={selectStyle} 
                      value={range} 
                      onChange={(e) => setRange(e.target.value as any)}
                      onMouseEnter={(e) => (e.target as any).style.borderColor = 'var(--accent)'}
                      onMouseLeave={(e) => (e.target as any).style.borderColor = 'rgba(15, 23, 42, 0.1)'}
                  >
                      <option value="today">Reporte de Hoy</option>
                      <option value="yesterday">Actividad de Ayer</option>
                      <option value="week">Última Semana</option>
                  </select>
                  <IconChevronDown size={14} style={{ position: 'absolute', right: '1rem', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
            </div>
            <button
              onClick={handleExportXLSX}
              disabled={reportData.length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.125rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backgroundColor: reportData.length === 0 ? 'rgba(15, 23, 42, 0.03)' : 'rgba(99, 102, 241, 0.08)',
                color: reportData.length === 0 ? '#94a3b8' : '#6366f1',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: reportData.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Outfit, system-ui, sans-serif',
              }}
            >
              <IconDownload size={16} />
              Exportar Excel
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: '4rem 0' }}><LoadingState message="Sincronizando flota..." /></div>
          ) : isError ? (
            <ErrorState message="Error al recuperar datos de telemetría" onRetry={() => refetch()} />
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Vehículo de Flota</th>
                  <th style={thStyle}>Recorrido Total</th>
                  <th style={thStyle}>Rendimiento Máx/Prom</th>
                  <th style={thStyle}>Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => {
                  const device = deviceMap.get(row.deviceId);
                  return (
                    <tr key={row.deviceId} style={rowStyle} className="report-row">
                      <td style={{ ...tdStyle, borderTopLeftRadius: '1.125rem', borderBottomLeftRadius: '1.125rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                            <IconMap size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>{device?.name || 'Unidad Desconocida'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                              <span>TID: {device?.uniqueId}</span>
                              {(device?.attributes as Record<string, string>)?.plate && (
                                <span style={{ padding: '0.1rem 0.4rem', borderRadius: '0.25rem', backgroundColor: 'rgba(15, 23, 42, 0.06)', fontWeight: 700, letterSpacing: '0.02em' }}>
                                  {(device!.attributes as Record<string, string>).plate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-hover)', letterSpacing: '-0.025em' }}>
                            {((row.distance ?? 0) / 1000).toFixed(2)}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800 }}>KM</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#f1f5f9' }}>
                            <IconSpeed size={14} style={{ color: '#fbbf24' }} />
                            <span style={{ fontWeight: 700 }}>{((row.maxSpeed ?? 0) * 1.852).toFixed(1)} <span style={{ fontSize: '0.65rem', color: '#64748b' }}>km/h</span></span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, marginLeft: '1.25rem' }}>
                            Promedio: {((row.averageSpeed ?? 0) * 1.852).toFixed(1)} km/h
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, borderTopRightRadius: '1.125rem', borderBottomRightRadius: '1.125rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                        <div style={pillStyle(device?.status === 'online' ? '#10b981' : '#64748b')}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                          {device?.status === 'online' ? 'Conectado' : 'Fuera de Línea'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`
        .report-row:hover {
          background-color: rgba(99, 102, 241, 0.06) !important;
          transform: scale(1.005) translateX(4px);
          box-shadow: 0 4px 20px -5px rgba(15, 23, 42, 0.1);
        }
        .report-row {
          border: 1px solid transparent;
        }
      `}</style>
    </div>
  );
}
