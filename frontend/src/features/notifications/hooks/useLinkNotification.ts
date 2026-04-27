import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { useAuthStore } from '@features/auth/store';
import { QUERY_KEYS } from '@shared/lib/constants';
import { alertsDebug, alertsWarn } from '@shared/lib/debug';

interface LinkNotificationParams {
  notificationId: number;
  deviceIds: number[];
  geofenceId?: number;
  maintenanceId?: number;
  driverId?: number;
  calendarId?: number;
  commandId?: number;
}

export function useLinkNotification() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ notificationId, deviceIds, geofenceId, maintenanceId, driverId, calendarId, commandId }: LinkNotificationParams) => {
      const permissionsToCreate: Record<string, unknown>[] = [];

      // Link to geofence (if applicable)
      if (geofenceId) {
        permissionsToCreate.push({ geofenceId, notificationId });
      }

      // Link to maintenance (if applicable)
      if (maintenanceId) {
        permissionsToCreate.push({ maintenanceId, notificationId });
      }

      // Link to driver (if applicable)
      if (driverId) {
        permissionsToCreate.push({ driverId, notificationId });
      }

      // Link to calendar (if applicable)
      if (calendarId) {
        permissionsToCreate.push({ calendarId, notificationId });
      }

      // Link to command (if applicable)
      if (commandId) {
        permissionsToCreate.push({ commandId, notificationId });
      }

      // Link to each device
      for (const deviceId of deviceIds) {
        permissionsToCreate.push({ deviceId, notificationId });
      }

      // Link to current user
      if (user?.id) {
        permissionsToCreate.push({ userId: user.id, notificationId });
      }

      alertsDebug('permissions', 'link notification permissions request', {
        notificationId,
        count: permissionsToCreate.length,
        payload: permissionsToCreate,
      });

      const results = await Promise.allSettled(
        permissionsToCreate.map((perm) =>
          apiClient.POST('/permissions', { body: perm })
        )
      );

      const rejected = results.filter((r) => r.status === 'rejected').length;
      alertsDebug('permissions', 'permissions linking completed', {
        total: results.length,
        rejected,
      });
      if (rejected > 0) {
        alertsWarn('permissions', 'some permission links were rejected', { rejected });
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}
