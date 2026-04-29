import { describe, it, expect } from 'vitest';
import {
  wktToGeoJSON,
  isCircleWkt,
  isPolygonWkt,
  isLinestringWkt,
  parseCircleWkt,
  formatCircleWkt,
  circleToPolygon,
  polygonToCircleWkt,
  wktToMapLibreSourceUniversal,
} from '@shared/lib/wkt';

describe('wktToGeoJSON', () => {
  it('returns null for empty string', () => {
    expect(wktToGeoJSON('')).toBeNull();
  });

  it('returns null for whitespace', () => {
    expect(wktToGeoJSON('   ')).toBeNull();
  });

  it('parses POINT WKT', () => {
    const result = wktToGeoJSON('POINT(10 20)');
    expect(result).not.toBeNull();
    expect(result?.type).toBe('Feature');
    expect(result?.geometry.type).toBe('Point');
  });

  it('parses POLYGON WKT', () => {
    const result = wktToGeoJSON('POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))');
    expect(result).not.toBeNull();
    expect(result?.geometry.type).toBe('Polygon');
  });

  it('returns null for invalid WKT', () => {
    expect(wktToGeoJSON('NOTVALID')).toBeNull();
  });
});

describe('WKT type checks', () => {
  it('detects CIRCLE WKT', () => {
    expect(isCircleWkt('CIRCLE(10 20, 500)')).toBe(true);
    expect(isCircleWkt('circle(10 20, 500)')).toBe(true);
    expect(isCircleWkt('POINT(10 20)')).toBe(false);
  });

  it('detects POLYGON WKT', () => {
    expect(isPolygonWkt('POLYGON((0 0, 10 0, 10 10, 0 0))')).toBe(true);
    expect(isPolygonWkt('polygon((0 0, 10 0, 10 10, 0 0))')).toBe(true);
    expect(isPolygonWkt('POINT(10 20)')).toBe(false);
  });

  it('detects LINESTRING WKT', () => {
    expect(isLinestringWkt('LINESTRING(0 0, 10 10)')).toBe(true);
    expect(isLinestringWkt('linestring(0 0, 10 10)')).toBe(true);
    expect(isLinestringWkt('POINT(10 20)')).toBe(false);
  });
});

describe('parseCircleWkt', () => {
  it('parses valid CIRCLE WKT', () => {
    const result = parseCircleWkt('CIRCLE(-77.0 -12.0, 500)');
    expect(result).not.toBeNull();
    expect(result!.center).toEqual([-77.0, -12.0]);
    expect(result!.radius).toBe(500);
  });

  it('parses lowercase circle', () => {
    const result = parseCircleWkt('circle(-77.5 -12.5, 1000)');
    expect(result).not.toBeNull();
    expect(result!.center).toEqual([-77.5, -12.5]);
    expect(result!.radius).toBe(1000);
  });

  it('returns null for invalid WKT', () => {
    expect(parseCircleWkt('POLYGON((0 0, 1 1))')).toBeNull();
    expect(parseCircleWkt('')).toBeNull();
  });
});

describe('formatCircleWkt', () => {
  it('formats a circle WKT string', () => {
    expect(formatCircleWkt([-77.0, -12.0], 500)).toBe('CIRCLE(-77 -12, 500)');
    expect(formatCircleWkt([-77.123456, -12.987654], 1234.56)).toBe('CIRCLE(-77.123456 -12.987654, 1235)');
  });
});

describe('circleToPolygon', () => {
  it('returns a Polygon geometry', () => {
    const poly = circleToPolygon([-77.0, -12.0], 1000, 32);
    expect(poly.type).toBe('Polygon');
    expect(poly.coordinates).toHaveLength(1);
    expect(poly.coordinates[0]).toHaveLength(33); // 32 sides + closing point
  });

  it('first and last coordinates are equal (closed ring)', () => {
    const poly = circleToPolygon([0, 0], 1000, 16);
    const ring = poly.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});

describe('polygonToCircleWkt', () => {
  it('infers circle from a regular polygon', () => {
    const poly = circleToPolygon([-77.0, -12.0], 500, 64);
    const wkt = polygonToCircleWkt(poly as GeoJSON.Polygon);
    expect(wkt).not.toBeNull();
    expect(wkt).toMatch(/^CIRCLE\(/);
  });

  it('returns null for too few coordinates', () => {
    const poly: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 0]]] };
    expect(polygonToCircleWkt(poly)).toBeNull();
  });
});

describe('wktToMapLibreSourceUniversal', () => {
  it('handles standard POLYGON', () => {
    const result = wktToMapLibreSourceUniversal('POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))');
    expect(result).not.toBeNull();
    expect(result!.features[0].geometry.type).toBe('Polygon');
  });

  it('handles CIRCLE WKT by converting to polygon', () => {
    const result = wktToMapLibreSourceUniversal('CIRCLE(-77.0 -12.0, 500)');
    expect(result).not.toBeNull();
    expect(result!.features[0].geometry.type).toBe('Polygon');
  });

  it('returns null for invalid WKT', () => {
    expect(wktToMapLibreSourceUniversal('NOTVALID')).toBeNull();
    expect(wktToMapLibreSourceUniversal('')).toBeNull();
  });
});
