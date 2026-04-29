import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { usePermissions, type Permissions } from '@shared/permissions';

interface PermissionRouteProps {
  predicate?: (p: Permissions) => boolean;
  children: ReactNode;
}

export function PermissionRoute({ predicate, children }: PermissionRouteProps) {
  const permissions = usePermissions();

  if (predicate && !predicate(permissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
