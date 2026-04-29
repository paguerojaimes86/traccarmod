import { parse as parseWktString } from 'wellknown';
import type { GeoJSONGeometryOrNull, GeoJSONFeature, GeoJSONGeometry } from 'wellknown';

export type { GeoJSONGeometry, GeoJSONGeometryOrNull, GeoJSONFeature };

export interface WktFeature extends GeoJSONFeature {
  properties?: Record<string, unknown>;
}

export interface WktFeatureCollection {
  type: 'FeatureCollection';
  features: WktFeature[];
}

export function wktToGeoJSON(wkt: string): WktFeature | null {
  if (!wkt?.trim()) return null;

  try {
    const geometry = parseWktString(wkt);
    if (!geometry) return null;

    return {
      type: 'Feature',
      geometry,
      properties: {},
    };
  } catch {
    return null;
  }
}

export function wktToMapLibreSource(
  wkt: string,
  properties?: Record<string, unknown>,
): WktFeatureCollection | null {
  const feature = wktToGeoJSON(wkt);
  if (!feature) return null;

  return {
    type: 'FeatureCollection',
    features: [
      {
        ...feature,
        properties: { ...feature.properties, ...properties },
      },
    ],
  };
}

export function isCircleWkt(wkt: string): boolean {
  return wkt?.trim().toUpperCase().startsWith('CIRCLE');
}

export function isPolygonWkt(wkt: string): boolean {
  return wkt?.trim().toUpperCase().startsWith('POLYGON');
}

export function isLinestringWkt(wkt: string): boolean {
  return wkt?.trim().toUpperCase().startsWith('LINESTRING');
}

// ---------------------------------------------------------------------------
// Circle WKT helpers — Traccar uses CIRCLE(lon lat, radiusMeters)
// ---------------------------------------------------------------------------

const EARTH_RADIUS = 6_371_000; // meters

export interface CircleWkt {
  center: [number, number]; // [lon, lat]
  radius: number; // meters
}

export function parseCircleWkt(wkt: string): CircleWkt | null {
  const trimmed = wkt?.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/CIRCLE\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*\)/i);
  if (!m) return null;
  return {
    center: [parseFloat(m[1]), parseFloat(m[2])],
    radius: parseFloat(m[3]),
  };
}

export function formatCircleWkt(center: [number, number], radius: number): string {
  return `CIRCLE(${center[0]} ${center[1]}, ${Math.round(radius)})`;
}

/** Convert a circle (center + radius in meters) to an approximate GeoJSON Polygon */
export function circleToPolygon(
  center: [number, number],
  radius: number,
  sides = 64,
): { type: 'Polygon'; coordinates: [number, number][][] } {
  const coords: [number, number][] = [];
  for (let i = 0; i <= sides; i++) {
    const bearing = (i * 360) / sides;
    coords.push(destinationPoint(center[0], center[1], radius, bearing));
  }
  // Close the ring
  coords[coords.length - 1] = [...coords[0]];
  return { type: 'Polygon', coordinates: [coords] };
}

/** Calculate a destination point given distance (m) and bearing (deg) from start */
function destinationPoint(lon: number, lat: number, distance: number, bearing: number): [number, number] {
  const δ = distance / EARTH_RADIUS;
  const θ = (bearing * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ),
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );

  return [(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI];
}

/** Compute centroid of a polygon ring */
function polygonCentroid(ring: number[][]): [number, number] {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const [lon, lat] of ring) {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  }
  const total = ring.length;
  x /= total;
  y /= total;
  z /= total;
  const lon = (Math.atan2(y, x) * 180) / Math.PI;
  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  return [lon, lat];
}

/** Haversine distance in meters */
function haversineMeters(a: [number, number], b: [number, number]): number {
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Infer CIRCLE WKT from a polygon that was drawn as a circle (e.g. by TerraDraw) */
export function polygonToCircleWkt(polygon: GeoJSON.Polygon): string | null {
  const ring = polygon.coordinates[0];
  if (!ring || ring.length < 4) return null;
  // Exclude the closing duplicate coordinate
  const unique = ring.slice(0, -1);
  if (unique.length < 3) return null;

  const center = polygonCentroid(unique);
  // Average distance from center to vertices
  let totalDist = 0;
  for (const coord of unique) {
    totalDist += haversineMeters(center, coord as [number, number]);
  }
  const radius = totalDist / unique.length;
  return formatCircleWkt(center, radius);
}

/** Convert any WKT (including CIRCLE) to a MapLibre-ready GeoJSON FeatureCollection */
export function wktToMapLibreSourceUniversal(
  wkt: string,
  properties?: Record<string, unknown>,
): WktFeatureCollection | null {
  const trimmed = wkt?.trim();
  if (!trimmed) return null;

  // Handle CIRCLE WKT — Traccar-specific extension
  if (isCircleWkt(trimmed)) {
    const circle = parseCircleWkt(trimmed);
    if (!circle) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: circleToPolygon(circle.center, circle.radius),
          properties: { ...properties },
        },
      ],
    };
  }

  // Standard WKT via wellknown
  return wktToMapLibreSource(wkt, properties);
}
