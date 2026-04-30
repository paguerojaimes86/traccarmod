import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

/**
 * Fetches linked device IDs for a notification by doing the inverse query:
 * For each device the user has access to, check if this notification is linked.
 * 
 * This uses a parallel query approach with GET /notifications?deviceId=X for 
 * each device, then checking if our notificationId appears in the results.
 *
 * Returns an array of device IDs linked to the given notification.
 */
export function useLinkedDeviceIds(notificationId: number | null | undefined) {
  // First, get all devices
  const { data: allDevices = [] } = useQuery({
    queryKey: QUERY_KEYS.devices,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/devices', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  // Then, for each device, check if it has this notification linked
  // We use a single query that fetches all devices' notifications in parallel
  return useQuery({
    queryKey: [...QUERY_KEYS.notifications, 'linkedDevices', notificationId],
    queryFn: async (): Promise<number[]> => {
      if (notificationId == null) return [];

      const deviceIds: number[] = [];

      // Query in parallel batches of 10 to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < allDevices.length; i += batchSize) {
        const batch = allDevices.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (device) => {
            if (device.id == null) return false;
            try {
              const { data } = await apiClient.GET('/notifications', {
                params: { query: { deviceId: device.id } },
              });
              const notifs = data ?? [];
              // Check if our notificationId is in this device's notifications
              return notifs.some((n) => n.id === notificationId) ? device.id : null;
            } catch {
              return null;
            }
          }),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            const value = (result as unknown as { result: number | null }).result;
            if (value != null) {
              deviceIds.push(value);
            }
          }
        }
      }

      return deviceIds;
    },
    enabled: notificationId != null && allDevices.length > 0,
    staleTime: 30_000,
  });
}

export function useInvalidateLinkedDevices() {
  const queryClient = useQueryClient();
  return (notificationId?: number) => {
    if (notificationId) {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.notifications, 'linkedDevices', notificationId],
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.notifications, 'linkedDevices'],
      });
    }
  };
}