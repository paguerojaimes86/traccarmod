import { useState, useMemo, type CSSProperties } from 'react';
import { useStatisticsList } from '../hooks/useStatisticsList';
import { StatisticsTable } from '../components/StatisticsTable';

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

const filterRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '1rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
};

const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#64748b',
};

const inputStyle: CSSProperties = {
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

const warningStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.625rem',
  backgroundColor: 'rgba(245, 158, 11, 0.08)',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  color: '#d97706',
  fontSize: '0.8125rem',
  fontWeight: 600,
  marginBottom: '1rem',
};

function toLocalDateTimeString(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StatisticsPage() {

  const now = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return toLocalDateTimeString(d);
  }, [now]);
  const defaultTo = useMemo(() => toLocalDateTimeString(now), [now]);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const fromISO = useMemo(() => (from ? new Date(from).toISOString() : ''), [from]);
  const toISO = useMemo(() => (to ? new Date(to).toISOString() : ''), [to]);

  const { data: items = [], isLoading, isError, refetch } = useStatisticsList({
    from: fromISO,
    to: toISO,
  });

  const noRange = !from || !to;

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={headerStyle}>Estadísticas</h1>
          <p style={subStyle}>Estadísticas del servidor.</p>
        </div>
      </div>

      <div style={filterRowStyle}>
        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="stats-from">Desde</label>
          <input
            id="stats-from"
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldGroupStyle}>
          <label style={labelStyle} htmlFor="stats-to">Hasta</label>
          <input
            id="stats-to"
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {noRange && (
        <div style={warningStyle}>
          Seleccioná un rango de fechas para ver las estadísticas.
        </div>
      )}

      <StatisticsTable
        items={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
      />
    </div>
  );
}

export default StatisticsPage;
