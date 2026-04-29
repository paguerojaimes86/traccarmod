import { useEffect, type CSSProperties, useMemo } from 'react';
import type { EventMessage, PositionMessage } from '@features/positions/services/websocket';
import { getAlertConfig } from '@shared/lib/alert-types';
import { useMapStore } from '@features/map/store';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/lib/constants';

interface AlertToastProps {
  event: EventMessage;
  onDismiss: () => void;
}

const toastStyle = (color: string): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  padding: '0.875rem 1rem',
  borderRadius: '0.875rem',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid var(--border-default)',
  borderLeft: `3px solid ${color}`,
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.12)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
  maxWidth: '360px',
  width: '100%',
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

const dismissButtonStyle: CSSProperties = {
  padding: '0.25rem',
  border: 'none',
  background: 'transparent',
  borderRadius: '0.375rem',
  cursor: 'pointer',
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'color 0.2s',
};

export function AlertToast({ event, onDismiss }: AlertToastProps) {
  const config = getAlertConfig(event.type);
  const flyToDevice = useMapStore((s) => s.flyToDevice);
  const { data: devices = [] } = useDevices();
  const queryClient = useQueryClient();

  const deviceMap = useMemo(() => new Map(devices.map((d) => [d.id ?? 0, d])), [devices]);
  const deviceName = deviceMap.get(event.deviceId)?.name ?? `Dispositivo #${event.deviceId}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    // Look up the device's current position from React Query cache (updated via WebSocket)
    const cached = queryClient.getQueryData<PositionMessage[]>(QUERY_KEYS.allPositions);
    const devicePos = cached?.find((p) => p.deviceId === event.deviceId);
    if (devicePos?.latitude != null && devicePos?.longitude != null) {
      flyToDevice(event.deviceId, [devicePos.latitude, devicePos.longitude], 15);
    }
    onDismiss();
  };

  return (
    <div style={toastStyle(config.color)} onClick={handleClick}>
      <div style={iconContainerStyle(config.color)}>
        {config.icon}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: 'Outfit', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
          {deviceName}
        </div>
        <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.125rem' }}>
          {config.label}
        </div>
      </div>

      <button
        style={dismissButtonStyle}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        title="Descartar"
      >
        ×
      </button>
    </div>
  );
}