import { useEffect, useRef } from 'react';
import { useMapInstance, useMapStyleVersion } from '../context';
import { useDevices } from '@features/devices/hooks/useDevices';
import { usePositions } from '@features/positions/hooks/usePositions';
import { useMapStore } from '../store';
import { useUnitConversion } from '@shared/hooks/useUnitConversion';

// Source de todos los vehículos (sin seleccionar)
const ALL_SOURCE_ID = 'devices-all-source';
const ALL_LAYER_ID = 'devices-all-layer';

// Source exclusiva del vehículo seleccionado — siempre encima, siempre visible
const SELECTED_SOURCE_ID = 'device-selected-source';
const SELECTED_LAYER_ID = 'device-selected-layer';

// Colores de estado "Premium"
const STATUS_COLORS: Record<string, string> = {
  moving: '#10b981',      // Esmeralda - En movimiento
  online_acc: '#f59e0b',  // Ámbar - Detenido con motor encendido
  online_idle: '#6366f1', // Indigo - Online pero quieto (motor OFF)
  speeding: '#ef4444',    // ROJO NEÓN - Exceso de velocidad
  offline: '#94a3b8',     // Slate - Sin conexión
  unknown: '#64748b',     // Gris - Desconocido
};

/**
 * Generador de SVG "Smart": Aerodinámico, con gradientes y detección de trompa.
 */
const SMART_ARROW_SVG = (color: string, selected = false, isSpeeding = false) => `
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow-${selected}-${isSpeeding}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${isSpeeding ? '5' : '3'}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="grad-${color.replace('#', '')}" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
      <stop stop-color="${color}" />
      <stop offset="1" stop-color="${color}" stop-opacity="0.75" />
    </linearGradient>
  </defs>
  
  ${isSpeeding ? `
    <!-- HALO NEÓN ROJO PARA EXCESO -->
    <circle cx="32" cy="32" r="28" fill="#ef4444" fill-opacity="0.4" filter="url(#glow-true-true)" />
  ` : ''}

  ${selected ? `
    <!-- Anillo de luz para selección -->
    <circle cx="32" cy="32" r="28" stroke="white" stroke-width="2" stroke-opacity="0.8" stroke-dasharray="4 2" />
    <circle cx="32" cy="32" r="30" fill="${color}" fill-opacity="0.15" />
  ` : ''}

  <!-- Cuerpo de la flecha/vehículo -->
  <path d="M32 8L52 52L32 44L12 52L32 8Z" fill="url(#grad-${color.replace('#', '')})" 
        stroke="white" stroke-width="3" stroke-linejoin="round" 
        ${selected ? `filter="url(#glow-${selected})"` : ''} />
  
  <!-- Detalle de dirección (trompa brillante) -->
  <path d="M32 8L44 36L32 30L20 36L32 8Z" fill="white" fill-opacity="0.25" />
</svg>
`;

async function generateIcon(color: string, selected = false, isSpeeding = false): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const svg = SMART_ARROW_SVG(color, selected, isSpeeding);
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.src = url;
  });
}

/**
 * Función pura para determinar el "Smart Status" visual
 */
function getSmartStatus(deviceStatus: string, speed: number, attributes: any): string {
  if (deviceStatus !== 'online') return deviceStatus || 'unknown';
  
  // LÓGICA DE EXCESO DE VELOCIDAD (> 80 km/h)
  if (speed > 80) return 'speeding';

  const ignition = attributes?.ignition ?? attributes?.acc;
  if (speed > 0.5) return 'moving';
  if (ignition === true) return 'online_acc';
  return 'online_idle';
}

export function DeviceMarkers() {
  const map = useMapInstance();
  const { data: devices = [] } = useDevices();
  const { data: positions = [] } = usePositions();
  const { formatSpeed } = useUnitConversion();
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const setSelectedDevice = useMapStore((s) => s.setSelectedDevice);
  const flyToDevice = useMapStore((s) => s.flyToDevice);
  const initializedRef = useRef(false);
  const styleVersion = useMapStyleVersion();

  const positionMap = new Map(positions.map((p) => [p.deviceId, p]));

  // ─── Reset cuando cambia el estilo del mapa ───
  useEffect(() => {
    if (initializedRef.current) {
      initializedRef.current = false;
      // Forzar re-inicialización limpiando capas viejas
      if (map.getStyle()) {
        [SELECTED_LAYER_ID, ALL_LAYER_ID].forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
        [SELECTED_SOURCE_ID, ALL_SOURCE_ID].forEach(s => { if (map.getSource(s)) map.removeSource(s); });
        Object.keys(STATUS_COLORS).forEach((status) => {
          [`smart-icon-${status}`, `smart-icon-selected-${status}`].forEach((id) => {
            if (map.hasImage(id)) map.removeImage(id);
          });
        });
      }
    }
  }, [styleVersion, map]);

  // ─── Inicialización: registrar íconos + crear sources/layers ───
  useEffect(() => {
    if (!map || initializedRef.current) return;

    let cancelled = false;

    (async () => {
      // 1. Registrar todos los íconos de estado
      for (const status of Object.keys(STATUS_COLORS)) {
        if (cancelled) return;
        const color = STATUS_COLORS[status];
        const isSpeeding = status === 'speeding';

        const normalId = `smart-icon-${status}`;
        if (!map.hasImage(normalId)) {
          const img = await generateIcon(color, false, isSpeeding);
          if (!cancelled && map.getStyle() && !map.hasImage(normalId)) {
            map.addImage(normalId, img);
          }
        }

        const selectedId = `smart-icon-selected-${status}`;
        if (!map.hasImage(selectedId)) {
          const img = await generateIcon(color, true, isSpeeding);
          if (!cancelled && map.getStyle() && !map.hasImage(selectedId)) {
            map.addImage(selectedId, img);
          }
        }
      }

      if (cancelled || initializedRef.current || !map.getStyle()) return;

      // 2. Source para TODOS los vehículos
      map.addSource(ALL_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: ALL_LAYER_ID,
        type: 'symbol',
        source: ALL_SOURCE_ID,
        layout: {
          'icon-image': ['concat', 'smart-icon-', ['get', 'smartStatus']],
          'icon-size': 0.55,
          'icon-rotate': ['get', 'course'],
          'icon-allow-overlap': true,
          'icon-rotation-alignment': 'map',
          // ETIQUETA SMART: Nombre + Velocidad en zoom alto
          'text-field': [
            'step', 
            ['zoom'], 
            '', 
            10, 
            ['get', 'label']
          ],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-anchor': 'top',
          'text-offset': [0, 1.4],
          'text-allow-overlap': false,
          'text-letter-spacing': 0.05,
        },
        paint: {
          'text-color': '#1e293b',
          'text-halo-color': 'rgba(255, 255, 255, 0.95)',
          'text-halo-width': 2.5,
        },
      });

      // 3. Source para el seleccionado
      map.addSource(SELECTED_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: SELECTED_LAYER_ID,
        type: 'symbol',
        source: SELECTED_SOURCE_ID,
        layout: {
          'icon-image': ['concat', 'smart-icon-selected-', ['get', 'smartStatus']],
          'icon-size': 0.8,
          'icon-rotate': ['get', 'course'],
          'icon-allow-overlap': true,
          'icon-rotation-alignment': 'map',
          'text-field': ['get', 'label'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 13,
          'text-anchor': 'top',
          'text-offset': [0, 1.5],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 3,
        },
      });

      // Eventos
      map.on('click', ALL_LAYER_ID, (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        setSelectedDevice(props.deviceId);
        flyToDevice(props.deviceId, [e.lngLat.lng, e.lngLat.lat], 17);
      });

      map.on('mouseenter', ALL_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', ALL_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });

      initializedRef.current = true;
    })();

    return () => {
      cancelled = true;
      if (map.getStyle()) {
        [SELECTED_LAYER_ID, ALL_LAYER_ID].forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
        [SELECTED_SOURCE_ID, ALL_SOURCE_ID].forEach(s => { if (map.getSource(s)) map.removeSource(s); });
        Object.keys(STATUS_COLORS).forEach((status) => {
          [`smart-icon-${status}`, `smart-icon-selected-${status}`].forEach((id) => {
            if (map.hasImage(id)) map.removeImage(id);
          });
        });
      }
      initializedRef.current = false;
    };
  }, [map, styleVersion]);

  // ─── Actualización de datos ───
  useEffect(() => {
    if (!map || !initializedRef.current || !map.getStyle()) return;

    const allSource = map.getSource(ALL_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    const selectedSource = map.getSource(SELECTED_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!allSource || !selectedSource) return;

    const features = devices
        .filter(d => !d.disabled)
        .map(d => {
            const pos = positionMap.get(d.id ?? 0);
            if (!pos?.latitude || !pos?.longitude) return null;

            const speed = pos.speed ?? 0;
            const smartStatus = getSmartStatus(d.status || 'unknown', speed, pos.attributes);
            const speedFormatted = speed > 0 ? formatSpeed(speed, 0) : null;
            const label = speedFormatted ? `${d.name} • ${speedFormatted}` : d.name;

            return {
                type: 'Feature' as const,
                properties: {
                    deviceId: d.id,
                    name: d.name,
                    smartStatus,
                    label,
                    course: pos.course ?? 0,
                    isSelected: d.id === selectedDeviceId
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [pos.longitude, pos.latitude]
                }
            };
        })
        .filter(Boolean) as any[];

    const allFeatures = features.filter(f => f.properties.deviceId !== selectedDeviceId);
    const selectedFeature = features.find(f => f.properties.deviceId === selectedDeviceId);

    allSource.setData({ type: 'FeatureCollection', features: allFeatures });
    selectedSource.setData({ 
        type: 'FeatureCollection', 
        features: selectedFeature ? [selectedFeature] : [] 
    });

  }, [map, devices, positions, selectedDeviceId]);

  return null;
}
