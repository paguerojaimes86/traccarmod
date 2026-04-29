import { useRef, useEffect, useState, useCallback, type CSSProperties } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TerraDraw, TerraDrawPolygonMode, TerraDrawCircleMode, TerraDrawSelectMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import { parse as parseWktString, stringify as stringifyGeoJSON } from 'wellknown';
import { parseCircleWkt, circleToPolygon, polygonToCircleWkt, isCircleWkt } from '@shared/lib/wkt';

interface GeofenceDrawMapProps {
  initialWkt?: string | null;
  onWktChange: (wkt: string | null) => void;
  center?: [number, number];
  zoom?: number;
}

// Inline raster style — avoids CORS issues with vector tile providers from localhost
const MAP_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.375rem',
  padding: '0.5rem',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(12px)',
  borderRadius: '0.75rem',
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
};

const btnBase: CSSProperties = {
  padding: '0.375rem 0.75rem',
  borderRadius: '0.5rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  fontFamily: 'Outfit, system-ui, sans-serif',
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '1px solid transparent',
  lineHeight: 1,
};

const activeBtn: CSSProperties = {
  ...btnBase,
  backgroundColor: 'rgba(99, 102, 241, 0.12)',
  color: '#6366f1',
  borderColor: 'rgba(99, 102, 241, 0.3)',
};

const inactiveBtn: CSSProperties = {
  ...btnBase,
  backgroundColor: 'rgba(15, 23, 42, 0.03)',
  color: '#64748b',
  borderColor: 'rgba(15, 23, 42, 0.06)',
};

const dangerBtn: CSSProperties = {
  ...btnBase,
  backgroundColor: 'rgba(239, 68, 68, 0.06)',
  color: '#ef4444',
  borderColor: 'rgba(239, 68, 68, 0.2)',
};

export function GeofenceDrawMap({
  initialWkt,
  onWktChange,
  center = [-77.0, -12.0],
  zoom = 10,
}: GeofenceDrawMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const readyRef = useRef(false); // true when map + draw are fully initialised
  const pendingWktRef = useRef<string | null>(null);
  const [activeMode, setActiveMode] = useState<string>('select');

  const handleWktChange = useCallback((wkt: string | null) => {
    onWktChange(wkt);
  }, [onWktChange]);

  /** Round coordinates to 6 decimal places to avoid TerraDraw precision rejection */
  function roundCoords(coords: any): any {
    if (typeof coords[0] === 'number') {
      return [
        Math.round(coords[0] * 1e6) / 1e6,
        Math.round(coords[1] * 1e6) / 1e6,
      ];
    }
    return coords.map((c: any) => roundCoords(c));
  }

/** Swap [lat, lon] to [lon, lat] in a coordinate array (recursive for nested) */
  function swapCoords(coords: any): any {
    if (typeof coords[0] === 'number') {
      // [lat, lon] → [lon, lat]
      return [coords[1], coords[0]];
    }
    return coords.map((c: any) => swapCoords(c));
  }

  /** Load a WKT geometry into the draw instance and fit the map bounds */
  const loadWktIntoDraw = useCallback((draw: TerraDraw, map: maplibregl.Map, wkt: string) => {
    const trimmed = wkt.trim();
    const upper = trimmed.toUpperCase();
    try {
      if (upper.startsWith('POLYGON')) {
        const geojson = parseWktString(trimmed);
        if (geojson) {
          // Traccar stores WKT as (lat lon) but wellknown interprets as (lon lat)
          // We need to swap: wellknown produces [first, second] where first=lat, second=lon
          const swapped = {
            ...geojson,
            coordinates: roundCoords(swapCoords((geojson as any).coordinates)),
          };
          console.log('[GeofenceDrawMap] parsed POLYGON, swapped+rounded coords sample:', JSON.stringify(swapped.coordinates[0][0]));
          const result = draw.addFeatures([{
            type: 'Feature',
            geometry: swapped as any,
            properties: { mode: 'polygon' },
          } as any]);
          console.log('[GeofenceDrawMap] addFeatures result:', result);
          
          // Select the feature immediately so editing handles appear
          if (result[0]?.valid && result[0].id) {
            draw.selectFeature(result[0].id);
            console.log('[GeofenceDrawMap] selected feature:', result[0].id);
          }
          
          draw.setMode('select');
          console.log('[GeofenceDrawMap] snapshot after setMode(select):', draw.getSnapshot().map(f => ({ id: f.id, type: f.geometry.type, selected: f.properties?.selected })));

          // fitBounds using swapped coords which are now [lon, lat]
          const coords = (swapped as any).coordinates[0];
          if (coords && coords.length > 0) {
            const lngs = coords.map((c: number[]) => c[0]);
            const lats = coords.map((c: number[]) => c[1]);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            map.fitBounds(
              [[minLng, minLat], [maxLng, maxLat]],
              { padding: 50, maxZoom: 15, duration: 500 }
            );
          }
        }
      } else if (isCircleWkt(trimmed)) {
        const circle = parseCircleWkt(trimmed);
        if (circle) {
          const poly = circleToPolygon(circle.center, circle.radius, 64);
          draw.addFeatures([{
            type: 'Feature',
            geometry: poly as any,
            properties: { mode: 'circle' },
          } as any]);
          draw.setMode('select');

          const coords = poly.coordinates[0];
          if (coords && coords.length > 0) {
            const lats = coords.map((c) => c[1]);
            const lngs = coords.map((c) => c[0]);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            map.fitBounds(
              [[minLng, minLat], [maxLng, maxLat]],
              { padding: 50, maxZoom: 15, duration: 500 }
            );
          }
        }
      }
    } catch {
      // invalid WKT, ignore
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Initialize map + TerraDraw once
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = new maplibregl.Map({
      container: el,
      style: MAP_STYLE,
      center,
      zoom,
      pitch: 0,
      antialias: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('style.load', () => {
      const adapter = new TerraDrawMapLibreGLAdapter({ map });

      const draw = new TerraDraw({
        adapter,
        modes: [
          new TerraDrawPolygonMode(),
          new TerraDrawCircleMode(),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: {
                    draggable: true,
                    midpoints: true,
                  },
                },
              },
              circle: {
                feature: {
                  draggable: true,
                },
              },
            } as any,
          }),
        ],
      });

      draw.start();
      draw.setMode('select');

      console.log('[GeofenceDrawMap] TerraDraw started, draw instance:', !!draw);

      draw.on('change', (_ids) => {
        // Only process changes that are actual edits, not selection changes
        const snapshot = draw.getSnapshot();
        // Filter out coordinate-point helper features that TerraDraw injects
        const realFeatures = snapshot.filter((f) => f.geometry.type !== 'Point');
        if (realFeatures.length === 0) {
          handleWktChange(null);
          return;
        }
        const feature = realFeatures[0];
        const geojson = feature.geometry;
        try {
          let wkt: string;
          if (feature.properties?.mode === 'circle' && geojson.type === 'Polygon') {
            const circleWkt = polygonToCircleWkt(geojson as GeoJSON.Polygon);
            if (circleWkt) {
              wkt = circleWkt;
            } else {
              wkt = stringifyGeoJSON(geojson as any);
            }
          } else {
            // GeoJSON is [lon, lat] but Traccar WKT expects (lat, lon)
            // Swap coordinates before stringifying
            const swappedGeojson = {
              ...geojson,
              coordinates: roundCoords(swapCoords((geojson as any).coordinates)),
            };
            wkt = stringifyGeoJSON(swappedGeojson as any);
          }
          console.log('[GeofenceDrawMap] change event, generated WKT:', wkt.substring(0, 80));
          handleWktChange(wkt);
        } catch (err) {
          console.error('[GeofenceDrawMap] change event error:', err);
        }
      });

      drawRef.current = draw;
      mapRef.current = map;
      readyRef.current = true;

      console.log('[GeofenceDrawMap] map ready, initialWkt:', initialWkt);
      // Load initial geometry if provided at mount time
      if (initialWkt) {
        console.log('[GeofenceDrawMap] loading initial WKT at mount:', initialWkt.substring(0, 80));
        loadWktIntoDraw(draw, map, initialWkt);
      }
      // Process any WKT that arrived while the map was still loading
      if (pendingWktRef.current) {
        console.log('[GeofenceDrawMap] loading pending WKT:', pendingWktRef.current.substring(0, 80));
        draw.clear();
        loadWktIntoDraw(draw, map, pendingWktRef.current);
        pendingWktRef.current = null;
      }
    });

    return () => {
      readyRef.current = false;
      if (drawRef.current) {
        drawRef.current.stop();
      }
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // React to initialWkt changes (e.g. editing a different geofence)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const draw = drawRef.current;
    const map = mapRef.current;
    console.log('[GeofenceDrawMap] useEffect [initialWkt] fired, value:', initialWkt?.substring(0, 60), 'ready:', readyRef.current);
    if (!draw || !map || !initialWkt) return;

    // If the map isn't ready yet, queue the WKT for later
    if (!readyRef.current) {
      console.log('[GeofenceDrawMap] not ready, queueing WKT');
      pendingWktRef.current = initialWkt;
      return;
    }

    // Clear existing features before loading new ones
    console.log('[GeofenceDrawMap] clearing and loading new WKT');
    draw.clear();
    loadWktIntoDraw(draw, map, initialWkt);
  }, [initialWkt, loadWktIntoDraw]);

  const setMode = (mode: string) => {
    if (!drawRef.current) return;
    drawRef.current.setMode(mode);
    setActiveMode(mode);
  };

  const handleClear = () => {
    if (!drawRef.current) return;
    drawRef.current.clear();
    handleWktChange(null);
    setActiveMode('select');
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10 }}>
        <div style={toolbarStyle}>
          <button
            style={activeMode === 'polygon' ? activeBtn : inactiveBtn}
            onClick={() => setMode('polygon')}
            onMouseEnter={(e) => { if (activeMode !== 'polygon') e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
            onMouseLeave={(e) => { if (activeMode !== 'polygon') e.currentTarget.style.backgroundColor = ''; }}
          >
            Polígono
          </button>
          <button
            style={activeMode === 'circle' ? activeBtn : inactiveBtn}
            onClick={() => setMode('circle')}
            onMouseEnter={(e) => { if (activeMode !== 'circle') e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
            onMouseLeave={(e) => { if (activeMode !== 'circle') e.currentTarget.style.backgroundColor = ''; }}
          >
            Círculo
          </button>
          <button
            style={activeMode === 'select' ? activeBtn : inactiveBtn}
            onClick={() => setMode('select')}
            onMouseEnter={(e) => { if (activeMode !== 'select') e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.08)'; }}
            onMouseLeave={(e) => { if (activeMode !== 'select') e.currentTarget.style.backgroundColor = ''; }}
          >
            Seleccionar
          </button>
          <button
            style={dangerBtn}
            onClick={handleClear}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
          >
            Limpiar
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '300px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(15, 23, 42, 0.08)' }}
      />
    </div>
  );
}