import { useState, useMemo, useCallback, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useSummaryReport } from '../hooks/useSummaryReport';
import { useTripsReport } from '../hooks/useTripsReport';
import { useStopsReport } from '../hooks/useStopsReport';
import { useRouteReport } from '../hooks/useRouteReport';
import { useEventsReport } from '../hooks/useEventsReport';
import { useMapStore } from '@features/map/store';
import { getAlertConfig, ALERT_TYPE_CONFIG } from '@shared/lib/alert-types';
import { LoadingState, ErrorState } from '@shared/ui';
import {
  IconDownload,
  IconChevronDown,
  IconMap,
  IconSpeed,
  IconFileBarChart,
  IconRoute,
  IconPause,
  IconActivity,
  IconBell,
  IconNavigation,
} from '@shared/ui/icons';
import * as XLSX from 'xlsx';

// ─── Types ──────────────────────────────────────────

type ReportRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type ReportTab = 'mileage' | 'trips' | 'stops' | 'route' | 'events';

const rangeLabels: Record<ReportRange, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta Semana',
  month: 'Este Mes',
  custom: 'Personalizado',
};

// ─── Helpers ────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ─── Styles ─────────────────────────────────────────

const pageStyle: CSSProperties = {
  padding: '1.5rem 2rem',
  height: '100%',
  overflow: 'auto',
  color: '#0f172a',
};

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const titleStyle: CSSProperties = {
  fontFamily: 'Outfit, sans-serif',
  fontWeight: 800,
  fontSize: '1.5rem',
  color: '#0f172a',
  margin: 0,
  letterSpacing: '-0.02em',
};

const subStyle: CSSProperties = {
  color: '#64748b',
  fontSize: '0.8125rem',
  fontWeight: 500,
  fontFamily: 'Outfit, sans-serif',
  marginTop: '2px',
};

const selectStyle: CSSProperties = {
  appearance: 'none',
  padding: '0.625rem 2.5rem 0.625rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(15, 23, 42, 0.1)',
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#0f172a',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'Outfit, sans-serif',
  outline: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: 180,
};

const tabBtnStyle = (active: boolean): CSSProperties => ({
  padding: '0.5625rem 0.875rem',
  border: 'none',
  borderRadius: '0.625rem',
  background: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
  color: active ? '#6366f1' : '#64748b',
  fontWeight: 700,
  fontFamily: 'Outfit, sans-serif',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
});

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0 0.5rem',
  fontSize: '0.875rem',
};

const tableHeaderStyle = (): CSSProperties => ({
  padding: '0.75rem 1rem',
  color: '#94a3b8',
  fontWeight: 700,
  fontSize: '0.65rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  fontFamily: 'Outfit, sans-serif',
  textAlign: 'left',
});

const tdStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderTop: '1px solid rgba(15, 23, 42, 0.04)',
  borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
  verticalAlign: 'middle',
  backgroundColor: 'rgba(15, 23, 42, 0.02)',
  transition: 'all 0.2s ease',
};

const pillStyle = (color: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.2rem 0.6rem',
  borderRadius: '2rem',
  backgroundColor: `${color}15`,
  color,
  fontSize: '0.65rem',
  fontWeight: 800,
  fontFamily: 'Outfit, sans-serif',
  border: `1px solid ${color}30`,
  letterSpacing: '0.02em',
});

// ─── Event Category Labels ──────────────────────────

const categoryLabel: Record<string, string> = {
  status: 'Estado',
  movement: 'Movimiento',
  geofence: 'Geocerca',
  speed: 'Velocidad',
  alarm: 'Alarma',
  maintenance: 'Mant.',
  other: 'Otros',
};

const allCategories = ['status', 'movement', 'geofence', 'speed', 'alarm', 'maintenance', 'other'] as const;

// ─── Component ──────────────────────────────────────

export function ReportsPage() {
  const navigate = useNavigate();
  const { data: devices = [] } = useDevices();
  const [tab, setTab] = useState<ReportTab>('mileage');
  const [range, setRange] = useState<ReportRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');

  const allDevicesSelected = selectedDeviceIds.length === 0;

  const reportParams = useMemo(() => {
    if (devices.length === 0) return null;

    const from = new Date();
    const to = new Date();

    switch (range) {
      case 'today': from.setHours(0, 0, 0, 0); break;
      case 'yesterday':
        from.setDate(from.getDate() - 1); from.setHours(0, 0, 0, 0);
        to.setDate(to.getDate() - 1); to.setHours(23, 59, 59, 999);
        break;
      case 'week': from.setTime(startOfWeek(from).getTime()); break;
      case 'month': from.setTime(startOfMonth(from).getTime()); break;
      case 'custom': {
        if (!customFrom || !customTo) return null;
        const [fromY, fromM, fromD] = customFrom.split('-').map(Number);
        from.setFullYear(fromY, fromM - 1, fromD); from.setHours(0, 0, 0, 0);
        const [toY, toM, toD] = customTo.split('-').map(Number);
        to.setFullYear(toY, toM - 1, toD); to.setHours(23, 59, 59, 999);
        break;
      }
    }

    const idFilter = allDevicesSelected ? devices.map(d => d.id!) : selectedDeviceIds;
    return { deviceId: idFilter, from: from.toISOString(), to: to.toISOString() };
  }, [devices, range, customFrom, customTo, selectedDeviceIds, allDevicesSelected]);

  const eventsParams = useMemo(() => {
    if (!reportParams) return null;
    const typeFilter = eventFilter === 'all' ? undefined : [eventFilter];
    return { ...reportParams, type: typeFilter };
  }, [reportParams, eventFilter]);

  const summaryQuery = useSummaryReport(tab === 'mileage' ? reportParams : null);
  const tripsQuery = useTripsReport(tab === 'trips' ? reportParams : null);
  const stopsQuery = useStopsReport(tab === 'stops' ? reportParams : null);
  const routeQuery = useRouteReport(tab === 'route' ? reportParams : null);
  const eventsQuery = useEventsReport(tab === 'events' ? eventsParams : null);

  const activeQuery = tab === 'mileage' ? summaryQuery
    : tab === 'trips' ? tripsQuery
    : tab === 'stops' ? stopsQuery
    : tab === 'route' ? routeQuery
    : tab === 'events' ? eventsQuery
    : summaryQuery;

  const { data: rawData, isFetching, isError, refetch } = activeQuery;
  const reportData = rawData ?? [];
  const hasData = reportData.length > 0;
  const deviceMap = useMemo(() => new Map(devices.map(d => [d.id, d])), [devices]);

  const toggleDevice = useCallback((id: number) => {
    setSelectedDeviceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleViewRouteOnMap = useCallback((positions: any[]) => {
    useMapStore.getState().setSelectedDevice(positions[0]?.deviceId ?? null);
    useMapStore.getState().setShowHistory(true);
    navigate('/');
  }, [navigate]);

  const handleExportXLSX = useCallback(() => {
    if (!hasData) return;

    const rows = reportData.map((row: any) => {
      const device = deviceMap.get(row.deviceId);
      const base: Record<string, string> = {
        'Vehículo': device?.name ?? '',
        'TID': device?.uniqueId ?? '',
      };

      if (tab === 'mileage') {
        return {
          ...base,
          'Distancia (km)': +((row.distance ?? 0) / 1000).toFixed(2),
          'Velocidad Máx (km/h)': +((row.maxSpeed ?? 0) * 1.852).toFixed(1),
          'Velocidad Prom (km/h)': +((row.averageSpeed ?? 0) * 1.852).toFixed(1),
          'Consumo (L)': +(row.spentFuel ?? 0).toFixed(1),
        };
      } else if (tab === 'trips') {
        return {
          ...base,
          'Distancia (km)': +((row.distance ?? 0) / 1000).toFixed(2),
          'Velocidad Máx (km/h)': +((row.maxSpeed ?? 0) * 1.852).toFixed(1),
          'Promedio (km/h)': +((row.averageSpeed ?? 0) * 1.852).toFixed(1),
          'Duración (min)': +((row.duration ?? 0) / 60).toFixed(0),
          'Inicio': row.startTime ? new Date(row.startTime).toLocaleString() : '',
          'Fin': row.endTime ? new Date(row.endTime).toLocaleString() : '',
          'Dirección Inicio': row.startAddress ?? '',
          'Dirección Fin': row.endAddress ?? '',
        };
      } else if (tab === 'stops') {
        return {
          ...base,
          'Duración (min)': +((row.duration ?? 0) / 60).toFixed(0),
          'Inicio': row.startTime ? new Date(row.startTime).toLocaleString() : '',
          'Fin': row.endTime ? new Date(row.endTime).toLocaleString() : '',
          'Dirección': row.address ?? '',
        };
      } else if (tab === 'route') {
        return {
          ...base,
          'Fecha': row.fixTime ? new Date(row.fixTime).toLocaleString() : '',
          'Lat': row.latitude ?? '',
          'Lon': row.longitude ?? '',
          'Velocidad (km/h)': +((row.speed ?? 0) * 1.852).toFixed(1),
          'Dirección': row.address ?? '',
        };
      } else if (tab === 'events') {
        const config = getAlertConfig(row.type);
        return {
          ...base,
          'Tipo': config.label ?? row.type,
          'Categoría': categoryLabel[config.category] ?? config.category,
          'Fecha': row.eventTime ? new Date(row.eventTime).toLocaleString() : '',
          'Dirección': row.address ?? '',
        };
      }
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `reporte_${tab}_${date}.xlsx`);
  }, [reportData, deviceMap, tab, hasData]);

  // ─── Route summary (per device) ──────────────────

  const routeSummary = useMemo(() => {
    if (tab !== 'route' || !reportData.length) return [];
    const byDevice = new Map<number, any[]>();
    for (const pos of reportData) {
      const id = pos.deviceId;
      if (id == null) continue;
      if (!byDevice.has(id)) byDevice.set(id, []);
      byDevice.get(id)!.push(pos);
    }
    const summaries: Array<{
      deviceId: number;
      positions: number;
      distance: number;
      maxSpeed: number;
      avgSpeed: number;
      startTime: string;
      endTime: string;
    }> = [];

    for (const [deviceId, positions] of byDevice) {
      let distance = 0;
      let maxSpeed = 0;
      let speedSum = 0;
      let count = 0;

      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        const speed = (p.speed ?? 0) * 1.852;
        maxSpeed = Math.max(maxSpeed, speed);
        speedSum += speed;
        count++;

        if (i > 0) {
          const prev = positions[i - 1];
          const R = 6371000;
          const dLat = ((p.latitude - prev.latitude) * Math.PI) / 180;
          const dLon = ((p.longitude - prev.longitude) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos((prev.latitude * Math.PI) / 180) * Math.cos((p.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
          distance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
      }

      summaries.push({
        deviceId,
        positions: positions.length,
        distance,
        maxSpeed,
        avgSpeed: count > 0 ? speedSum / count : 0,
        startTime: positions[0]?.fixTime ?? '',
        endTime: positions[positions.length - 1]?.fixTime ?? '',
      });
    }

    return summaries;
  }, [tab, reportData]);

  // ─── Event filter counts ─────────────────────────

  const eventFilterCounts = useMemo(() => {
    if (tab !== 'events' || !reportData.length) return {};
    const counts: Record<string, number> = { all: reportData.length };
    for (const cat of allCategories) {
      counts[cat] = reportData.filter((e: any) => getAlertConfig(e.type).category === cat).length;
    }
    return counts;
  }, [tab, reportData]);

  return (
    <div style={pageStyle} className="custom-scrollbar">
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={titleStyle}>Reportes</h1>
        <p style={subStyle}>Análisis de actividad de la flota — Kilometraje, viajes, detenciones, rutas, eventos y geocercas.</p>
      </div>

      {/* Controls Row */}
      <div style={headerRowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Report Type Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.25rem',
            padding: '0.25rem',
            backgroundColor: 'rgba(15, 23, 42, 0.03)',
            borderRadius: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <button style={tabBtnStyle(tab === 'mileage')} onClick={() => setTab('mileage')}>
              <IconSpeed size={16} /> Kilometraje
            </button>
            <button style={tabBtnStyle(tab === 'trips')} onClick={() => setTab('trips')}>
              <IconRoute size={16} /> Viajes
            </button>
            <button style={tabBtnStyle(tab === 'stops')} onClick={() => setTab('stops')}>
              <IconPause size={16} /> Detenciones
            </button>
            <button style={tabBtnStyle(tab === 'route')} onClick={() => setTab('route')}>
              <IconNavigation size={16} /> Ruta
            </button>
            <button style={tabBtnStyle(tab === 'events')} onClick={() => setTab('events')}>
              <IconBell size={16} /> Eventos
            </button>
          </div>

          {/* Range Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              style={selectStyle}
              value={range}
              onChange={(e) => setRange(e.target.value as ReportRange)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.1)'; }}
            >
              {Object.entries(rangeLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <IconChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>

          {range === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={selectStyle} />
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700 }}>→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={selectStyle} />
            </>
          )}
        </div>

        {/* Export */}
        <button
          onClick={handleExportXLSX}
          disabled={!hasData}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5625rem 1.125rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            backgroundColor: !hasData ? 'rgba(15, 23, 42, 0.03)' : 'rgba(99, 102, 241, 0.08)',
            color: !hasData ? '#94a3b8' : '#6366f1',
            fontSize: '0.8125rem',
            fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            cursor: !hasData ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <IconDownload size={15} />
          Exportar Excel
        </button>
      </div>

      {/* Device Quick Select */}
      {devices.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem', padding: '0.625rem', borderRadius: '0.875rem', backgroundColor: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.04)' }}>
          <button
            onClick={() => setSelectedDeviceIds([])}
            style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid',
              borderColor: allDevicesSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(15, 23, 42, 0.06)',
              background: allDevicesSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: allDevicesSelected ? '#6366f1' : '#64748b',
              fontSize: '0.6875rem',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            TODOS ({devices.length})
          </button>
          {devices.slice(0, 15).map(d => {
            const id = d.id!;
            const isSelected = !allDevicesSelected && selectedDeviceIds.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleDevice(id)}
                title={d.uniqueId ?? ''}
                style={{
                  padding: '0.3rem 0.625rem',
                  borderRadius: '0.75rem',
                  border: '1px solid',
                  borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(15, 23, 42, 0.06)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: isSelected ? '#6366f1' : '#94a3b8',
                  fontSize: '0.6875rem',
                  fontWeight: isSelected ? 800 : 600,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Event Category Filters (only for events tab) */}
      {tab === 'events' && hasData && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setEventFilter('all')}
            style={{
              padding: '0.3rem 0.625rem',
              borderRadius: '0.75rem',
              border: '1px solid',
              borderColor: eventFilter === 'all' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(15, 23, 42, 0.06)',
              background: eventFilter === 'all' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: eventFilter === 'all' ? '#6366f1' : '#64748b',
              fontSize: '0.6875rem',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            TODOS ({eventFilterCounts.all ?? 0})
          </button>
          {allCategories.map((cat) => {
            const count = eventFilterCounts[cat] ?? 0;
            if (count === 0 && eventFilter !== cat) return null;
            const sampleConfig = ALERT_TYPE_CONFIG[Object.keys(ALERT_TYPE_CONFIG).find((k) => ALERT_TYPE_CONFIG[k].category === cat) ?? ''];
            const color = sampleConfig?.color ?? '#6b7280';
            return (
              <button
                key={cat}
                onClick={() => setEventFilter(cat)}
                style={{
                  padding: '0.3rem 0.625rem',
                  borderRadius: '0.75rem',
                  border: '1px solid',
                  borderColor: eventFilter === cat ? `${color}50` : 'rgba(15, 23, 42, 0.06)',
                  background: eventFilter === cat ? `${color}18` : 'transparent',
                  color: eventFilter === cat ? color : '#94a3b8',
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {categoryLabel[cat]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      {isFetching ? (
        <div style={{ padding: '5rem 0' }}><LoadingState message="Cargando reporte..." /></div>
      ) : isError ? (
        <ErrorState message="Error al cargar el reporte" onRetry={() => refetch()} />
      ) : !hasData ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
          <div style={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: 'rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <IconFileBarChart size={24} style={{ color: '#cbd5e1' }} />
          </div>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'Outfit', color: '#64748b' }}>Sin datos</p>
          <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', fontFamily: 'Outfit', color: '#94a3b8' }}>No se encontraron registros para el período seleccionado.</p>
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {tab === 'mileage' && (
                <>
                  <th style={tableHeaderStyle()}>Vehículo</th>
                  <th style={tableHeaderStyle()}>Recorrido</th>
                  <th style={tableHeaderStyle()}>Velocidad Máx / Prom</th>
                  <th style={tableHeaderStyle()}>Consumo</th>
                </>
              )}
              {tab === 'trips' && (
                <>
                  <th style={tableHeaderStyle()}>Vehículo</th>
                  <th style={tableHeaderStyle()}>Distancia</th>
                  <th style={tableHeaderStyle()}>Velocidad</th>
                  <th style={tableHeaderStyle()}>Duración</th>
                  <th style={tableHeaderStyle()}>Hora</th>
                </>
              )}
              {tab === 'stops' && (
                <>
                  <th style={tableHeaderStyle()}>Vehículo</th>
                  <th style={tableHeaderStyle()}>Duración</th>
                  <th style={tableHeaderStyle()}>Dirección</th>
                  <th style={tableHeaderStyle()}>Hora</th>
                </>
              )}
              {tab === 'route' && (
                <>
                  <th style={tableHeaderStyle()}>Vehículo</th>
                  <th style={tableHeaderStyle()}>Posiciones</th>
                  <th style={tableHeaderStyle()}>Distancia</th>
                  <th style={tableHeaderStyle()}>Velocidad Máx / Prom</th>
                  <th style={tableHeaderStyle()}>Hora</th>
                  <th style={tableHeaderStyle()}>Acción</th>
                </>
              )}
              {tab === 'events' && (
                <>
                  <th style={tableHeaderStyle()}>Vehículo</th>
                  <th style={tableHeaderStyle()}>Tipo</th>
                  <th style={tableHeaderStyle()}>Categoría</th>
                  <th style={tableHeaderStyle()}>Hora</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {/* ── Mileage rows ── */}
            {tab === 'mileage' && reportData.map((row: any, i: number) => {
              const device = deviceMap.get(row.deviceId);
              return (
                <tr key={row.deviceId ?? i} className="report-row" style={{ backgroundColor: 'rgba(15, 23, 42, 0.02)' }}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <IconMap size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit', fontSize: '0.8125rem' }}>{device?.name ?? '—'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>TID: {device?.uniqueId ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Outfit', color: '#6366f1', letterSpacing: '-0.02em' }}>{((row.distance ?? 0) / 1000).toFixed(2)}</span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginLeft: '0.25rem' }}>KM</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                        <IconSpeed size={13} style={{ color: '#fbbf24', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                        {((row.maxSpeed ?? 0) * 1.852).toFixed(1)} km/h
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginLeft: '1.125rem' }}>Prom: {((row.averageSpeed ?? 0) * 1.852).toFixed(1)} km/h</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.75rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{(row.spentFuel ?? 0).toFixed(1)} L</span>
                  </td>
                </tr>
              );
            })}

            {/* ── Trips rows ── */}
            {tab === 'trips' && reportData.map((row: any, i: number) => {
              const device = deviceMap.get(row.deviceId);
              return (
                <tr key={row.deviceId ?? i} className="report-row" style={{ backgroundColor: 'rgba(15, 23, 42, 0.02)' }}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit', fontSize: '0.8125rem' }}>{device?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{row.startAddress ?? 'Sin dirección'}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, fontFamily: 'Outfit', color: '#6366f1' }}>{((row.distance ?? 0) / 1000).toFixed(2)}</span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginLeft: '0.25rem' }}>KM</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{((row.maxSpeed ?? 0) * 1.852).toFixed(1)} km/h</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={pillStyle('#3b82f6')}>
                      <IconActivity size={12} /> {((row.duration ?? 0) / 60).toFixed(0)} min
                    </div>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.75rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.startTime ? new Date(row.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{row.startTime ? new Date(row.startTime).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''}</div>
                  </td>
                </tr>
              );
            })}

            {/* ── Stops rows ── */}
            {tab === 'stops' && reportData.map((row: any, i: number) => {
              const device = deviceMap.get(row.deviceId);
              return (
                <tr key={row.deviceId ?? i} className="report-row" style={{ backgroundColor: 'rgba(15, 23, 42, 0.02)' }}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit', fontSize: '0.8125rem' }}>{device?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{row.address ?? 'Sin dirección'}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={pillStyle('#f59e0b')}>
                      <IconPause size={12} /> {((row.duration ?? 0) / 60).toFixed(0)} min
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.address ?? '—'}</span>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.75rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.startTime ? new Date(row.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{row.startTime ? new Date(row.startTime).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''}</div>
                  </td>
                </tr>
              );
            })}

            {/* ── Route summary rows ── */}
            {tab === 'route' && routeSummary.map((row, i: number) => {
              const device = deviceMap.get(row.deviceId);
              return (
                <tr key={row.deviceId ?? i} className="report-row" style={{ backgroundColor: 'rgba(15, 23, 42, 0.02)' }}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit', fontSize: '0.8125rem' }}>{device?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>TID: {device?.uniqueId ?? '—'}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{row.positions}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, fontFamily: 'Outfit', color: '#6366f1' }}>{(row.distance / 1000).toFixed(2)}</span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, marginLeft: '0.25rem' }}>KM</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{row.maxSpeed.toFixed(1)} km/h</span>
                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Prom: {row.avgSpeed.toFixed(1)} km/h</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.startTime ? new Date(row.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{row.startTime ? new Date(row.startTime).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''}</div>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.75rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <button
                      onClick={() => handleViewRouteOnMap(reportData.filter((p: any) => p.deviceId === row.deviceId))}
                      style={{
                        padding: '0.3rem 0.625rem',
                        borderRadius: '0.625rem',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        background: 'rgba(99, 102, 241, 0.08)',
                        color: '#6366f1',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        fontFamily: 'Outfit, sans-serif',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <IconMap size={13} /> Ver en Mapa
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* ── Events rows ── */}
            {tab === 'events' && reportData.map((row: any, i: number) => {
              const device = deviceMap.get(row.deviceId);
              const config = getAlertConfig(row.type);
              const catColor = config.color ?? '#6b7280';
              return (
                <tr key={row.id ?? i} className="report-row" style={{ backgroundColor: 'rgba(15, 23, 42, 0.02)' }}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '0.75rem', borderBottomLeftRadius: '0.75rem', borderLeft: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit', fontSize: '0.8125rem' }}>{device?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>TID: {device?.uniqueId ?? '—'}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>{config.icon}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: catColor, fontFamily: 'Outfit' }}>{config.label ?? row.type}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={pillStyle(catColor)}>
                      {categoryLabel[config.category] ?? config.category}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '0.75rem', borderBottomRightRadius: '0.75rem', borderRight: '1px solid rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.eventTime ? new Date(row.eventTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{row.eventTime ? new Date(row.eventTime).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : ''}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.1); border-radius: 10px; }
        .report-row:hover {
          background-color: rgba(99, 102, 241, 0.04) !important;
          transform: scale(1.002) translateX(2px);
        }
      `}</style>
    </div>
  );
}

export default ReportsPage;