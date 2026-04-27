const isTrue = (value: unknown) => String(value).toLowerCase() === 'true';

export const ALERTS_DEBUG_ENABLED = isTrue(import.meta.env.VITE_ALERTS_DEBUG);

export function alertsDebug(scope: string, message: string, payload?: unknown) {
  if (!ALERTS_DEBUG_ENABLED) return;
  if (payload !== undefined) {
    console.log(`[logs_alerts][${scope}] ${message}`, payload);
    return;
  }
  console.log(`[logs_alerts][${scope}] ${message}`);
}

export function alertsWarn(scope: string, message: string, payload?: unknown) {
  if (!ALERTS_DEBUG_ENABLED) return;
  if (payload !== undefined) {
    console.warn(`[logs_alerts][${scope}] ${message}`, payload);
    return;
  }
  console.warn(`[logs_alerts][${scope}] ${message}`);
}
