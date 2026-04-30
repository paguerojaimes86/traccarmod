import { useState, type CSSProperties } from 'react';
import type { EventMessage } from '@features/positions/services/websocket';
import { getAlertConfig } from '@shared/lib/alert-types';
import { timeAgo } from '@shared/lib/units';
import { IconTrash2 } from '@shared/ui/icons';

interface AlertItemProps {
  event: EventMessage;
  onDelete?: (id: number) => void;
  canDelete: boolean;
  onClick?: () => void;
  deviceName?: string;
}

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  low: '#10b981',
  info: '#3b82f6',
};

const itemStyle = (isHovered: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5625rem 0.6875rem',
  margin: '0.0625rem 0',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  backgroundColor: isHovered ? 'rgba(15, 23, 42, 0.04)' : 'transparent',
  border: '1px solid transparent',
  transition: 'all 0.18s ease',
});

const iconContainerStyle = (color: string): CSSProperties => ({
  padding: '0.375rem',
  borderRadius: '0.625rem',
  backgroundColor: `${color}18`,
  color: color,
  border: `1px solid ${color}30`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  flexShrink: 0,
  minWidth: 32,
});

const nameStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.01em',
};

const detailStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  fontWeight: 500,
};

const deleteButtonStyle: CSSProperties = {
  padding: '0.25rem',
  border: 'none',
  background: 'transparent',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  color: '#cbd5e1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.18s ease',
  flexShrink: 0,
};

export function AlertItem({ event, onDelete, canDelete, onClick, deviceName }: AlertItemProps) {
  const config = getAlertConfig(event.type);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event.id);
  };

  const categoryLabel = config.category === 'status' ? 'Estado'
    : config.category === 'movement' ? 'Movimiento'
    : config.category === 'geofence' ? 'Geozona'
    : config.category === 'speed' ? 'Velocidad'
    : config.category === 'alarm' ? 'Alarma'
    : config.category === 'maintenance' ? 'Mant.'
    : config.category;

  return (
    <li
      style={itemStyle(isHovered)}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
        <div style={iconContainerStyle(config.color)}>
          {config.icon}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={nameStyle} title={deviceName ?? `Dispositivo #${event.deviceId}`}>
              {deviceName ?? `#${event.deviceId}`}
            </span>
            <span style={{
              fontSize: '0.5625rem',
              color: config.color,
              fontWeight: 800,
              fontFamily: 'Outfit',
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}>
              {categoryLabel.toUpperCase()}
            </span>
          </div>
          <div style={detailStyle}>
            <span style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: severityColors[config.severity] ?? '#6b7280',
              flexShrink: 0,
            }} />
            <span>{timeAgo(event.eventTime)}</span>
          </div>
        </div>
      </div>

      {canDelete && onDelete && (
        <button
          style={deleteButtonStyle}
          onClick={handleDelete}
          title="Eliminar alerta"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#cbd5e1';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <IconTrash2 size={13} />
        </button>
      )}
    </li>
  );
}