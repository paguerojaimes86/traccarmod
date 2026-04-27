import { useMemo, type CSSProperties } from 'react';
import { useDevices } from '@features/devices/hooks/useDevices';
import { IconMap } from '@shared/ui/icons';

interface AlertDeviceSelectProps {
  selectedDeviceIds: number[];
  onChange: (ids: number[]) => void;
}

const listItemStyle = (isSelected: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 0.75rem',
  margin: '0.125rem 0',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
  border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

const checkboxStyle = (isChecked: boolean): CSSProperties => ({
  width: '1.125rem',
  height: '1.125rem',
  borderRadius: '0.375rem',
  border: isChecked ? 'none' : '1.5px solid rgba(15, 23, 42, 0.2)',
  backgroundColor: isChecked ? '#6366f1' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.2s',
});

const deviceNameStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const deviceDetailStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: '#64748b',
};

const selectAllButton: CSSProperties = {
  padding: '0.5rem 0.875rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(99, 102, 241, 0.2)',
  backgroundColor: 'rgba(99, 102, 241, 0.06)',
  color: '#6366f1',
  fontSize: '0.75rem',
  fontWeight: 600,
  fontFamily: 'Outfit',
  cursor: 'pointer',
  transition: 'all 0.2s',
  marginBottom: '0.75rem',
};

const listContainerStyle: CSSProperties = {
  maxHeight: '16rem',
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: '0.25rem',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(15, 23, 42, 0.1) transparent',
};

const countBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.25rem',
  height: '1.25rem',
  padding: '0 0.375rem',
  borderRadius: '9999px',
  backgroundColor: 'rgba(99, 102, 241, 0.1)',
  color: '#6366f1',
  fontSize: '0.625rem',
  fontWeight: 700,
  fontFamily: 'Outfit',
};

export function AlertDeviceSelect({ selectedDeviceIds, onChange }: AlertDeviceSelectProps) {
  const { data: devices = [] } = useDevices();

  const activeDevices = useMemo(() => devices.filter((d) => !d.disabled), [devices]);

  const allSelected = activeDevices.length > 0 && selectedDeviceIds.length === activeDevices.length;

  const toggleDevice = (deviceId: number) => {
    if (selectedDeviceIds.includes(deviceId)) {
      onChange(selectedDeviceIds.filter((id) => id !== deviceId));
    } else {
      onChange([...selectedDeviceIds, deviceId]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(activeDevices.map((d) => d.id ?? 0).filter(Boolean));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontFamily: 'Outfit', fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
            Dispositivos
          </span>
          {selectedDeviceIds.length > 0 && <span style={countBadgeStyle}>{selectedDeviceIds.length}</span>}
        </div>
        <button style={selectAllButton} onClick={toggleAll}>
          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      <ul style={listContainerStyle}>
        {activeDevices.map((device) => {
          const isChecked = selectedDeviceIds.includes(device.id ?? 0);
          return (
            <li
              key={device.id}
              style={listItemStyle(isChecked)}
              onClick={() => toggleDevice(device.id ?? 0)}
            >
              <div style={checkboxStyle(isChecked)}>
                {isChecked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div style={{
                padding: '0.375rem',
                borderRadius: '0.5rem',
                backgroundColor: isChecked ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.04)',
                color: isChecked ? '#6366f1' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconMap size={14} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={deviceNameStyle}>{device.name || device.uniqueId}</div>
                <div style={deviceDetailStyle}>
                  {device.status === 'online' ? '🟢 En línea' : '⚫ Sin conexión'}
                </div>
              </div>
            </li>
          );
        })}
        {activeDevices.length === 0 && (
          <li style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
            No hay dispositivos disponibles
          </li>
        )}
      </ul>
    </div>
  );
}