import { useState, useCallback, useMemo, useRef, useEffect, type CSSProperties } from 'react';
import { useDevicePositions } from '@features/positions/hooks/usePositions';
import { ErrorState } from '@shared/ui';
import {
  IconDownload,
  IconPlay,
  IconPause,
  IconReset,
  IconClose,
} from '@shared/ui/icons';
import { formatTimestamp } from '@shared/lib/units';

type PeriodPreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';
interface DateRange { from: Date; to: Date }

function getPeriodRange(preset: PeriodPreset): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = new Date(now); y.setDate(now.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'thisWeek': {
      const day = now.getDay();
      const start = new Date(now); start.setDate(now.getDate() - day);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case 'lastWeek': {
      const day = now.getDay();
      const end = new Date(now); end.setDate(now.getDate() - day - 1);
      const start = new Date(end); start.setDate(end.getDate() - 6);
      return { from: startOfDay(start), to: endOfDay(end) };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(start), to: endOfDay(end) };
    }
    default: return { from: new Date(now.getTime() - 3_600_000), to: now };
  }
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  thisWeek: 'Semana Actual',
  lastWeek: 'Semana Anterior',
  thisMonth: 'Mes Actual',
  lastMonth: 'Mes Anterior',
  custom: 'Personalizado',
};

function toLocalDatetime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const SPEEDS = [1, 2, 5, 10] as const;

const containerStyle: CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  zIndex: 100,
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  borderRadius: '0.875rem',
  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
  padding: '1.25rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxWidth: '420px',
  width: 'auto',
  minWidth: '320px',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  color: '#0f172a',
};

const titleStyle: CSSProperties = {
  fontFamily: 'Outfit',
  fontSize: '0.8125rem',
  fontWeight: 800,
  color: '#6366f1',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
  paddingBottom: '0.75rem',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: '#64748b',
  minWidth: '5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const selectStyle: CSSProperties = {
  flex: 1,
  height: '2.75rem',
  padding: '0 0.75rem',
  borderRadius: '0.625rem',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  backgroundColor: '#ffffff',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 500,
  outline: '2px solid transparent',
  outlineOffset: 2,
  cursor: 'pointer',
  transition: 'border-color 160ms ease, box-shadow 160ms ease',
};

const inputStyle: CSSProperties = {
  ...selectStyle,
  cursor: 'text',
  paddingLeft: '0.75rem',
};

const loadBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  height: '3.5rem',
  borderRadius: '1rem',
  border: 'none',
  backgroundColor: '#6366f1',
  color: '#ffffff',
  fontSize: '0.8125rem',
  fontWeight: 700,
  cursor: 'pointer',
  width: '100%',
  transition: 'background 160ms ease, transform 160ms ease',
  boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15)',
};

const loadBtnDisabledStyle: CSSProperties = {
  ...loadBtnStyle,
  backgroundColor: 'rgba(15, 23, 42, 0.06)',
  color: '#94a3b8',
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const telemetryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  padding: '0',
};

const telemetryBoxStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
};

const telemLabelStyle: CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const telemValueStyle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#0f172a',
  fontFamily: 'Outfit',
};

const scrubberWrapperStyle: CSSProperties = {
  position: 'relative',
  height: '8px',
  backgroundColor: 'rgba(15, 23, 42, 0.08)',
  borderRadius: '99px',
  margin: '0.75rem 0',
  cursor: 'pointer',
};

const scrubberProgressStyle = (progress: number): CSSProperties => ({
  position: 'absolute',
  height: '100%',
  width: `${progress}%`,
  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
  borderRadius: '99px',
  transition: 'width 0.1s linear',
});

const scrubberThumbStyle = (progress: number): CSSProperties => ({
  position: 'absolute',
  top: '50%',
  left: `${progress}%`,
  transform: 'translate(-50%, -50%)',
  width: '16px',
  height: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '50%',
  border: '3px solid #6366f1',
  boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
  zIndex: 2,
  transition: 'left 0.1s linear',
});

const segmentedControlStyle: CSSProperties = {
  display: 'flex',
  backgroundColor: 'rgba(15, 23, 42, 0.04)',
  padding: '0.25rem',
  borderRadius: '0.625rem',
  gap: '0.25rem',
  border: '1px solid rgba(15, 23, 42, 0.08)',
};

const speedBtnStyle = (active: boolean): CSSProperties => ({
  padding: '0.5rem 0.875rem',
  borderRadius: '0.5rem',
  border: 'none',
  backgroundColor: active ? '#6366f1' : 'transparent',
  color: active ? '#ffffff' : '#64748b',
  fontSize: '0.6875rem',
  fontWeight: 800,
  cursor: 'pointer',
  minWidth: '2.5rem',
  transition: 'background-color 0.2s, color 0.2s',
});

const mainPlayBtnStyle: CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  border: 'none',
  backgroundColor: '#6366f1',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
  transition: 'transform 0.2s, background 0.2s',
  flexShrink: 0,
};

const secondaryBtnStyle: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.04)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: '0.625rem',
  padding: '0.625rem',
  color: '#64748b',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s, color 0.2s',
  flexShrink: 0,
};

interface HistoryPanelProps {
  deviceId: number | null;
  onPositionsLoaded: (positions: { longitude: number; latitude: number; course: number }[]) => void;
  onClose: () => void;
}

export function HistoryPanel({ deviceId, onPositionsLoaded, onClose }: HistoryPanelProps) {
  const [period, setPeriod] = useState<PeriodPreset>('today');
  const [customFrom, setCustomFrom] = useState(() => toLocalDatetime(new Date(Date.now() - 3_600_000)));
  const [customTo, setCustomTo]   = useState(() => toLocalDatetime(new Date()));
  const [loaded, setLoaded]   = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed]     = useState<1 | 2 | 5 | 10>(1);
  const [index, setIndex]     = useState(0);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(speed);
  const indexRef = useRef(index);
  speedRef.current = speed;
  indexRef.current = index;

  const { fromIso, toIso } = useMemo(() => {
    if (period === 'custom') {
      return { fromIso: new Date(customFrom).toISOString(), toIso: new Date(customTo).toISOString() };
    }
    const range = getPeriodRange(period);
    return { fromIso: range.from.toISOString(), toIso: range.to.toISOString() };
  }, [period, customFrom, customTo]);

  const { data: positions = [], isLoading, isError, refetch } = useDevicePositions(deviceId ?? 0, fromIso, toIso);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const currentPos = positions[index];
  const progress = positions.length > 1 ? (index / (positions.length - 1)) * 100 : 0;
  const speedDisplay = currentPos?.speed != null ? `${Math.round(currentPos.speed * 1.852)} km/h` : '0 km/h';
  const timeDisplay = currentPos?.fixTime ? formatTimestamp(currentPos.fixTime) : '--:--:--';

  const handleLoad = useCallback(() => {
    refetch().then((result) => {
      const data = result.data ?? [];
      if (data.length > 0) {
        setLoaded(true);
        setIndex(0);
        onPositionsLoaded(data.filter((p) => p.longitude != null && p.latitude != null).map((p) => ({ longitude: p.longitude!, latitude: p.latitude!, course: p.course ?? 0 })));
      }
    });
  }, [refetch, onPositionsLoaded]);

  const handleScrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const nextI = Math.floor(pct * (positionsRef.current.length - 1));
    
    setIndex(nextI);
    indexRef.current = nextI;
    
    const posList = positionsRef.current;
    onPositionsLoaded(posList.slice(0, nextI + 1).filter((p) => p.longitude != null && p.latitude != null).map((p) => ({ longitude: p.longitude!, latitude: p.latitude!, course: p.course ?? 0 })));
  }, [onPositionsLoaded]);

  useEffect(() => {
    if (!playing || positionsRef.current.length === 0) return;
    const tick = () => {
      const nextI = indexRef.current + 1;
      const posList = positionsRef.current;
      if (nextI >= posList.length) { setPlaying(false); setIndex(posList.length - 1); intervalRef.current = null; return; }
      setIndex(nextI); indexRef.current = nextI;
      const pos = posList[nextI];
      if (pos.longitude != null && pos.latitude != null) {
        onPositionsLoaded(posList.slice(0, nextI + 1).filter((p) => p.longitude != null && p.latitude != null).map((p) => ({ longitude: p.longitude!, latitude: p.latitude!, course: p.course ?? 0 })));
      }
      intervalRef.current = setTimeout(tick, 1000 / speedRef.current);
    };
    intervalRef.current = setTimeout(tick, 1000 / speedRef.current);
    return () => { if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; } };
  }, [playing, onPositionsLoaded]);

  const handlePause = useCallback(() => { setPlaying(false); if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; } }, []);
  const handleReset = useCallback(() => { setPlaying(false); if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; } setLoaded(false); setIndex(0); onPositionsLoaded([]); }, [onPositionsLoaded]);

  useEffect(() => {
    return () => { if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = null; } };
  }, []);

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        <span>REPLAY TÁCTICO DE RUTA</span>
        <button style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.125rem' }} onClick={onClose}>
          <IconClose size={18} />
        </button>
      </div>

      {!loaded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Período</span>
            <select style={selectStyle} value={period} onChange={(e) => setPeriod(e.target.value as PeriodPreset)}>
              {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((key) => <option key={key} value={key}>{PERIOD_LABELS[key]}</option>)}
            </select>
          </div>
          {period === 'custom' && (
            <>
              <div style={rowStyle}><span style={labelStyle}>Desde</span><input type="datetime-local" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={inputStyle} /></div>
              <div style={rowStyle}><span style={labelStyle}>Hasta</span><input type="datetime-local" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={inputStyle} /></div>
            </>
          )}
          {isError && <ErrorState message="Fallo de conexión" onRetry={handleLoad} />}
          <button style={!deviceId || isLoading ? loadBtnDisabledStyle : loadBtnStyle} disabled={!deviceId || isLoading} onClick={handleLoad}>
            <IconDownload size={18} />
            {isLoading ? 'ANALIZANDO REGISTROS...' : 'CARGAR RECORRIDO'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={telemetryGridStyle}>
            <div style={telemetryBoxStyle}>
              <span style={telemLabelStyle}>Velocidad Histórica</span>
              <span style={telemValueStyle}>{speedDisplay}</span>
            </div>
            <div style={telemetryBoxStyle}>
              <span style={telemLabelStyle}>Cronología</span>
              <span style={telemValueStyle}>{timeDisplay}</span>
            </div>
          </div>

          <div style={scrubberWrapperStyle} onClick={handleScrub}>
            <div style={scrubberProgressStyle(progress)} />
            <div style={scrubberThumbStyle(progress)} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {playing ? (
                <button style={mainPlayBtnStyle} onClick={handlePause} title="Pausar"><IconPause size={20} /></button>
              ) : (
                <button style={mainPlayBtnStyle} onClick={() => setPlaying(true)} title="Reproducir"><IconPlay size={20} /></button>
              )}
              
              <div style={segmentedControlStyle}>
                {SPEEDS.map((s) => (
                  <button key={s} style={speedBtnStyle(s === speed)} onClick={() => setSpeed(s)}>{s}x</button>
                ))}
              </div>
            </div>

            <button style={secondaryBtnStyle} onClick={handleReset} title="Reiniciar Recorrido">
              <IconReset size={16} />
            </button>
          </div>
          
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textAlign: 'center', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
            REG {(index + 1).toString().padStart(4, '0')} DE {positions.length}
          </div>
        </div>
      )}
    </div>
  );
}