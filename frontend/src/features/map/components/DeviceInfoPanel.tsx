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

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Estilos "Cinemsatic Horizontal" ─────────────────────────────────────────

const overlayStyle: CSSProperties = {
  position: 'absolute',
  bottom: '1rem',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 2rem)',
  maxWidth: '1100px',
  zIndex: 10,
  display: 'flex',
  gap: '0.625rem',
  pointerEvents: 'none',
  alignItems: 'stretch',
};

const cardStyle: CSSProperties = {
  flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: '0.875rem',
  padding: '0.75rem 1rem',
  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
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
  paddingBottom: '0.4rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
};

const cardTitleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  fontSize: '0.9375rem',
  fontWeight: 700,
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
  fontSize: '0.6rem',
  color: '#94a3b8',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const valueStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: '#1e293b',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const sensorGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.4rem',
};

const sensorCardStyle = (highlight: boolean): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0.4rem 0.625rem',
  borderRadius: '0.625rem',
  backgroundColor: highlight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.03)',
  border: '1px solid',
  borderColor: highlight ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.06)',
});

// ─── InfoCard ─────────────────────────────────────────────────────────────────

const InfoCard = memo(function InfoCard({
  device,
  address,
  fixTime,
  isMoving,
  stoppedDuration,
  speedFormatted,
  followMode,
  onToggleFollow,
  onClose,
}: InfoCardProps) {
  const showHistory = useMapStore((s) => s.showHistory);
  const setShowHistory = useMapStore((s) => s.setShowHistory);
  const status = (device.status ?? 'unknown') as DeviceStatus;

  return (
    <div style={{ ...cardStyle, flex: '0 0 440px' }}>
      <div style={cardHeaderStyle}>
        <div style={cardTitleStyle}>
          <IconMap size={16} style={{ color: 'var(--accent)' }} />
          <span>{device.name || device.uniqueId}</span>
          <StatusBadge status={status} />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button 
            title={showHistory ? "Ocultar Historial" : "Ver Historial"}
            style={{ 
              padding: '0.35rem 0.6rem', 
              border: '1px solid',
              borderColor: showHistory ? 'var(--accent)' : 'rgba(15, 23, 42, 0.1)',
              background: showHistory ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.03)', 
              borderRadius: '0.5rem',
              cursor: 'pointer', 
              color: showHistory ? 'var(--accent)' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'auto'
            }} 
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? <IconEyeOff size={14} /> : <IconHistory size={14} />}
            <span style={{ fontSize: '0.6rem' }}>{showHistory ? 'CERRAR' : 'HISTORIAL'}</span>
          </button>

          <button 
            title={followMode ? "Desactivar Auto-pilot" : "Activar Auto-pilot (Seguimiento)"}
            style={{ 
              padding: '0.35rem 0.6rem', 
              border: '1px solid',
              borderColor: followMode ? 'var(--accent)' : 'rgba(15, 23, 42, 0.1)',
              background: followMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.03)', 
              borderRadius: '0.5rem',
              cursor: 'pointer', 
              color: followMode ? 'var(--accent)' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: 'auto'
            }} 
            onClick={onToggleFollow}
          >
            <IconNavigation size={14} style={{ transform: followMode ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
            {followMode && <span style={{ letterSpacing: '0.05em', fontSize: '0.6rem' }}>AUTO-PILOT</span>}
          </button>
          
          <div style={{ width: '1px', height: '1.25rem', backgroundColor: 'rgba(15, 23, 42, 0.1)', margin: '0 0.125rem' }} />

          <button 
            style={{ padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }} 
            onClick={onClose}
          >
            <IconClose size={18} />
          </button>
        </div>
      </div>

      <div style={rowContainerStyle}>
        <div style={{ ...rowStyle, gridColumn: 'span 2' }}>
          <span style={labelStyle}>Ubicación</span>
          <span style={{ ...valueStyle, color: 'var(--accent-hover)' }} title={address}>
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
});

// ─── SensorsCard ─────────────────────────────────────────────────────────────

const SensorsCard = memo(function SensorsCard({
  ignition,
  batteryFormatted,
  satellites,
  odometerFormatted,
  hoursFormatted,
  rssi,
  speedFormatted,
}: SensorsCardProps) {
  const sensors = [
    { label: 'Motor', value: ignition === true ? 'ON' : 'OFF', icon: <IconSettings size={12} />, highlight: ignition === true, color: ignition ? '#10b981' : '#64748b' },
    { label: 'Batería', value: batteryFormatted, icon: <IconBattery size={12} />, color: '#818cf8' },
    { label: 'Sat', value: satellites != null ? String(satellites) : '0', icon: <IconSatellite size={12} />, color: '#818cf8' },
    { label: 'Odómetro', value: odometerFormatted, icon: <IconRoute size={12} />, color: '#818cf8' },
    { label: 'Uso Motor', value: hoursFormatted, icon: <IconClock size={12} />, color: '#818cf8' },
    { label: 'Señal', value: rssi != null ? `${rssi}/5` : '—', icon: <IconSignal size={12} />, color: '#818cf8' },
  ];

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <div style={cardTitleStyle}>
          <IconSettings size={16} style={{ color: '#fbbf24' }} />
          <span>Telemetría en Tiempo Real</span>
        </div>
        <div style={{ color: 'var(--accent-hover)', fontSize: '0.9375rem', fontWeight: 800 }}>{speedFormatted}</div>
      </div>

      <div style={sensorGridStyle}>
        {sensors.map(({ label, value, icon, highlight, color }) => (
          <div key={label} style={sensorCardStyle(highlight || false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.025em' }}>
              <span style={{ color }}>{icon}</span>
              <span>{label}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: highlight ? '#10b981' : '#1e293b', fontWeight: 800, margin: 0 }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── DeviceInfoPanel ─────────────────────────────────────────────────────────

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
