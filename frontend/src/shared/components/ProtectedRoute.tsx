import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '@features/auth/store';
import { useSession } from '@features/auth/hooks/useSession';
import { LoadingState } from '@shared/ui';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: sessionUser, isLoading, isError } = useSession();

  useEffect(() => {
    if (sessionUser) {
      useAuthStore.getState().setSession(sessionUser);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (isError) {
      useAuthStore.getState().logout();
    }
  }, [isError]);

  if (isLoading && !isAuthenticated) {
    return <LoadingState message="Verificando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
