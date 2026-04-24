import { useEffect, useRef } from 'react';
import { useMapInstance } from '@features/map/context';
import { LngLatBounds, type GeoJSONSource } from 'maplibre-gl';
import type { Position } from '@shared/api/types.models';

const SOURCE_ID = 'history-source';
const LINE_GLOW_LAYER_ID = 'history-line-glow';
const LINE_BASE_LAYER_ID = 'history-line-base';
const LINE_CORE_LAYER_ID = 'history-line-core';
const POINT_LAYER_ID = 'history-points';
const CURRENT_LAYER_ID = 'history-current';
const HISTORY_ARROW_ICON = 'history-arrow';

const NEON_CYAN = '#00f2ff';

const HISTORY_ARROW_SVG = `
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 4L38 40L24 32L10 40L24 4Z" fill="${NEON_CYAN}" stroke="white" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="24" cy="32" r="4" fill="white" opacity="0.8"/>
</svg>
`;

async function loadHistoryArrowIcon(): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([HISTORY_ARROW_SVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.src = url;
  });
}

export type HistoryPosition = Pick<Position, 'longitude' | 'latitude' | 'course'>;

interface HistoryPathProps {
  positions: HistoryPosition[];
}

export function HistoryPath({ positions }: HistoryPathProps) {
  const map = useMapInstance();
  const addedRef = useRef(false);
  const positionsRef = useRef<HistoryPosition[]>(positions);
  positionsRef.current = positions;

  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    (async () => {
      if (!map.hasImage(HISTORY_ARROW_ICON)) {
        const img = await loadHistoryArrowIcon();
        if (cancelled) return;
        if (!map.hasImage(HISTORY_ARROW_ICON)) map.addImage(HISTORY_ARROW_ICON, img);
      }

      if (cancelled || addedRef.current) return;

      try {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          lineMetrics: true, // Habilita gradientes y efectos de línea avanzados
          data: { type: 'FeatureCollection', features: [] },
        });

        // 1. CAPA DE GLOW (Brillo Neón Externo)
        map.addLayer({
          id: LINE_GLOW_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          filter: ['==', ['geometry-type'], 'LineString'],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': NEON_CYAN,
            'line-width': 8,
            'line-blur': 6,
            'line-opacity': 0.6
          },
        });

        // 2. CAPA BASE (Color Neón Sólido)
        map.addLayer({
          id: LINE_BASE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          filter: ['==', ['geometry-type'], 'LineString'],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': NEON_CYAN,
            'line-width': 3,
            'line-opacity': 0.9
          },
        });

        // 3. CAPA CORE (Núcleo de Energía Blanco)
        map.addLayer({
          id: LINE_CORE_LAYER_ID,
          type: 'line',
          source: SOURCE_ID,
          filter: ['==', ['geometry-type'], 'LineString'],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 1,
            'line-opacity': 0.8
          },
        });

        // 4. BREADCRUMBS TÁCTICOS (Puntos de posición)
        map.addLayer({
          id: POINT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['all',
            ['==', ['geometry-type'], 'Point'],
            ['!', ['boolean', ['get', 'current'], false]],
          ],
          paint: {
            'circle-radius': 2.5,
            'circle-color': NEON_CYAN,
            'circle-opacity': 0.4,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.2
          },
        });

        // 5. ICONO DE SEGUIMIENTO (Flecha de Replay)
        map.addLayer({
          id: CURRENT_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['all',
            ['==', ['geometry-type'], 'Point'],
            ['boolean', ['get', 'current'], false],
          ],
          layout: {
            'icon-image': HISTORY_ARROW_ICON,
            'icon-size': 0.6,
            'icon-rotate': ['get', 'course'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
          },
        });
      } catch {
        return;
      }

      addedRef.current = true;

      // Seed inicial: ya tenemos posiciones cuando montamos (fix race condition)
      if (!cancelled) {
        const source = map.getSource(SOURCE_ID) as GeoJSONSource;
        source.setData(buildGeoJSON(positionsRef.current));
      }
    })();

    // ─── Cleanup: se ejecuta al desmontar ──────────────────────────────
    return () => {
      cancelled = true;
      addedRef.current = false;
      try {
        if (map.getLayer(CURRENT_LAYER_ID))   map.removeLayer(CURRENT_LAYER_ID);
        if (map.getLayer(POINT_LAYER_ID))     map.removeLayer(POINT_LAYER_ID);
        if (map.getLayer(LINE_CORE_LAYER_ID))  map.removeLayer(LINE_CORE_LAYER_ID);
        if (map.getLayer(LINE_BASE_LAYER_ID))  map.removeLayer(LINE_BASE_LAYER_ID);
        if (map.getLayer(LINE_GLOW_LAYER_ID))  map.removeLayer(LINE_GLOW_LAYER_ID);
        if (map.getSource(SOURCE_ID))         map.removeSource(SOURCE_ID);
        if (map.hasImage(HISTORY_ARROW_ICON)) map.removeImage(HISTORY_ARROW_ICON);
      } catch { /* mapa destruido o layers ya removidos */ }
    };
  }, [map]);

  // ─── Actualización de datos ─────────────────────────────────────────────
  useEffect(() => {
    if (!map || !addedRef.current) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;

    const geojson = buildGeoJSON(positions);
    source.setData(geojson);

    // Ajustar bounds solo cuando hay ruta
    const coords = positions
      .filter((p) => p.longitude != null && p.latitude != null)
      .map((p) => [p.longitude!, p.latitude!]);

    if (coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new LngLatBounds(coords[0] as [number, number], coords[1] as [number, number]),
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
    }
  }, [map, positions]);

  return null;
}

// ─── Utilidad pura — construye GeoJSON desde el array de posiciones ──────
function buildGeoJSON(positions: HistoryPosition[]): GeoJSON.FeatureCollection {
  const coords = positions
    .filter((p) => p.longitude != null && p.latitude != null)
    .map((p) => [p.longitude!, p.latitude!]);

  if (coords.length < 2) return { type: 'FeatureCollection', features: [] };

  const lastPos  = positions[positions.length - 1];
  const lastCoord = coords[coords.length - 1];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
      {
        type: 'Feature',
        properties: { current: true, course: lastPos?.course ?? 0 },
        geometry: { type: 'Point', coordinates: lastCoord },
      },
    ],
  };
}
