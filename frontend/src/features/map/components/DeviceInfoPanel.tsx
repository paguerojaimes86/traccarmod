import { memo, useMemo, type CSSProperties } from 'react';
import { useMapStore } from '@features/map/store';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useDevicePosition } from '@features/positions/hooks/usePositions';
import { useUnitConversion } from '@shared/hooks/useUnitConversion';
import { StatusBadge, type DeviceStatus } from '@shared/ui/StatusBadge';
import { formatDuration, formatTimestamp } from '@shared/lib/units';
import {
  IconSettings,
  IconBattery,
  IconSatellite,
  IconRoute,
  IconClock,
  IconSignal,
  IconMap,
  IconNavigation,
  IconClose,
  IconHistory,
  IconEyeOff
} from '@shared/ui/icons';
import type { Device } from '@shared/api/types.models';
import type { Position } from '@shared/api/types.models';

type PositionAttributes = Record<string, unknown>;

interface InfoCardProps {
  device: Device;
  address?: string;
  fixTime?: string;
  isMoving: boolean;
  stoppedDuration: string;
  speedFormatted: string;
  followMode: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
}

interface SensorsCardProps {
  ignition?: boolean;
  batteryFormatted: string;
  satellites?: number;
  odometerFormatted: string;
  hoursFormatted: string;
  rssi?: number;
  speedFormatted: string;
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 2rem)',
  maxWidth: '1050px',
  zIndex: 10,
  display: 'flex',
  gap: '0.5rem',
  pointerEvents: 'none',
  alignItems: 'stretch',
};

const cardStyle: CSSProperties = {
  flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.07)',
  borderRadius: '0.875rem',
  padding: '0.6875rem 0.9375rem',
  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.1)',
  pointerEvents: 'auto',
  color: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
  paddingBottom: '0.375rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
};

const cardTitleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
};

const rowContainerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.5rem 1rem',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.5875rem',
  color: '#94a3b8',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontFamily: 'Outfit',
};

const valueStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: '#1e293b',
  fontWeight: 600,
  fontFamily: 'Outfit',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const sensorGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.375rem',
};

const sensorCardStyle = (highlight: boolean, highlightColor: string): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0.375rem 0.5rem',
  borderRadius: '0.625rem',
  backgroundColor: highlight ? `${highlightColor}12` : 'rgba(15, 23, 42, 0.03)',
  border: '1px solid',
  borderColor: highlight ? `${highlightColor}35` : 'rgba(15, 23, 42, 0.06)',
  transition: 'all 0.2s ease',
});

function InfoCard({ device, address, fixTime, isMoving, stoppedDuration, speedFormatted, followMode, onToggleFollow, onClose }: InfoCardProps) {
  const showHistory = useMapStore((s) => s.showHistory);
  const setShowHistory = useMapStore((s) => s.setShowHistory);
  const status = (device.status ?? 'unknown') as DeviceStatus;

  return (
    <div style={{ ...cardStyle, flex: '0 0 420px' }}>
      <div style={cardHeaderStyle}>
        <div style={cardTitleStyle}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconMap size={14} />
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{device.name || device.uniqueId}</span>
          <StatusBadge status={status} />
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <button
            title={showHistory ? "Ocultar Historial" : "Ver Historial"}
            style={{
              padding: '0.3rem 0.5rem',
              border: '1px solid',
              borderColor: showHistory ? '#6366f1' : 'rgba(15, 23, 42, 0.08)',
              background: showHistory ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.03)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: showHistory ? '#6366f1' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.5875rem',
              fontWeight: 800,
              fontFamily: 'Outfit',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onClick={() => setShowHistory(!showHistory)}
            onMouseEnter={(e) => { if (!showHistory) { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; } }}
            onMouseLeave={(e) => { if (!showHistory) { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; } }}
          >
            {showHistory ? <IconEyeOff size={12} /> : <IconHistory size={12} />}
            <span>{showHistory ? 'CERRAR' : 'HISTORIAL'}</span>
          </button>

          <button
            title={followMode ? "Desactivar Auto-pilot" : "Activar Auto-pilot"}
            style={{
              padding: '0.3rem 0.5rem',
              border: '1px solid',
              borderColor: followMode ? '#6366f1' : 'rgba(15, 23, 42, 0.08)',
              background: followMode ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.03)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: followMode ? '#6366f1' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.5875rem',
              fontWeight: 800,
              fontFamily: 'Outfit',
              transition: 'all 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onClick={onToggleFollow}
            onMouseEnter={(e) => { if (!followMode) { e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; } }}
            onMouseLeave={(e) => { if (!followMode) { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.03)'; e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.08)'; } }}
          >
            <IconNavigation size={12} style={{ transform: followMode ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
            {followMode && <span>AUTO</span>}
          </button>

          <div style={{ width: '1px', height: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.1)', margin: '0 0.125rem' }} />

          <button
            style={{
              padding: '0.25rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              transition: 'all 0.2s ease',
              borderRadius: '6px',
            }}
            onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.06)'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <IconClose size={16} />
          </button>
        </div>
      </div>

      <div style={rowContainerStyle}>
        <div style={{ ...rowStyle, gridColumn: 'span 2' }}>
          <span style={labelStyle}>Ubicación</span>
          <span style={{ ...valueStyle, color: '#6366f1' }} title={address}>
            {address ?? 'Determinando ubicación...'}
          </span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Último Reporte</span>
          <span style={valueStyle}>{fixTime ? formatTimestamp(fixTime) : '—'}</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>{isMoving ? 'Velocidad' : 'Tiempo Reposo'}</span>
          <span style={{ ...valueStyle, color: isMoving ? '#10b981' : '#f59e0b' }}>
            {isMoving ? speedFormatted : (stoppedDuration || '—')}
          </span>
        </div>
      </div>
    </div>
  );
}

function SensorsCard({ ignition, batteryFormatted, satellites, odometerFormatted, hoursFormatted, rssi, speedFormatted }: SensorsCardProps) {
  const sensors = [
    { label: 'Motor', value: ignition === true ? 'ON' : 'OFF', icon: <IconSettings size={11} />, highlight: ignition === true, color: '#10b981' },
    { label: 'Bat.', value: batteryFormatted, icon: <IconBattery size={11} />, color: '#818cf8' },
    { label: 'Sat', value: satellites != null ? String(satellites) : '—', icon: <IconSatellite size={11} />, color: '#818cf8' },
    { label: 'Odóm.', value: odometerFormatted, icon: <IconRoute size={11} />, color: '#818cf8' },
    { label: 'Motor H.', value: hoursFormatted, icon: <IconClock size={11} />, color: '#818cf8' },
    { label: 'Signal', value: rssi != null ? `${rssi}/5` : '—', icon: <IconSignal size={11} />, color: '#818cf8' },
  ];

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={cardTitleStyle}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconSettings size={14} />
          </div>
          <span style={{ fontSize: '0.8125rem' }}>Telemetría</span>
        </div>
        <div style={{ color: '#6366f1', fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>{speedFormatted}</div>
      </div>

      <div style={sensorGridStyle}>
        {sensors.map(({ label, value, icon, highlight, color }) => (
          <div key={label} style={sensorCardStyle(highlight || false, color)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em', fontFamily: 'Outfit' }}>
              <span style={{ color }}>{icon}</span>
              <span>{label}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: highlight ? '#10b981' : '#1e293b', fontWeight: 800, margin: '2px 0 0', fontFamily: 'Outfit', letterSpacing: '-0.01em' }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeviceInfoPanel() {
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const setSelectedDevice = useMapStore((s) => s.setSelectedDevice);
  const followMode = useMapStore((s) => s.followMode);
  const setFollowMode = useMapStore((s) => s.setFollowMode);

  const { data: devices = [] } = useDevices();
  const { data: position } = useDevicePosition(selectedDeviceId);
  const { formatSpeed, formatDistance } = useUnitConversion();

  const deviceMap = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);

  if (!selectedDeviceId) return null;
  const device = deviceMap.get(selectedDeviceId);
  if (!device) return null;

  const attrs = ((position?.attributes ?? {}) as unknown) as PositionAttributes;
  const isMoving = (position?.speed ?? 0) > 0;
  const stoppedDuration = !isMoving && position?.fixTime
    ? formatDuration(Math.max(0, Date.now() - new Date(position.fixTime).getTime()) / 1000)
    : '';

  const speedFormatted = position?.speed != null ? formatSpeed(position.speed, 0) : '0 km/h';

  const rawOdometer = (attrs.totalDistance ?? attrs.odometer) as number | undefined;
  let odometerMeters: number | undefined = undefined;
  if (typeof rawOdometer === 'number') {
    odometerMeters = rawOdometer < 100000 ? rawOdometer * 1000 : rawOdometer;
  }
  const odometerFormatted = odometerMeters != null ? formatDistance(odometerMeters, 0) : '0 km';

  const hoursVal = (attrs.hours ?? attrs.motionTime) as number | undefined;
  const hoursFormatted = (typeof hoursVal === 'number') ? formatDuration(hoursVal / 1000) : '0s';

  const ignition = (attrs.ignition ?? attrs.acc) as boolean | undefined;
  const battery = (attrs.batteryLevel ?? attrs.batt) as number | undefined;
  const power = (attrs.power ?? attrs.vcc) as number | undefined;
  const batteryFormatted = battery != null ? `${battery}%` : power != null ? `${power.toFixed(1)}V` : '—';

  const satellites = (attrs.sat ?? attrs.satellites) as number | undefined;
  const rssi = (attrs.rssi ?? attrs.signal) as number | undefined;

  return (
    <div style={overlayStyle}>
      <InfoCard
        device={device}
        address={position?.address}
        fixTime={position?.fixTime}
        isMoving={isMoving}
        stoppedDuration={stoppedDuration}
        speedFormatted={speedFormatted}
        followMode={followMode}
        onToggleFollow={() => setFollowMode(!followMode)}
        onClose={() => setSelectedDevice(null)}
      />
      <SensorsCard
        ignition={ignition}
        batteryFormatted={batteryFormatted}
        satellites={satellites}
        odometerFormatted={odometerFormatted}
        hoursFormatted={hoursFormatted}
        rssi={rssi}
        speedFormatted={speedFormatted}
      />
    </div>
  );
}