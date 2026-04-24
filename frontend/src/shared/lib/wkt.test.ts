import { describe, it, expect } from 'vitest';
import { wktToGeoJSON, isCircleWkt, isPolygonWkt, isLinestringWkt } from '@shared/lib/wkt';

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
