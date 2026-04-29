import { describe, it, expect } from 'vitest';
import {
  convertSpeed,
  formatSpeed,
  convertDistance,
  formatDistance,
  formatDuration,
  timeAgo,
} from '@shared/lib/units';

describe('convertSpeed', () => {
  it('returns same value for knots', () => {
    expect(convertSpeed(10, 'kn')).toBe(10);
  });

  it('converts knots to km/h', () => {
    expect(convertSpeed(10, 'kmh')).toBeCloseTo(18.52, 1);
  });

  it('converts knots to mph', () => {
    expect(convertSpeed(10, 'mph')).toBeCloseTo(11.5078, 3);
  });
});

describe('formatSpeed', () => {
  it('formats speed in knots', () => {
    expect(formatSpeed(10, 'kn')).toBe('10.00 kn');
  });

  it('formats speed in km/h', () => {
    expect(formatSpeed(10, 'kmh')).toBe('18.52 km/h');
  });

  it('respects decimals parameter', () => {
    expect(formatSpeed(10, 'kmh', 0)).toBe('19 km/h');
  });
});

describe('convertDistance', () => {
  it('returns same value for meters', () => {
    expect(convertDistance(1000, 'm')).toBe(1000);
  });

  it('converts meters to km', () => {
    expect(convertDistance(1000, 'km')).toBe(1);
  });

  it('converts meters to miles', () => {
    expect(convertDistance(1000, 'mi')).toBeCloseTo(0.621371, 4);
  });
});

describe('formatDistance', () => {
  it('formats distance in km', () => {
    expect(formatDistance(1500, 'km')).toBe('1.50 km');
  });

  it('formats distance in meters', () => {
    expect(formatDistance(500, 'm')).toBe('500.00 m');
  });
});

describe('formatDuration', () => {
  it('formats seconds', () => {
    expect(formatDuration(30)).toBe('30s');
  });

  it('formats minutes', () => {
    expect(formatDuration(120)).toBe('2m');
  });

  it('formats minutes with seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('formats hours', () => {
    expect(formatDuration(3600)).toBe('1h');
  });

  it('formats hours with minutes', () => {
    expect(formatDuration(5400)).toBe('1h 30m');
  });
});

describe('timeAgo', () => {
  it('returns "ahora mismo" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('ahora mismo');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('hace 5m');
  });

  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('hace 2h');
  });

  it('returns days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('hace 3d');
  });
});
