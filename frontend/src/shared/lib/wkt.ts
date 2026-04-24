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
