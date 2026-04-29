import type { ComponentType } from 'react';
import type { Permissions } from '@shared/permissions/permission-utils';
import type { User } from '@shared/api/types.models';
import { computePermissions } from '@shared/permissions/permission-utils';
import type { IconProps } from '@shared/ui/icons';
import {
  IconNavigation,
  IconPin,
  IconBell,
  IconUsers,
  IconGroup,
  IconCommand,
  IconFileBarChart,
  IconSettings,
} from '@shared/ui/icons';

export type MenuCategory = 'Principal' | 'Gestión' | 'Sistema';

export interface MenuItem {
  label: string;
  path: string;
  icon: ComponentType<IconProps>;
  category: MenuCategory;
  visibleWhen: (p: Permissions) => boolean;
}

export const menuConfig: MenuItem[] = [
  {
    label: 'Dispositivos',
    path: '/devices',
    icon: IconNavigation,
    category: 'Principal',
    visibleWhen: () => true,
  },
  {
    label: 'Geocercas',
    path: '/geofences',
    icon: IconPin,
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
    icon: IconFileBarChart,
    category: 'Principal',
    visibleWhen: () => true,
  },
  {
    label: 'Usuarios',
    path: '/users',
    icon: IconUsers,
    category: 'Gestión',
    visibleWhen: (p) => p.canManageUsers,
  },
  {
    label: 'Grupos',
    path: '/groups',
    icon: IconGroup,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Comandos',
    path: '/commands',
    icon: IconCommand,
    category: 'Gestión',
    visibleWhen: () => true,
  },
  {
    label: 'Configuración',
    path: '/settings',
    icon: IconSettings,
    category: 'Sistema',
    visibleWhen: (p) => p.isAdmin,
  },
];

export function getMenuItems(user: User | null): MenuItem[] {
  const perms = computePermissions(user);
  return menuConfig.filter((item) => item.visibleWhen(perms));
}
