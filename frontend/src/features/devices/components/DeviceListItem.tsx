import type { CSSProperties } from 'react';
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

const itemStyle = (isSelected: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.625rem 0.75rem',
  margin: '0.125rem 0',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
  border: '1px solid',
  borderColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: isSelected ? '0 0 12px -4px rgba(99, 102, 241, 0.2)' : 'none',
});

const nameStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  marginBottom: '0',
};

const detailStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#64748b',
};

export function DeviceListItem({ device, position, isSelected }: DeviceListItemProps) {
  const setSelectedDevice = useMapStore((s) => s.setSelectedDevice);
  const { formatSpeed } = useUnitConversion();
  const recentEvents = useAlertStore((s) => s.recentEvents);
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
    <li style={itemStyle(isSelected)} onClick={handleClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1 }}>
        <div style={{
          padding: '0.5rem',
          borderRadius: '0.625rem',
          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.04)',
          color: isSelected ? '#6366f1' : '#94a3b8',
          border: '1px solid',
          borderColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.04)',
        }}>
          <IconMap size={16} />
        </div>
        
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...nameStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
               {device.name || device.uniqueId}
            </span>
            {isMoving && (
               <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800, letterSpacing: '0.025em' }}>
                 &bull; {formatSpeed(speed, 0)}
               </span>
            )}
          </div>
          <div style={{ ...detailStyle, opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {device.lastUpdate ? timeAgo(device.lastUpdate) : 'Sin datos'}
          </div>
        </div>
      </div>
      {hasAlert && (
        <span style={{
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '9999px',
          backgroundColor: '#ef4444',
          boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)',
        }} />
      )}
      <StatusBadge status={smartStatus} />
    </li>
  );
}