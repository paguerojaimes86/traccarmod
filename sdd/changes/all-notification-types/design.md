# Design: all-notification-types

## Technical Approach

Replace the hardcoded 2-type alert wizard with a dynamic system that supports all 30+ Traccar notification types. The type map in `alert-types.ts` becomes the single source of truth for type metadata (icons, labels, descriptions, config requirements, categories). The wizard dynamically adapts its step flow based on each type's `configRequirements` — zero-config types skip the config step entirely.

## Architecture Decisions

### Decision: Static type map vs dynamic from API

**Choice**: Static comprehensive type map in `alert-types.ts`
**Alternatives considered**:
- Dynamic from `/notifications/types` API (returns only `{ type: string }` — no icons, labels, descriptions)
- Hybrid (static map + API validation on mount)
**Rationale**: API returns bare type strings with zero metadata. Static map provides rich UI with icons, labels, descriptions, severity, color, and config hints. Unknown types from future Traccar versions fall back gracefully via `getAlertConfig()` default.

### Decision: Dynamic wizard step flow

**Choice**: Skip config step for zero-config types (~70% of types)
**Alternatives considered**: Always show config step with "no config needed" message
**Rationale**: Better UX — users don't waste a step seeing empty content. 22 of 30+ types need zero config. Step indicator dynamically adjusts to 3 or 4 steps.

### Decision: Generic AlertWizardConfig with optional fields

**Choice**: Single config object with all optional fields (`geofenceId?`, `speedLimit?`, `alarmSubtype?`, etc.)
**Alternatives considered**: Discriminated union type per config variant
**Rationale**: Simpler wizard state management. Only relevant fields are populated based on selected type. No complex type narrowing needed in UI components.

### Decision: Icon strategy — Lucide React wrappers

**Choice**: Add new icon wrappers to `icons.tsx` using existing Lucide React imports
**Alternatives considered**: Emoji-only icons, custom SVG icons
**Rationale**: Consistent with existing pattern. Lucide has icons for all needed types (Fuel, Wrench, Key, User, Calendar, etc.). Maintains visual consistency across the app.

## Data Flow

```
User opens wizard
    ↓
Step 1: AlertTypeSelect (displays all types from ALERT_TYPE_CONFIG, grouped by category)
    ↓
User selects type (e.g., "geofenceExit")
    ↓
Check configRequirements[type]
    ↓ (has requirements)
Step 2: AlertConfig (shows relevant fields: geofence picker, speed input, alarm subtype)
    ↓ (or skip if zero-config — goes directly to Step 3)
Step 3: AlertDeviceSelect (multi-select devices)
    ↓
Step 4: Confirm → createNotification + linkNotification
    ↓
POST /notifications { type, notificators, always, attributes }
    ↓
POST /permissions { geofenceId?, maintenanceId?, driverId?, calendarId?, commandId?, notificationId }
POST /permissions { deviceId, notificationId } × N devices
POST /permissions { userId, notificationId }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/shared/lib/alert-types.ts` | **Rewrite** | Add 30+ types with configRequirements, category grouping, extended TypeConfig interface |
| `src/features/alerts/components/AlertTypeSelect.tsx` | **Rewrite** | Dynamic grid from type map with search/filter, category headers, scrollable |
| `src/features/alerts/components/AlertConfig.tsx` | **Rewrite** | Adaptive config based on type requirements (geofence, speed, alarm subtype) |
| `src/features/alerts/components/AlertWizard.tsx` | **Modify** | Dynamic step flow (3 or 4 steps), generic config type, type-aware validation |
| `src/features/notifications/hooks/useLinkNotification.ts` | **Modify** | Support maintenanceId, driverId, calendarId, commandId params |
| `src/shared/ui/icons.tsx` | **Modify** | Add missing icon wrappers: Fuel, Wrench, Key, User, Calendar, Power, Thermometer, Zap, Shield, etc. |

## Interfaces / Contracts

```typescript
// alert-types.ts — extended TypeConfig
export interface TypeConfig {
  type: string;
  label: string;
  description: string;
  icon: string; // Lucide icon component name (e.g., "IconRoute")
  color: string;
  severity: 'critical' | 'high' | 'low' | 'info';
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

// Generic wizard config — all optional except type and deviceIds
export interface AlertWizardConfig {
  type: string; // was: 'geofenceExit' | 'deviceOverspeed'
  geofenceId?: number;
  speedLimit?: number; // stored in knots for API
  alarmSubtype?: string;
  maintenanceId?: number;
  driverId?: number;
  commandId?: number;
  deviceIds: number[];
}

// useLinkNotification.ts — extended params
interface LinkNotificationParams {
  notificationId: number;
  deviceIds: number[];
  geofenceId?: number;
  maintenanceId?: number;
  driverId?: number;
  calendarId?: number;
  commandId?: number;
}
```

## Type Map — All 30+ Types

### Status (8 types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `deviceOnline` | IconSignal | #10b981 | info | none |
| `deviceOffline` | IconSignalOff | #6b7280 | info | none |
| `deviceMoving` | IconNavigation | #3b82f6 | info | none |
| `deviceStopped` | IconCircleStop | #6b7280 | info | none |
| `deviceUnknown` | IconHelpCircle | #94a3b8 | info | none |
| `ignitionOn` | IconKey | #10b981 | info | none |
| `ignitionOff` | IconKey | #6b7280 | info | none |
| `commandResult` | IconTerminal | #6366f1 | info | none |

### Geofence (4 types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `geofenceEnter` | IconRoute | #22c55e | low | needsGeofence |
| `geofenceExit` | IconRoute | #f97316 | high | needsGeofence |
| `geofenceInside` | IconMapPinned | #3b82f6 | info | needsGeofence |
| `geofenceOutside` | IconMapPinned | #f59e0b | high | needsGeofence |

### Speed (2 types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `deviceOverspeed` | IconGauge | #ef4444 | high | needsSpeedLimit |
| `speedLimit` | IconGauge | #f59e0b | info | needsSpeedLimit |

### Alarm (10+ types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `alarm` | IconAlertTriangle | #ef4444 | critical | needsAlarmSubtype |
| `deviceBattery` | IconBattery | #f59e0b | high | none |
| `devicePowerCut` | IconPower | #ef4444 | critical | none |
| `deviceTampering` | IconShieldAlert | #ef4444 | critical | none |
| `devicePanic` | IconSiren | #ef4444 | critical | none |
| `deviceAccident` | IconCarCrash | #ef4444 | critical | none |
| `deviceLowBattery` | IconBatteryWarning | #f59e0b | high | none |
| `deviceCharging` | IconBatteryCharging | #10b981 | info | none |
| `deviceFullCharged` | IconBatteryFull | #10b981 | info | none |
| `deviceDoor` | IconDoorOpen | #f59e0b | info | none |
| `deviceTemperature` | IconThermometer | #f59e0b | info | none |
| `deviceTowing` | IconTruck | #ef4444 | critical | none |

### Fuel (2 types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `deviceFuelDrop` | IconFuel | #ef4444 | high | none |
| `deviceFuelIncrease` | IconFuel | #10b981 | info | none |

### Maintenance (2 types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `maintenance` | IconWrench | #f59e0b | info | needsMaintenanceId |
| `deviceServiceDue` | IconWrench | #ef4444 | high | needsMaintenanceId |

### Other (4+ types)
| Type | Icon | Color | Severity | Config |
|------|------|-------|----------|--------|
| `deviceMotion` | IconActivity | #3b82f6 | info | none |
| `deviceIdle` | IconClock | #94a3b8 | info | none |
| `driverChanged` | IconUser | #3b82f6 | info | none |
| `media` | IconCamera | #6366f1 | info | none |

## AlertTypeSelect — Dynamic Grid

```
┌─────────────────────────────────────────────┐
│ 🔍  Buscar tipo de alerta...                │
├─────────────────────────────────────────────┤
│ ESTADO                                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │ 📶   │ │ 📵   │ │ 🚗   │ │ 🅿️   │        │
│ │En Línea│Sin Conex│En Movim│Detenido│     │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
│                                             │
│ GEOZONA                                     │
│ ┌──────┐ ┌──────┐                          │
│ │ 🟢   │ │ 🔴   │                          │
│ │Entró │ │Salió │                          │
│ └──────┘ └──────┘                          │
│                                             │
│ VELOCIDAD                                   │
│ ┌──────┐                                    │
│ │ 🚀   │                                    │
│ │Exceso│                                    │
│ └──────┘                                    │
│ ...                                         │
└─────────────────────────────────────────────┘
```

- Search filters types by label and description (case-insensitive)
- Categories shown only if they have matching types (after search)
- Grid: `gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'`
- Scrollable container with `maxHeight: '400px'`
- Card hover effect with type color glow

## AlertConfig — Adaptive Rendering

```typescript
// Pseudo-logic
const req = ALERT_TYPE_CONFIG[type]?.configRequirements;

if (req?.needsGeofence) {
  // Show geofence dropdown from useGeofences()
  return <GeofencePicker value={config.geofenceId} onChange={...} />;
}
if (req?.needsSpeedLimit) {
  // Show speed input with km/h → knots conversion
  return <SpeedInput value={config.speedLimit} onChange={...} />;
}
if (req?.needsAlarmSubtype) {
  // Show alarm subtype dropdown (sos, powerCut, etc.)
  return <AlarmSubtypePicker value={config.alarmSubtype} onChange={...} />;
}
if (req?.needsMaintenanceId) {
  // Show maintenance dropdown (future — placeholder for now)
  return <Placeholder message="Maintenance selection coming soon" />;
}
// Zero-config type
return <InfoMessage>No additional configuration needed</InfoMessage>;
```

## AlertWizard — Dynamic Step Flow

```typescript
const hasConfig = ALERT_TYPE_CONFIG[config.type]?.configRequirements
  && Object.values(ALERT_TYPE_CONFIG[config.type].configRequirements).some(Boolean);

const steps = hasConfig
  ? [
      { key: 'type', label: 'Tipo' },
      { key: 'config', label: 'Config' },
      { key: 'devices', label: 'Dispositivos' },
      { key: 'confirm', label: 'Confirmar' },
    ]
  : [
      { key: 'type', label: 'Tipo' },
      { key: 'devices', label: 'Dispositivos' },
      { key: 'confirm', label: 'Confirmar' },
    ];
```

- For zero-config types: Step 1 (type) → Step 2 (devices) → Step 3 (confirm)
- For config types: Step 1 (type) → Step 2 (config) → Step 3 (devices) → Step 4 (confirm)
- Validation is type-aware: checks `configRequirements` to determine what's required
- `handleConfirm` builds attributes dynamically based on type

## useLinkNotification — Extended Permission Linking

```typescript
// For each param that exists, POST the appropriate permission pair
const results = await Promise.allSettled([
  // Type-specific resource link
  geofenceId ? apiClient.POST('/permissions', { body: { geofenceId, notificationId } }) : skip,
  maintenanceId ? apiClient.POST('/permissions', { body: { maintenanceId, notificationId } }) : skip,
  driverId ? apiClient.POST('/permissions', { body: { driverId, notificationId } }) : skip,
  calendarId ? apiClient.POST('/permissions', { body: { calendarId, notificationId } }) : skip,
  commandId ? apiClient.POST('/permissions', { body: { commandId, notificationId } }) : skip,
  // Device links (always)
  ...deviceIds.map(deviceId => apiClient.POST('/permissions', { body: { deviceId, notificationId } })),
  // User link (always)
  user?.id ? apiClient.POST('/permissions', { body: { userId: user.id, notificationId } }) : skip,
]);
```

## Testing Strategy

No test runner available — manual testing only.

**Manual test matrix**:
1. Create zero-config alert (deviceOnline) → wizard should skip config step
2. Create geofence alert (geofenceExit) → geofence dropdown required
3. Create overspeed alert (deviceOverspeed) → speed input required, km/h → knots conversion
4. Create alarm alert → alarm subtype dropdown shown
5. Search filter in AlertTypeSelect → should filter by label and description
6. Category grouping → types grouped correctly, empty categories hidden after search
7. Permission linking → verify all permission pairs created for each type

## Migration / Rollout

No migration required. Existing notifications continue to work. The `AlertWizardConfig` type change from union to `string` is backward compatible — existing `'geofenceExit' | 'deviceOverspeed'` values are valid strings.

## Open Questions

- [ ] Should calendar integration for notification scheduling be implemented now? (deferred — calendarId support added to linkNotification but no UI)
- [ ] Should maintenance/driver dropdowns be implemented now or deferred? (deferred — show placeholder message)
- [ ] Should multiple notification channels (email, SMS) be supported? (deferred — hardcoded to `'web'` for now)
- [ ] Should alarm subtype list be dynamic from API or static? (static for now — common subtypes: sos, powerCut, powerRestore, lowBattery, etc.)
