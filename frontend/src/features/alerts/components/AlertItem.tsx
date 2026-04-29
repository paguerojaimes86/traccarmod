import type { CSSProperties } from 'react';
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

const severityDotStyle = (severity: string): CSSProperties => ({
  width: '0.5rem',
  height: '0.5rem',
  borderRadius: '9999px',
  backgroundColor: severityColors[severity] ?? '#6b7280',
  flexShrink: 0,
});

const itemStyle = (isHovered: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.625rem 0.75rem',
  margin: '0.125rem 0',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  backgroundColor: isHovered ? 'rgba(15, 23, 42, 0.04)' : 'transparent',
  border: '1px solid transparent',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
});

const iconContainerStyle = (color: string): CSSProperties => ({
  padding: '0.375rem',
  borderRadius: '0.625rem',
  backgroundColor: `${color}18`,
  color,
  border: `1px solid ${color}30`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  flexShrink: 0,
});

const nameStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const detailStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
};

const deleteButtonStyle: CSSProperties = {
  padding: '0.25rem',
  border: 'none',
  background: 'transparent',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s ease, background-color 0.2s ease',
  flexShrink: 0,
};

export function AlertItem({ event, onDelete, canDelete, onClick, deviceName }: AlertItemProps) {
  const config = getAlertConfig(event.type);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event.id);
  };

  return (
    <li
      style={itemStyle(false)}
      onClick={onClick}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'rgba(15, 23, 42, 0.04)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
        <div style={iconContainerStyle(config.color)}>
          {config.icon}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={nameStyle}>{deviceName ?? `Dispositivo #${event.deviceId}`}</span>
            <span style={{ fontSize: '0.65rem', color: config.color, fontWeight: 700, fontFamily: 'Outfit' }}>
              {config.label}
            </span>
          </div>
          <div style={detailStyle}>
            <span style={severityDotStyle(config.severity)} />
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
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <IconTrash2 size={14} />
        </button>
      )}
    </li>
  );
}