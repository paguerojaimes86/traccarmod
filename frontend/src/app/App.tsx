import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { lazy, Suspense, type ReactNode } from 'react';
import { LoadingState } from '@shared/ui';
import { Providers } from './providers';
import { ProtectedRoute } from '@shared/components/ProtectedRoute';
import { PermissionRoute } from '@shared/components/PermissionRoute';
import { useAuthStore } from '@features/auth/store';
import { Layout } from './Layout';
import {
  canViewDevices,
  canViewGeofences,
  canViewUsers,
  canViewGroups,
  canViewAlerts,
  canViewCommands,
  canViewReports,
  canViewSettings,
  canViewMaintenance,
  canViewDrivers,
  canViewCalendars,
  canViewAttributes,
  canViewOrders,
  canViewStatistics,
} from '@shared/permissions';

const LoginPage = lazy(() => import('@features/auth/components/LoginPage'));
const DashboardPage = lazy(() => import('./DashboardPage'));
const DevicesPage = lazy(() => import('@features/devices/pages/DevicesPage'));
const GeofencesPage = lazy(() => import('@features/geofences/pages/GeofencesPage'));
const UsersPage = lazy(() => import('@features/users/pages/UsersPage'));
const GroupsPage = lazy(() => import('@features/groups/pages/GroupsPage'));
const AlertsPage = lazy(() => import('@features/alerts/pages/AlertsPage'));
const CommandsPage = lazy(() => import('@features/commands/pages/CommandsPage'));
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@features/settings/pages/SettingsPage'));
const MaintenancePage = lazy(() => import('@features/maintenance/pages/MaintenancePage'));
const DriversPage = lazy(() => import('@features/drivers/pages/DriversPage'));
const CalendarsPage = lazy(() => import('@features/calendars/pages/CalendarsPage'));
const AttributesPage = lazy(() => import('@features/attributes/pages/AttributesPage'));
const OrdersPage = lazy(() => import('@features/orders/pages/OrdersPage'));
const StatisticsPage = lazy(() => import('@features/statistics/pages/StatisticsPage'));
import { PublicView } from '@features/public/PublicView';

function AuthRedirect({ children }: { children: ReactNode }) {
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
            <Route path="/v/:token" element={<PublicView />} />
            <Route
              path="/login"
              element={
                <AuthRedirect>
                  <LoginPage />
                </AuthRedirect>
              }
            />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route
                path="devices"
                element={
                  <PermissionRoute predicate={canViewDevices}>
                    <DevicesPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="geofences"
                element={
                  <PermissionRoute predicate={canViewGeofences}>
                    <GeofencesPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="users"
                element={
                  <PermissionRoute predicate={canViewUsers}>
                    <UsersPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="groups"
                element={
                  <PermissionRoute predicate={canViewGroups}>
                    <GroupsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="alerts"
                element={
                  <PermissionRoute predicate={canViewAlerts}>
                    <AlertsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="commands"
                element={
                  <PermissionRoute predicate={canViewCommands}>
                    <CommandsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <PermissionRoute predicate={canViewReports}>
                    <ReportsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <PermissionRoute predicate={canViewSettings}>
                    <SettingsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="maintenance"
                element={
                  <PermissionRoute predicate={canViewMaintenance}>
                    <MaintenancePage />
                  </PermissionRoute>
                }
              />
              <Route
                path="drivers"
                element={
                  <PermissionRoute predicate={canViewDrivers}>
                    <DriversPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="calendars"
                element={
                  <PermissionRoute predicate={canViewCalendars}>
                    <CalendarsPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="attributes"
                element={
                  <PermissionRoute predicate={canViewAttributes}>
                    <AttributesPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="orders"
                element={
                  <PermissionRoute predicate={canViewOrders}>
                    <OrdersPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="statistics"
                element={
                  <PermissionRoute predicate={canViewStatistics}>
                    <StatisticsPage />
                  </PermissionRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  );
}
