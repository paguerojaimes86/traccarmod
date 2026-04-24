import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { lazy, Suspense } from 'react';
import { LoadingState } from '@shared/ui';
import { Providers } from './providers';
import { ProtectedRoute } from '@shared/components/ProtectedRoute';
import { useAuthStore } from '@features/auth/store';
import { LogoutButton } from '@features/auth/components/LogoutButton';

const LoginPage = lazy(() => import('@features/auth/components/LoginPage'));
const DashboardPage = lazy(() => import('./DashboardPage'));

function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) return null;

  return (
    <header
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        height: '60px',
        zIndex: 50,
      }}
    >
      <span style={{ fontFamily: 'Outfit', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>
        MSGLOBAL GPS
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
          {user?.name ?? user?.email ?? ''}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <LoginPage />
                </AuthRedirect>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <AppHeader />
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                      <DashboardPage />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  );
}
