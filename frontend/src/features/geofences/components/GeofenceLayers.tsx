import { useEffect, useRef } from 'react';
import { useMapInstance } from '@features/map/context';
import { useGeofences } from '@features/geofences/hooks/useGeofences';
import { wktToMapLibreSourceUniversal } from '@shared/lib/wkt';

const GEOFENCE_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1',
];

interface GeofenceLayersProps {
  visible?: boolean;
}

export function GeofenceLayers({ visible = true }: GeofenceLayersProps) {
  const map = useMapInstance();
  const { data: geofences = [] } = useGeofences();
  const addedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!map || !visible) return;

    geofences.forEach((gf, i) => {
      if (!gf.area || !gf.id) return;
      if ((gf.attributes as Record<string, string>)?.isRoute === 'true') return;

      const geojson = wktToMapLibreSourceUniversal(gf.area, {
        id: gf.id,
        name: gf.name,
      });
      if (!geojson) return;

      const sourceId = `geofence-src-${gf.id}`;
      const fillLayerId = `geofence-fill-${gf.id}`;
      const lineLayerId = `geofence-line-${gf.id}`;

      if (addedRef.current.has(sourceId)) return;

      const color = GEOFENCE_COLORS[i % GEOFENCE_COLORS.length];

      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson as unknown as GeoJSON.FeatureCollection,
        });

        map.addLayer({
          id: fillLayerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': color,
            'fill-opacity': 0.15,
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': color,
            'line-width': 2,
            'line-opacity': 0.6,
          },
        });

        addedRef.current.add(sourceId);
      } catch {
        // source/layer may already exist
      }
    });

    return () => {
      addedRef.current.forEach((sourceId) => {
        const id = sourceId.replace('geofence-src-', '');
        const fillId = `geofence-fill-${id}`;
        const lineId = `geofence-line-${id}`;
        try {
          if (map.getLayer(fillId)) map.removeLayer(fillId);
          if (map.getLayer(lineId)) map.removeLayer(lineId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {
          // ignore cleanup errors
        }
      });
      addedRef.current.clear();
    };
  }, [map, geofences, visible]);

  return null;
}
