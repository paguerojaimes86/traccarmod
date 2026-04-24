import { useUnitConversion } from '@shared/hooks/useUnitConversion';
import type { SpeedUnit, DistanceUnit } from '@shared/lib/units';

interface UnitValueSpeedProps {
  kind: 'speed';
  value: number;
  unit?: SpeedUnit;
  decimals?: number;
}

interface UnitValueDistanceProps {
  kind: 'distance';
  value: number;
  unit?: DistanceUnit;
  decimals?: number;
}

type UnitValueProps = UnitValueSpeedProps | UnitValueDistanceProps;

export function UnitValue(props: UnitValueProps) {
  const { formatSpeed, formatDistance } = useUnitConversion();

  if (props.kind === 'speed') {
    const formatted = props.unit
      ? `${(props.value * (props.unit === 'kmh' ? 1.852 : props.unit === 'mph' ? 1.15078 : 1)).toFixed(props.decimals ?? 2)} ${props.unit === 'kmh' ? 'km/h' : props.unit === 'mph' ? 'mph' : 'kn'}`
      : formatSpeed(props.value, props.decimals);
    return <>{formatted}</>;
  }

  const formatted = props.unit
    ? `${(props.value * (props.unit === 'km' ? 0.001 : props.unit === 'mi' ? 0.000621371 : 1)).toFixed(props.decimals ?? 2)} ${props.unit === 'km' ? 'km' : props.unit === 'mi' ? 'mi' : 'm'}`
    : formatDistance(props.value, props.decimals);
  return <>{formatted}</>;
}
