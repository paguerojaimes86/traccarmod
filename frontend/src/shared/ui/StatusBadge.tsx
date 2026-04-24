import type { CSSProperties } from 'react';

export type DeviceStatus = 'online' | 'offline' | 'unknown';

interface StatusBadgeProps {
  status: DeviceStatus;
  label?: string;
}

const statusColors: Record<DeviceStatus, string> = {
  online: '#22c55e',
  offline: '#94a3b8',
  unknown: '#f59e0b',
};

const statusLabels: Record<DeviceStatus, string> = {
  online: 'En línea',
  offline: 'Sin conexión',
  unknown: 'Desconocido',
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const color = statusColors[status];
  const displayLabel = label ?? statusLabels[status];

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.625rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1,
    backgroundColor: `${color}30`,
    color,
  };

  return (
    <span style={style}>
      <span
        className={status === 'online' ? 'animate-pulse-online' : ''}
        style={{
          width: '0.625rem',
          height: '0.625rem',
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: status === 'online' ? `0 0 10px ${color}` : 'none',
        }}
      />
      {displayLabel}
    </span>
  );
}