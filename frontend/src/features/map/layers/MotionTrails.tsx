import { useEffect, useRef } from 'react';
import { useMapInstance } from '../context';
import { usePositions } from '@features/positions/hooks/usePositions';

const TRAILS_SOURCE_ID = 'motion-trails-source';
const TRAILS_LAYER_ID = 'motion-trails-layer';
const MAX_TRAIL_POINTS = 12; // Un rastro suave de los últimos 12 reportes

/**
 * Componente que gestiona "Estelas de Polvo Estelar" (Motion Trails)
 * Acumula coordenadas en caliente para dar contexto de trayectoria.
 */
export function MotionTrails() {
  const map = useMapInstance();
  const { data: positions = [] } = usePositions();
  
  // Guardamos los rastros por deviceId: [ [lng, lat], ... ]
  const trailBufferRef = useRef<Map<number, number[][]>>(new Map());
  const initializedRef = useRef(false);

  // ─── Inicialización: Crear source y layer ───
  useEffect(() => {
    if (!map || initializedRef.current) return;

    if (map.getStyle()) {
      map.addSource(TRAILS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        lineMetrics: true, // Crucial para los gradientes en líneas
      });

      map.addLayer({
        id: TRAILS_LAYER_ID,
        type: 'line',
        source: TRAILS_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981', // Verde esmeralda vibrante para mapa colorido
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 1.5,
            16, 5
          ],
          'line-opacity': 0.7, // Mantenemos opacidad alta
          'line-gradient': [
            'interpolate', ['linear'], ['line-progress'],
            0, 'rgba(16, 185, 129, 0)',   
            0.5, 'rgba(16, 185, 129, 0.6)',
            1, 'rgba(16, 185, 129, 1)'    
          ]
        }
      });
      initializedRef.current = true;
    }

    return () => {
      if (map.getStyle()) {
        if (map.getLayer(TRAILS_LAYER_ID)) map.removeLayer(TRAILS_LAYER_ID);
        if (map.getSource(TRAILS_SOURCE_ID)) map.removeSource(TRAILS_SOURCE_ID);
      }
      initializedRef.current = false;
    };
  }, [map]);

  // ─── Lógica de Acumulación y Dibujo ───
  useEffect(() => {
    if (!map || !initializedRef.current || positions.length === 0) return;

    const source = map.getSource(TRAILS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    // 1. Actualizamos el rastro para cada vehículo que reportó
    positions.forEach((p) => {
        if (!p.deviceId || !p.latitude || !p.longitude) return;
        
        let trail = trailBufferRef.current.get(p.deviceId) || [];
        const lastPoint = trail[trail.length - 1];

        // Solo agregamos si la posición cambió (para no duplicar puntos quietos)
        if (!lastPoint || (lastPoint[0] !== p.longitude || lastPoint[1] !== p.latitude)) {
            trail.push([p.longitude, p.latitude]);
            if (trail.length > MAX_TRAIL_POINTS) {
                trail.shift(); // Quitamos el punto más viejo
            }
            trailBufferRef.current.set(p.deviceId, trail);
        }
    });

    // 2. Convertimos a Features de GeoJSON
    const features = Array.from(trailBufferRef.current.entries())
        .filter(([_, trail]) => trail.length >= 2) // Necesitamos al menos 2 puntos para una línea
        .map(([deviceId, trail]) => ({
            type: 'Feature' as const,
            properties: { deviceId },
            geometry: {
                type: 'LineString' as const,
                coordinates: trail
            }
        }));

    // 3. Empujamos al mapa
    source.setData({
        type: 'FeatureCollection',
        features
    } as any);

  }, [map, positions]);

  return null;
}
