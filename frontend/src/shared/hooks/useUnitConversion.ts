import { useUiStore } from '@shared/lib/ui-store';
import {
  convertSpeed,
  formatSpeed,
  convertDistance,
  formatDistance,
  type SpeedUnit,
  type DistanceUnit,
} from '@shared/lib/units';

export function useUnitConversion() {
  const speedUnit = useUiStore((s) => s.speedUnit) as SpeedUnit;
  const distanceUnit = useUiStore((s) => s.distanceUnit) as DistanceUnit;

  return {
    speedUnit,
    distanceUnit,
    convertSpeed: (knots: number) => convertSpeed(knots, speedUnit),
    formatSpeed: (knots: number, decimals?: number) => formatSpeed(knots, speedUnit, decimals),
    convertDistance: (meters: number) => convertDistance(meters, distanceUnit),
    formatDistance: (meters: number, decimals?: number) =>
      formatDistance(meters, distanceUnit, decimals),
  };
}
