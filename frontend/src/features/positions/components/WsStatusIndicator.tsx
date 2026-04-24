import type { CSSProperties } from 'react';
import { useUiStore } from '@shared/lib/ui-store';

const dotColors: Record<string, string> = {
  connected: '#22c55e',
  reconnecting: '#f59e0b',
  disconnected: '#6b7280',
};

const labels: Record<string, string> = {
  connected: 'En vivo',
  reconnecting: 'Reconectando',
  disconnected: 'Sin conexión',
};

const containerStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#475569',
};

export function WsStatusIndicator() {
  const wsStatus = useUiStore((s) => s.wsStatus);
  const color = dotColors[wsStatus] ?? '#6b7280';

  return (
    <span style={containerStyle}>
      <span
        style={{
          width: '0.375rem',
          height: '0.375rem',
          borderRadius: '50%',
          backgroundColor: color,
          animation: wsStatus === 'reconnecting' ? 'pulse 1.5s infinite' : undefined,
        }}
      />
      {labels[wsStatus] ?? 'Desconocido'}
      {wsStatus === 'reconnecting' && (
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      )}
    </span>
  );
}
