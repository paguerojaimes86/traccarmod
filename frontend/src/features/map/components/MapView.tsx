import { useRef, useEffect, useState } from 'react';
import { Map, LngLatBounds } from 'maplibre-gl';
import type { ReactNode } from 'react';
import { useMapStore } from '@features/map/store';
import { usePositions } from '@features/positions/hooks/usePositions';
import { MapContext } from '../context';

export function MapView({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const fromMapRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const { center: c, zoom: z } = useMapStore.getState();

    const map = new Map({
      container: el,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Voyager Full Color
      center: c,
      zoom: z,
      pitch: 0,
      antialias: true
    });

    map.on('load', () => {
      setMapReady(true);
      // Sin atenuación de etiquetas por pedido del usuario (quieren colores)
    });

    map.on('moveend', () => {
      const mc = map.getCenter();
      const mz = map.getZoom();
      fromMapRef.current = true;
      useMapStore.getState().setCenter([mc.lng, mc.lat]);
      useMapStore.getState().setZoom(mz);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const followMode = useMapStore((s) => s.followMode);
  const setFollowMode = useMapStore((s) => s.setFollowMode);
  const { data: positions = [] } = usePositions();

  // ─── Desactivar Seguimiento al arrastrar manualmente ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onDrag = () => setFollowMode(false);
    map.on('dragstart', onDrag);
    return () => {
      map.off('dragstart', onDrag);
    };
  }, [mapReady, setFollowMode]);

  // ─── Cámara Inteligente: Seguimiento en tiempo real ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (fromMapRef.current) {
      fromMapRef.current = false;
      return;
    }

    if (selectedDeviceId) {
      const selectedPos = positions.find(p => p.deviceId === selectedDeviceId);
      
      // MODO SEGUIMIENTO ACTIVO: Persiguiendo al camión
      if (followMode && selectedPos?.latitude && selectedPos?.longitude) {
        map.easeTo({
            center: [selectedPos.longitude, selectedPos.latitude],
            duration: 1500,
            essential: true
        });
      } else if (!followMode) {
        // Vuelo inicial al seleccionar (con 3D pitch)
        map.flyTo({ 
            center, 
            zoom, 
            pitch: 45, 
            duration: 2500, 
            essential: true, 
            padding: { bottom: 190 } 
        });
      }
    } else {
      // RESET A VISTA CENITAL SI NO HAY SELECCIÓN
      map.easeTo({ pitch: 0, duration: 1500 });
      
      if (positions.length > 0) {
        // ZOOM A TODA LA FLOTA (fitBounds)
        const bounds = new LngLatBounds();
        let hasValidCoords = false;
        
        positions.forEach((p) => {
          if (p.latitude && p.longitude) {
            bounds.extend([p.longitude, p.latitude]);
            hasValidCoords = true;
          }
        });

        if (hasValidCoords) {
          map.fitBounds(bounds, { 
              padding: { top: 100, bottom: 100, left: 350, right: 100 }, 
              maxZoom: 14, 
              essential: true 
          });
        }
      }
    }
  }, [center, zoom, mapReady, selectedDeviceId, followMode, positions]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mapReady]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {mapReady && mapRef.current && (
        <MapContext.Provider value={mapRef.current}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
}
