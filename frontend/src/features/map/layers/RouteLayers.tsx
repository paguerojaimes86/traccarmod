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
        const handlers = handlersRef.current.get(lineId);
        try {
          if (handlers) {
            map.off('click', lineId, handlers.click);
            map.off('mouseenter', lineId, handlers.enter);
            map.off('mouseleave', lineId, handlers.leave);
            handlersRef.current.delete(lineId);
          }
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
        left: 12,
        background: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
        lineHeight: 1.6,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {routes.map((route) => (
        <div key={route.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 3,
              borderRadius: 2,
              background: getRouteColor(route),
            }}
          />
          <span>{route.routeLabel}</span>
        </div>
      ))}
    </div>
  );
}