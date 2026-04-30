import { useState, type CSSProperties } from 'react';
import type { Device } from '@shared/api/types.models';
import type { Position } from '@shared/api/types.models';
import { StatusBadge, type DeviceStatus } from '@shared/ui/StatusBadge';
import { useUnitConversion } from '@shared/hooks/useUnitConversion';
import { timeAgo } from '@shared/lib/units';
import { useMapStore } from '@features/map/store';
import { useAlertStore } from '@features/alerts/store';
import { IconMap } from '@shared/ui/icons';

interface DeviceListItemProps {
  device: Device;
  position?: Position;
  isSelected: boolean;
}

const itemStyle = (isSelected: boolean, isHovered: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.5625rem 0.6875rem',
  margin: '0.0625rem 0',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : isHovered ? 'rgba(15, 23, 42, 0.03)' : 'transparent',
  border: '1px solid',
  borderColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: isSelected ? '0 0 14px -5px rgba(99, 102, 241, 0.25)' : 'none',
});

const nameStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '0',
  letterSpacing: '-0.01em',
};

const detailStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#64748b',
  fontWeight: 500,
};

export function DeviceListItem({ device, position, isSelected }: DeviceListItemProps) {
  const setSelectedDevice = useMapStore((s) => s.setSelectedDevice);
  const { formatSpeed } = useUnitConversion();
  const recentEvents = useAlertStore((s) => s.recentEvents);
  const [isHovered, setIsHovered] = useState(false);
  const hasAlert = recentEvents.some((e) => e.deviceId === (device.id ?? 0));

  const handleClick = () => {
    setSelectedDevice(device.id ?? null);
  };

  const speed = position?.speed ?? 0;
  const isOnline = device.status === 'online';
  const isMoving = speed > 0.5;
  const ignition = (position?.attributes as any)?.ignition ?? (position?.attributes as any)?.acc;

  let smartStatus: DeviceStatus = device.status as DeviceStatus;
  if (isOnline) {
    if (speed > 80) smartStatus = 'speeding' as any;
    else if (isMoving) smartStatus = 'moving' as any;
    else if (ignition === true) smartStatus = 'online_acc' as any;
    else smartStatus = 'online_idle' as any;
  }

  return (
    <li
      style={itemStyle(isSelected, isHovered)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
        <div style={{
          width: 34,
          height: 34,
          padding: '0.4375rem',
          borderRadius: '0.625rem',
          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.04)',
          color: isSelected ? '#6366f1' : '#94a3b8',
          border: '1px solid',
          borderColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.18s ease',
        }}>
          <IconMap size={15} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              ...nameStyle,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '140px',
            }}>
              {device.name || device.uniqueId}
            </span>
            {isMoving && (
              <span style={{ fontSize: '0.625rem', color: '#10b981', fontWeight: 800, letterSpacing: '0.02em', flexShrink: 0 }}>
                {formatSpeed(speed, 0)}
              </span>
            )}
          </div>
          <div style={{ ...detailStyle, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ opacity: 0.7 }}>
              {device.lastUpdate ? timeAgo(device.lastUpdate) : 'Sin datos'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {hasAlert && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
            animation: 'pulse-alert 2s ease-in-out infinite',
          }} />
        )}
        <StatusBadge status={smartStatus} />
      </div>

      <style>{`
        @keyframes pulse-alert {
          0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 14px rgba(239, 68, 68, 0.7); }
        }
      `}</style>
    </li>
  );
}