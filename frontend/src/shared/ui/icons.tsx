import type { CSSProperties } from 'react';
import { 
  History, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Eye,
  EyeOff, 
  X, 
  FileText, 
  ChevronDown, 
  Menu, 
  Gauge, 
  Map as LucideMap, 
  Route,
  Signal, 
  Clock, 
  Battery, 
  Settings,
  Satellite,
  Search,
  Pin,
  Navigation,
  Lock,
  AtSign,
  Activity
} from 'lucide-react';

interface IconProps {
  size?: number;
  style?: CSSProperties;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

const defaultProps = {
  size: 16,
  strokeWidth: 2,
};

export function IconHistory({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <History size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconDownload({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Download size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconPlay({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Play size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} fill="currentColor" />;
}

export function IconPause({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Pause size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} fill="currentColor" />;
}

export function IconReset({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <RotateCcw size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconEye({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Eye size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconEyeOff({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <EyeOff size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconClose({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <X size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconFileText({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <FileText size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconChevronDown({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <ChevronDown size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconMenu({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Menu size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconSpeed({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Gauge size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconMap({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <LucideMap size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconRoute({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Route size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconSignal({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Signal size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconClock({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Clock size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconBattery({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Battery size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconSettings({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Settings size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconSatellite({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Satellite size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconSearch({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Search size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconPin({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Pin size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconNavigation({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Navigation size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconLock({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Lock size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconAt({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <AtSign size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}

export function IconActivity({ size = defaultProps.size, style, className, color, strokeWidth = defaultProps.strokeWidth }: IconProps) {
  return <Activity size={size} style={style} className={className} color={color} strokeWidth={strokeWidth} />;
}
