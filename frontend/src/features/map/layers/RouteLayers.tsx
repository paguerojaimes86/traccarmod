import { useEffect, useRef } from 'react';
import { Popup, type MapMouseEvent } from 'maplibre-gl';
import { useMapInstance } from '@features/map/context';
import { useRoutes, type Route } from '@features/map/hooks/useRoutes';

const SUBIDA_COLOR = '#3b82f6';
const BAJADA_COLOR = '#ef4444';
const DEFAULT_COLOR = '#9ca3af';

function getRouteColor(route: Route): string {
  if (route.routeType === 'subida') return SUBIDA_COLOR;
  if (route.routeType === 'bajada') return BAJADA_COLOR;
  if (route.routeColor) return route.routeColor;
  return DEFAULT_COLOR;
}

interface RouteLayersProps {
  visible?: boolean;
}

export function RouteLayers({ visible = true }: RouteLayersProps) {
  const map = useMapInstance();
  const { data: routes = [] } = useRoutes();
  const addedRef = useRef<Set<string>>(new Set());
  const handlersRef = useRef<Map<string, { click: (e: MapMouseEvent) => void; enter: () => void; leave: () => void }>>(new Map());

  useEffect(() => {
    if (!map || !visible) return;

    routes.forEach((route) => {
      const sourceId = `route-src-${route.id}`;
      const lineLayerId = `route-line-${route.id}`;

      if (addedRef.current.has(sourceId)) return;

      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [route.geoJSON as unknown as GeoJSON.Feature],
      };

      const color = getRouteColor(route);

      try {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
        });

        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': color,
            'line-width': 3,
            'line-opacity': 0.8,
          },
        });

        // Etiqueta con el nombre de la ruta sobre la línea
        const labelLayerId = `route-label-${route.id}`;
        map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'symbol-placement': 'line',
            'text-field': (route.routeLabel ?? '').toUpperCase(),
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-letter-spacing': 0.04,
            'text-offset': [0, -1.2],
          },
          paint: {
            'text-color': color,
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });

        // Click handler: show popup with route label
        const clickHandler = (e: MapMouseEvent) => {
          const coordinates = e.lngLat;
          new Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${route.routeLabel}</strong>`)
            .addTo(map);
        };

        const enterHandler = () => {
          map.getCanvas().style.cursor = 'pointer';
        };

        const leaveHandler = () => {
          map.getCanvas().style.cursor = '';
        };

        map.on('click', lineLayerId, clickHandler);
        map.on('mouseenter', lineLayerId, enterHandler);
        map.on('mouseleave', lineLayerId, leaveHandler);

        handlersRef.current.set(lineLayerId, { click: clickHandler, enter: enterHandler, leave: leaveHandler });
        addedRef.current.add(sourceId);
      } catch {
        // source/layer may already exist
      }
    });

    return () => {
      addedRef.current.forEach((sourceId) => {
        const id = sourceId.replace('route-src-', '');
        const lineId = `route-line-${id}`;
        const labelId = `route-label-${id}`;
        const handlers = handlersRef.current.get(lineId);
        try {
          if (handlers) {
            map.off('click', lineId, handlers.click);
            map.off('mouseenter', lineId, handlers.enter);
            map.off('mouseleave', lineId, handlers.leave);
            handlersRef.current.delete(lineId);
          }
          if (map.getLayer(labelId)) map.removeLayer(labelId);
          if (map.getLayer(lineId)) map.removeLayer(lineId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {
          // ignore cleanup errors
        }
      });
      addedRef.current.clear();
    };
  }, [map, routes, visible]);

  if (!visible || routes.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 12,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(8px)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11,
        lineHeight: 1.8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1,
        pointerEvents: 'none',
        border: '1px solid rgba(15, 23, 42, 0.06)',
      }}
    >
      {routes.map((route) => (
        <div key={route.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 18,
              height: 3,
              borderRadius: 2,
              background: getRouteColor(route),
            }}
          />
          <span style={{ fontWeight: 700, letterSpacing: '0.04em', color: '#0f172a' }}>
            {(route.routeLabel ?? '').toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}