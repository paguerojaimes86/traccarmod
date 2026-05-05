import { useMemo, type CSSProperties } from 'react';
import { useDevices } from '@features/devices/hooks/useDevices';
import { IconMap } from '@shared/ui/icons';

interface AlertDeviceSelectProps {
  selectedDeviceIds: number[];
  onChange: (ids: number[]) => void;
}

// ─── Header Bar ───────────────────────────────────────────────────
const headerBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '0.75rem',
};

const headerLabelStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  letterSpacing: '-0.01em',
};

const countBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '1.375rem',
  height: '1.375rem',
  padding: '0 0.4rem',
  borderRadius: '9999px',
  backgroundColor: 'rgba(99, 102, 241, 0.1)',
  color: '#6366f1',
  fontSize: '0.625rem',
  fontWeight: 700,
  fontFamily: "'Inter', system-ui, sans-serif",
};

const selectAllButton: CSSProperties = {
  padding: '0.4rem 0.75rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(99, 102, 241, 0.15)',
  backgroundColor: 'rgba(99, 102, 241, 0.04)',
  color: '#6366f1',
  fontSize: '0.6875rem',
  fontWeight: 600,
  fontFamily: "'Inter', system-ui, sans-serif",
  cursor: 'pointer',
  transition: 'all 0.2s',
};

// ─── List ─────────────────────────────────────────────────────────
const listContainerStyle: CSSProperties = {
  maxHeight: '18rem',
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: '0.25rem',
  borderRadius: '0.875rem',
  border: '1px solid rgba(15, 23, 42, 0.05)',
  backgroundColor: 'rgba(15, 23, 42, 0.01)',
};

const listItemStyle = (isSelected: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 0.75rem',
  margin: '0.125rem 0',
  borderRadius: '0.625rem',
  cursor: 'pointer',
  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
  transition: 'all 0.15s',
});

// ─── Checkbox ─────────────────────────────────────────────────────
const checkboxOuterStyle = (isChecked: boolean): CSSProperties => ({
  width: '1.25rem',
  height: '1.25rem',
  borderRadius: '0.375rem',
  border: isChecked ? 'none' : '1.5px solid rgba(15, 23, 42, 0.15)',
  backgroundColor: isChecked ? '#6366f1' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: isChecked ? '0 1px 4px rgba(99, 102, 241, 0.25)' : 'none',
});

// ─── Device Info ──────────────────────────────────────────────────
const deviceIconStyle = (isSelected: boolean): CSSProperties => ({
  padding: '0.375rem',
  borderRadius: '0.5rem',
  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.03)',
  color: isSelected ? '#6366f1' : '#94a3b8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.2s',
});

const deviceNameStyle: CSSProperties = {
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: '#0f172a',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const statusDotStyle = (status: string | undefined): CSSProperties => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: status === 'online' ? '#10b981' : '#94a3b8',
  flexShrink: 0,
});

const statusLabelStyle = (status: string | undefined): CSSProperties => ({
  fontSize: '0.6875rem',
  color: status === 'online' ? '#10b981' : '#94a3b8',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
});

const emptyListStyle: CSSProperties = {
  padding: '2rem 1rem',
  textAlign: 'center' as const,
  color: '#94a3b8',
  fontSize: '0.8125rem',
  fontFamily: "'Inter', system-ui, sans-serif",
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
      {/* Header */}
      <div style={headerBarStyle}>
        <div style={headerLabelStyle}>
          Dispositivos
          {selectedDeviceIds.length > 0 && <span style={countBadgeStyle}>{selectedDeviceIds.length}</span>}
        </div>
        <button
          style={selectAllButton}
          onClick={toggleAll}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
        >
          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      {/* List */}
      <ul style={listContainerStyle}>
        {activeDevices.map((device) => {
          const isChecked = selectedDeviceIds.includes(device.id ?? 0);
          return (
            <li
              key={device.id}
              style={listItemStyle(isChecked)}
              onClick={() => toggleDevice(device.id ?? 0)}
              onMouseEnter={(e) => {
                if (!isChecked) e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.02)';
              }}
              onMouseLeave={(e) => {
                if (!isChecked) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Checkbox */}
              <div style={checkboxOuterStyle(isChecked)}>
                {isChecked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Icon */}
              <div style={deviceIconStyle(isChecked)}>
                <IconMap size={14} />
              </div>

              {/* Info */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={deviceNameStyle}>{device.name || device.uniqueId}</div>
                <div style={statusLabelStyle(device.status)}>
                  <span style={statusDotStyle(device.status)} />
                  {device.status === 'online' ? 'En línea' : 'Sin conexión'}
                </div>
              </div>
            </li>
          );
        })}
        {activeDevices.length === 0 && (
          <li style={emptyListStyle}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem', opacity: 0.4 }}>📡</div>
            No hay dispositivos disponibles
          </li>
        )}
      </ul>
    </div>
  );
}
