export type AlertSeverity = 'critical' | 'high' | 'low' | 'info';

export interface TypeConfig {
  type: string;
  label: string;
  description: string;
  icon: string; // emoji for now
  color: string;
  severity: AlertSeverity;
  category: 'status' | 'movement' | 'geofence' | 'speed' | 'alarm' | 'maintenance' | 'other';
  configRequirements: {
    needsGeofence?: boolean;
    needsSpeedLimit?: boolean;
    needsAlarmSubtype?: boolean;
    needsMaintenanceId?: boolean;
    needsDriverId?: boolean;
    needsCommandId?: boolean;
  };
}

export const ALERT_TYPE_CONFIG: Record<string, TypeConfig> = {
  // Status (5)
  deviceOnline: {
    type: 'deviceOnline',
    label: 'En Línea',
    description: 'El dispositivo se conectó al servidor',
    icon: '📶',
    color: '#10b981',
    severity: 'info',
    category: 'status',
    configRequirements: {},
  },
  deviceOffline: {
    type: 'deviceOffline',
    label: 'Sin Conexión',
    description: 'El dispositivo se desconectó del servidor',
    icon: '📵',
    color: '#94a3b8',
    severity: 'high',
    category: 'status',
    configRequirements: {},
  },
  deviceUnknown: {
    type: 'deviceUnknown',
    label: 'Estado Desconocido',
    description: 'El dispositivo está conectado pero no reporta datos',
    icon: '❓',
    color: '#f59e0b',
    severity: 'high',
    category: 'status',
    configRequirements: {},
  },
  deviceInactive: {
    type: 'deviceInactive',
    label: 'Dispositivo Inactivo',
    description: 'El dispositivo no reporta ubicación por mucho tiempo',
    icon: '💤',
    color: '#6b7280',
    severity: 'high',
    category: 'status',
    configRequirements: {},
  },
  deviceMoving: {
    type: 'deviceMoving',
    label: 'En Movimiento',
    description: 'El dispositivo comenzó a moverse',
    icon: '🚗',
    color: '#3b82f6',
    severity: 'info',
    category: 'movement',
    configRequirements: {},
  },

  // Movement (3)
  deviceStopped: {
    type: 'deviceStopped',
    label: 'Detenido',
    description: 'El dispositivo se detuvo',
    icon: '🅿️',
    color: '#6b7280',
    severity: 'info',
    category: 'movement',
    configRequirements: {},
  },
  ignitionOn: {
    type: 'ignitionOn',
    label: 'Encendido',
    description: 'La ignición del vehículo se encendió',
    icon: '🔑',
    color: '#10b981',
    severity: 'info',
    category: 'movement',
    configRequirements: {},
  },
  ignitionOff: {
    type: 'ignitionOff',
    label: 'Apagado',
    description: 'La ignición del vehículo se apagó',
    icon: '🔒',
    color: '#6b7280',
    severity: 'info',
    category: 'movement',
    configRequirements: {},
  },

  // Geofence (2)
  geofenceEnter: {
    type: 'geofenceEnter',
    label: 'Entró a Geozona',
    description: 'El dispositivo entró en una geozona',
    icon: '🟢',
    color: '#22c55e',
    severity: 'low',
    category: 'geofence',
    configRequirements: { needsGeofence: true },
  },
  geofenceExit: {
    type: 'geofenceExit',
    label: 'Salió de Geozona',
    description: 'El dispositivo salió de una geozona',
    icon: '🔴',
    color: '#f97316',
    severity: 'high',
    category: 'geofence',
    configRequirements: { needsGeofence: true },
  },

  // Speed (1)
  deviceOverspeed: {
    type: 'deviceOverspeed',
    label: 'Exceso de Velocidad',
    description: 'El dispositivo excedió el límite de velocidad',
    icon: '🚀',
    color: '#ef4444',
    severity: 'high',
    category: 'speed',
    configRequirements: { needsSpeedLimit: true },
  },

  // Alarm (1 base type with subtypes)
  alarm: {
    type: 'alarm',
    label: 'Alarma',
    description: 'Alarma reportada por el dispositivo',
    icon: '⚠️',
    color: '#ef4444',
    severity: 'critical',
    category: 'alarm',
    configRequirements: { needsAlarmSubtype: true },
  },

  // Maintenance (1)
  maintenance: {
    type: 'maintenance',
    label: 'Mantenimiento',
    description: 'Mantenimiento periódico requerido',
    icon: '🔧',
    color: '#f59e0b',
    severity: 'info',
    category: 'maintenance',
    configRequirements: { needsMaintenanceId: true },
  },

  // Driver (1)
  driverChanged: {
    type: 'driverChanged',
    label: 'Cambio de Conductor',
    description: 'El conductor del vehículo cambió',
    icon: '👤',
    color: '#3b82f6',
    severity: 'info',
    category: 'other',
    configRequirements: { needsDriverId: true },
  },

  // Command (1)
  commandResult: {
    type: 'commandResult',
    label: 'Resultado de Comando',
    description: 'Resultado de la ejecución de un comando',
    icon: '💻',
    color: '#6366f1',
    severity: 'info',
    category: 'other',
    configRequirements: { needsCommandId: true },
  },

  // Fuel (2)
  fuelDrop: {
    type: 'fuelDrop',
    label: 'Caída de Combustible',
    description: 'Caída brusca del nivel de combustible',
    icon: '⛽',
    color: '#ef4444',
    severity: 'high',
    category: 'other',
    configRequirements: {},
  },
  fuelIncrease: {
    type: 'fuelIncrease',
    label: 'Aumento de Combustible',
    description: 'Aumento brusco del nivel de combustible',
    icon: '⛽',
    color: '#10b981',
    severity: 'info',
    category: 'other',
    configRequirements: {},
  },

  // Media (1)
  media: {
    type: 'media',
    label: 'Media',
    description: 'El dispositivo subió archivos multimedia',
    icon: '📷',
    color: '#6366f1',
    severity: 'info',
    category: 'other',
    configRequirements: {},
  },
} as const;

export const ALARM_SUBTYPES = [
  { value: 'general', label: 'General' },
  { value: 'sos', label: 'SOS (Pánico)' },
  { value: 'vibration', label: 'Vibración' },
  { value: 'overspeed', label: 'Exceso de Velocidad' },
  { value: 'lowPower', label: 'Baja Potencia' },
  { value: 'lowBattery', label: 'Batería Baja' },
  { value: 'geofenceEnter', label: 'Entró a Geozona' },
  { value: 'geofenceExit', label: 'Salió de Geozona' },
  { value: 'tampering', label: 'Manipulación' },
] as const;

export function getAlertConfig(eventType: string): TypeConfig {
  return ALERT_TYPE_CONFIG[eventType] ?? {
    type: eventType,
    label: eventType,
    description: '',
    icon: '❓',
    color: '#6b7280',
    severity: 'info',
    category: 'other',
    configRequirements: {},
  };
}

export function getTypesByCategory(): Record<string, TypeConfig[]> {
  const result: Record<string, TypeConfig[]> = {};
  for (const config of Object.values(ALERT_TYPE_CONFIG)) {
    if (!result[config.category]) {
      result[config.category] = [];
    }
    result[config.category].push(config);
  }
  return result;
}

export function hasConfigRequirements(type: string): boolean {
  const config = ALERT_TYPE_CONFIG[type];
  if (!config) return false;
  return Object.values(config.configRequirements).some(v => v === true);
}

/**
 * Validates wizard config against the requirements declared in ALERT_TYPE_CONFIG.
 * Returns the first validation error found, or null if all requirements are satisfied.
 *
 * This replaces the hardcoded if/else chain in AlertWizard — adding a new requirement
 * type only requires updating this map, not the wizard logic.
 */
export function validateAlertConfig(
  type: string,
  config: AlertWizardConfig,
): string | null {
  const requirements = ALERT_TYPE_CONFIG[type]?.configRequirements;
  if (!requirements) return null;

  const checks: { flag: keyof typeof requirements; field: keyof AlertWizardConfig; message: string }[] = [
    { flag: 'needsGeofence', field: 'geofenceId', message: 'Selecciona una geozona' },
    { flag: 'needsSpeedLimit', field: 'speedLimit', message: 'Ingresa un límite de velocidad' },
    { flag: 'needsAlarmSubtype', field: 'alarmSubtype', message: 'Selecciona un subtipo de alarma' },
    { flag: 'needsMaintenanceId', field: 'maintenanceId', message: 'Selecciona un mantenimiento' },
    { flag: 'needsDriverId', field: 'driverId', message: 'Selecciona un conductor' },
    { flag: 'needsCommandId', field: 'commandId', message: 'Selecciona un comando' },
  ];

  for (const check of checks) {
    if (requirements[check.flag] && !config[check.field]) {
      return check.message;
    }
  }

  return null;
}

/**
 * Available notification channels. Single source of truth — used by
 * AlertWizard, NotificationEditForm, NotificationTable, and AlertsPanel.
 */
export const NOTIFICATOR_OPTIONS = [
  { key: 'web', label: 'Web', icon: '🌐' },
  { key: 'mail', label: 'Email', icon: '✉️' },
  { key: 'sms', label: 'SMS', icon: '📱' },
] as const;

export type NotificatorKey = typeof NOTIFICATOR_OPTIONS[number]['key'];

/** Lookup map for channel labels */
export const NOTIFICATOR_LABELS: Record<string, string> = Object.fromEntries(
  NOTIFICATOR_OPTIONS.map((o) => [o.key, o.label])
);

export interface AlertWizardConfig {
  type: string;
  geofenceId?: number;
  speedLimit?: number; // in knots for the API
  alarmSubtype?: string;
  maintenanceId?: number;
  driverId?: number;
  commandId?: number;
  calendarId?: number;
  deviceIds: number[];
  /** Selected notification channels (e.g. ['web', 'mail']). Defaults to ['web']. */
  notificators: string[];
  /** Whether the alert is always active (true) or calendar-scheduled (false). Defaults to true. */
  always: boolean;
}
