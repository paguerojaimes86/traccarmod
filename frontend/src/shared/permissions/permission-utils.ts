import type { User, Device } from '@shared/api/types.models';

export interface Permissions {
  isAdmin: boolean;
  isManager: boolean;
  canManage: boolean;
  canManageDevices: boolean;
  canManageUsers: boolean;
  canSendCommands: boolean;
  canCreateAlerts: boolean;
  canDeleteAlerts: boolean;
  canEditAlerts: boolean;
}

const ALL_FALSE: Permissions = {
  isAdmin: false,
  isManager: false,
  canManage: false,
  canManageDevices: false,
  canManageUsers: false,
  canSendCommands: false,
  canCreateAlerts: false,
  canDeleteAlerts: false,
  canEditAlerts: false,
};

/**
 * Compute permission flags from a User object.
 * Returns ALL_FALSE when user is null.
 * Pure function — safe to use outside React components.
 */
export function computePermissions(user: User | null): Permissions {
  if (!user) {
    return ALL_FALSE;
  }

  const isAdmin = user.administrator === true;
  const isManager = (user.userLimit ?? 0) > 0;
  const canManage = !user.readonly && !user.disabled;

  return {
    isAdmin,
    isManager,
    canManage,
    canManageDevices: canManage && !user.deviceReadonly,
    canManageUsers: isAdmin || isManager,
    canSendCommands: !user.limitCommands,
    canCreateAlerts: canManage,
    canDeleteAlerts: canManage,
    canEditAlerts: canManage,
  };
}

/**
 * Check if a user can access a given device.
 * Traccar backend filters devices by user permissions, so the frontend
 * does not need to enforce additional filtering — always returns true
 * when the user has access to the device list.
 */
export function canAccessDevice(_user: User | null, _device: Device): boolean {
  return true;
}

// Menu visibility predicates — used by menuConfig and PermissionRoute

export const canViewDevices = (_p: Permissions) => true;
export const canManageDevices = (p: Permissions) => p.canManageDevices;

export const canViewGeofences = (_p: Permissions) => true;
export const canManageGeofences = (p: Permissions) => p.canManage;

export const canViewUsers = (p: Permissions) => p.canManageUsers;
export const canManageUsers = (p: Permissions) => p.canManageUsers;

export const canViewGroups = (_p: Permissions) => true;
export const canManageGroups = (p: Permissions) => p.canManage;

export const canViewAlerts = (_p: Permissions) => true;
export const canManageAlerts = (p: Permissions) => p.canManage;

export const canViewCommands = (_p: Permissions) => true;
export const canSendCommands = (p: Permissions) => p.canSendCommands;

export const canViewReports = (_p: Permissions) => true;

export const canViewSettings = (p: Permissions) => p.isAdmin;