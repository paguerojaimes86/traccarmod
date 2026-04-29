import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';
import { alertsDebug, alertsWarn } from '@shared/lib/debug';

interface UnlinkNotificationParams {
  notificationId: number;
  deviceId?: number;
  geofenceId?: number;
  userId?: number;
  maintenanceId?: number;
  driverId?: number;
  commandId?: number;
  calendarId?: number;
}

/** Unlink a single entity from a notification */
async function unlinkSingle(params: UnlinkNotificationParams): Promise<void> {
  const { notificationId, ...rest } = params;
  const body: Record<string, unknown> = { notificationId };
  if (rest.deviceId !== undefined) body.deviceId = rest.deviceId;
  if (rest.geofenceId !== undefined) body.geofenceId = rest.geofenceId;
  if (rest.userId !== undefined) body.userId = rest.userId;
  if (rest.maintenanceId !== undefined) body.maintenanceId = rest.maintenanceId;
  if (rest.driverId !== undefined) body.driverId = rest.driverId;
  if (rest.commandId !== undefined) body.commandId = rest.commandId;
  if (rest.calendarId !== undefined) body.calendarId = rest.calendarId;

  alertsDebug('permissions', 'unlink notification', body);

  const { error } = await apiClient.DELETE('/permissions', {
    body: body as Record<string, unknown>,
  });
  if (error) throw error;
}

export function useUnlinkNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlinkSingle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

/**
 * Unlink multiple entities from a notification in batch.
 * Uses Promise.allSettled so partial failures don't block remaining operations.
 * Returns an object with succeeded/failed counts for error reporting.
 */
export async function unlinkBatch(paramsList: UnlinkNotificationParams[]): Promise<{
  succeeded: number;
  failed: number;
  errors: unknown[];
}> {
  const results = await Promise.allSettled(paramsList.map((p) => unlinkSingle(p)));

  let succeeded = 0;
  let failed = 0;
  const errors: unknown[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      succeeded++;
    } else {
      failed++;
      errors.push(result.reason);
      alertsWarn('permissions', 'batch unlink failed', result.reason);
    }
  }

  return { succeeded, failed, errors };
}