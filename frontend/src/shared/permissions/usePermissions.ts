import { useMemo } from 'react';
import { useAuthStore } from '@features/auth/store';
import { computePermissions, type Permissions } from './permission-utils';

export type { Permissions };

/**
 * React hook that computes permission flags from the authenticated user.
 * Uses a Zustand selector to prevent unnecessary re-renders — only `user`
 * is observed, not the entire auth store.
 *
 * Returns a memoised Permissions object that is stable across renders
 * unless the underlying user actually changes.
 */
export function usePermissions(): Permissions {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => computePermissions(user), [user]);
}