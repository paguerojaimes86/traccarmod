import type { ComponentType } from 'react';
import type { Permissions } from '@shared/permissions/permission-utils';
import type { User } from '@shared/api/types.models';
import { computePermissions } from '@shared/permissions/permission-utils';
import {
  IconRss,
  IconHexagon,
  IconBell,
  IconChartBar,
  IconUsers,
  IconHierarchy2,
  IconTerminal2,
  IconSettings,
  IconTool,
  IconId,
  IconCalendar,
  IconVariable,
  IconShoppingCart,
  IconChartHistogram,
} from '@tabler/icons-react';

// Tabler icon props interface
interface TablerIconProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export type MenuCategory = 'Principal' | 'Gestión' | 'Sistema';

export interface MenuItem {
  label: string;
  path: string;
  icon: ComponentType<TablerIconProps>;
  category: MenuCategory;
  visibleWhen: (p: Permissions) => boolean;
}

export const menuConfig: MenuItem[] = [
  {
    label: 'Dispositivos',
    path: '/devices',
    icon: IconRss,
    category: 'Principal',
    visibleWhen: () => true,
  },
  {
    label: 'Geocercas',
    path: '/geofences',
    icon: IconHexagon,
    category: 'Principal',
    visibleWhen: () => true,
  },
  {
    label: 'Alertas',
    path: '/alerts',
    icon: IconBell,
    category: 'Principal',
    visibleWhen: () => true,
  },
  {
    label: 'Reportes',
    path: '/reports',
    icon: IconChartBar,
    category: 'Principal',
    visibleWhen: () => true,
  },
  {
    label: 'Usuarios',
    path: '/users',
    icon: IconUsers,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Grupos',
    path: '/groups',
    icon: IconHierarchy2,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Comandos',
    path: '/commands',
    icon: IconTerminal2,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Mantenimiento',
    path: '/maintenance',
    icon: IconTool,
    category: 'Gestión',
    visibleWhen: (_p) => true,
  },
  {
    label: 'Conductores',
    path: '/drivers',
    icon: IconId,
    category: 'Gestión',
    visibleWhen: (_p) => true,
  },
  {
    label: 'Calendarios',
    path: '/calendars',
    icon: IconCalendar,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Atributos',
    path: '/attributes',
    icon: IconVariable,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Órdenes',
    path: '/orders',
    icon: IconShoppingCart,
    category: 'Gestión',
    visibleWhen: (_p) => true,
  },
  {
    label: 'Estadísticas',
    path: '/statistics',
    icon: IconChartHistogram,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Configuración',
    path: '/settings',
    icon: IconSettings,
    category: 'Sistema',
    visibleWhen: () => true,
  },
];

export function getMenuItems(user: User | null): MenuItem[] {
  const perms = computePermissions(user);
  return menuConfig.filter((item) => item.visibleWhen(perms));
}
