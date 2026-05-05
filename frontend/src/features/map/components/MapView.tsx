import { useRef, useEffect, useState } from 'react';
import { useMemo } from 'react';
import { Map, LngLatBounds } from 'maplibre-gl';
import type { ReactNode } from 'react';
import { useMapStore } from '@features/map/store';
import { usePositions } from '@features/positions/hooks/usePositions';
import { useDevices } from '@features/devices/hooks/useDevices';
import { useServer } from '@features/settings/hooks/useServer';
import { resolveMapStyle } from '@shared/lib/map-styles';
import { IconCrosshair, IconLink } from '@shared/ui/icons';
import { MapContext } from '../context';

export function MapView({ children }: { children?: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const fromMapRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);

  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const selectedDeviceId = useMapStore((s) => s.selectedDeviceId);
  const { data: server } = useServer();
  const { data: devices = [] } = useDevices();

  // Inicializar el mapa una sola vez cuando el container esté listo
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const style = resolveMapStyle(server?.map, server?.mapUrl);
    const { center: c, zoom: z } = useMapStore.getState();

    const map = new Map({
      container: el,
      style,
      center: c,
      zoom: z,
      pitch: 0,
      antialias: true,
    });

    map.on('load', () => setMapReady(true));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando el server carga, aplicar config si el mapa está en defaults
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !server) return;

    const store = useMapStore.getState();
    const isDefaultCenter = store.center[0] === 0 && store.center[1] === 0;

    // Aplicar estilo del mapa si el server tiene uno configurado
    const configuredStyle = resolveMapStyle(server?.map, server?.mapUrl);
    const defaultStyle = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

    if (configuredStyle !== defaultStyle) {
      map.setStyle(configuredStyle);
      // Incrementar versión para que DeviceMarkers se reinicialice
      setStyleVersion((v) => v + 1);
    }

    // Aplicar coordenadas si el server tiene valores y el mapa no fue movido
    const serverHasCoords = server.latitude !== 0 && server.longitude !== 0;
    if (isDefaultCenter && serverHasCoords) {
      const newCenter: [number, number] = [server.longitude!, server.latitude!];
      useMapStore.getState().setCenter(newCenter);
      map.setCenter(newCenter);
    }

    if (store.zoom === 2 && server.zoom && server.zoom !== 0) {
      useMapStore.getState().setZoom(server.zoom);
      map.setZoom(server.zoom);
    }
  }, [server]);

  const ctxValue = useMemo(() => ({ map: mapRef.current, styleVersion }), [mapRef.current, styleVersion]);

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
      
      {/* Botón Ver Todos */}
      {mapReady && positions.length > 0 && (
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            useMapStore.getState().setSelectedDevice(null);
            const bounds = new LngLatBounds();
            let hasValid = false;
            for (const p of positions) {
              if (p.latitude && p.longitude) {
                bounds.extend([p.longitude, p.latitude]);
                hasValid = true;
              }
            }
            if (hasValid) {
              map.fitBounds(bounds, {
                padding: { top: 60, bottom: 60, left: 60, right: 60 },
                maxZoom: 14,
                essential: true,
              });
            }
          }}
          title="Ver todos los vehículos"
          style={{
            position: 'absolute',
            top: 52,
            right: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: '0.625rem',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.1)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.1)'; }}
        >
          <IconCrosshair size={16} />
        </button>
      )}

      {/* Botón Compartir */}
      <button
        onClick={() => {
          const ids: number[] = [];
          if (selectedDeviceId) {
            ids.push(selectedDeviceId);
          } else {
            for (const d of devices) {
              if (d.id != null) ids.push(d.id);
            }
          }
          if (ids.length === 0) return;
          const url = `${window.location.origin}/?vehiculos=${ids.join(',')}`;
          navigator.clipboard.writeText(url).then(() => {
            const el = document.getElementById('share-feedback');
            if (el) { el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0'; }, 2000); }
          });
        }}
        title="Compartir ubicación"
        style={{
          position: 'absolute',
          top: 92,
          right: 12,
          zIndex: 10,
          width: 36,
          height: 36,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          borderRadius: '0.625rem',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          color: '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.1)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.92)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.1)'; }}
      >
        <IconLink size={16} />
      </button>
      <div id="share-feedback" style={{
        position: 'absolute', top: 96, right: 54, zIndex: 10,
        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        backgroundColor: 'rgba(16, 185, 129, 0.9)', color: '#fff',
        fontFamily: 'Outfit, sans-serif', opacity: 0, transition: 'opacity 0.3s',
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>Link copiado</div>

      {mapReady && mapRef.current && (
        <MapContext.Provider value={ctxValue}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
}
