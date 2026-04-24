import type { CSSProperties } from 'react';
import { useSummaryReport } from '../hooks/useSummaryReport';
import { LoadingState, ErrorState } from '@shared/ui';

interface MileageSummaryProps {
  deviceId: number;
}

const cardStyle: CSSProperties = {
  padding: '1rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginTop: '0.5rem',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
  width: '100%',
};

const labelStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
};

const valueStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontFamily: 'Outfit',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const subValueStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
};

export function MileageSummary({ deviceId }: MileageSummaryProps) {
  // Por defecto hoy (desde medianoche hasta ahora)
  const params = {
    deviceId: [deviceId],
    from: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    to: new Date().toISOString(),
  };

  const { data, isLoading, isError, refetch } = useSummaryReport(params);

  if (isLoading) return <LoadingState message="Calculando..." />;
  if (isError) return <ErrorState message="Error" onRetry={() => refetch()} />;

  const summary = data?.[0];
  
  // Traccar devuelve la distancia en metros. Convertimos a km.
  const distanceInKm = summary?.distance ? (summary.distance / 1000).toFixed(2) : '0.00';

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>Kilometraje Hoy</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
        <div style={valueStyle}>{distanceInKm}</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>km</div>
      </div>
      {summary && summary.maxSpeed != null && summary.maxSpeed > 0 && (
          <div style={subValueStyle}>
              Vel. Máx: {(summary.maxSpeed * 1.852).toFixed(1)} km/h
          </div>
      )}
    </div>
  );
}
