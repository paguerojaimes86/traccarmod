---
name: traccar-patterns
description: >
  Project-specific patterns for the MSGLOBAL GPS Traccar dashboard frontend.
  Trigger: When writing React components, hooks, stores, API calls, or UI for this project.
  Always load before implementing features in the traccar frontend.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Writing React components, hooks, or stores for this project
- Creating new features under `src/features/`
- Adding API integration endpoints
- Managing state with Zustand
- Working with the WebSocket connection
- Building UI components (sidebar, panels, overlays, wizards)
- Implementing role-based permissions
- Adding new navigation sections

## Critical Patterns

### 1. File Structure Convention

```
frontend/src/
  app/
    App.tsx              # Routes + AuthRedirect + AppHeader
    DashboardPage.tsx    # Main layout (icon-nav + sidebar + map)
    providers.tsx         # QueryClientProvider + ErrorBoundary
  features/
    {feature-name}/
      components/        # React components (PascalCase.tsx)
      hooks/             # Custom hooks (use{Name}.ts)
      services/          # Service modules (websocket.ts, etc.)
      store.ts           # Zustand store (if feature needs local state)
  shared/
    api/
      client.ts          # openapi-fetch client with auth interceptor
      generated/schema.d.ts  # Auto-generated types (DO NOT EDIT)
      types.models.ts    # Re-exports: type X = components['schemas']['X']
      types.ts           # Re-exports: type { paths, components, operations }
      index.ts           # Public barrel export
    components/          # Shared components (ProtectedRoute, etc.)
    hooks/               # Shared hooks (useUnitConversion, etc.)
    lib/
      constants.ts       # QUERY_KEYS, WS_URL, defaults
      ui-store.ts        # Global UI state (sidebar, theme, units, wsStatus)
      units.ts           # Formatting utilities
      wkt.ts             # WKT → GeoJSON conversion
    permissions/
      usePermissions.ts  # Centralized permissions hook
      permission-utils.ts # Pure functions for permission checks
      index.ts
    types/
      index.ts           # Re-exports
    ui/                  # Shared UI primitives (StatusBadge, ErrorState, icons)
```

### 2. Zustand Store Pattern

ALL stores follow this exact pattern:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Separate State and Actions interfaces
interface FeatureState {
  // state fields
}
interface FeatureActions {
  // setter methods
}

// 2. Use create with persist ONLY for fields that survive refresh
export const useFeatureStore = create<FeatureState & FeatureActions>()(
  persist(
    (set) => ({
      // 3. Default values
      selectedId: null,

      // 4. Actions (use set() with partial objects)
      setSelectedId: (id) => set({ selectedId: id }),
    }),
    {
      name: 'traccar-feature',  // 5. Always prefixed with 'traccar-'
      partialize: (state) => ({
        // 6. ONLY persist what must survive refresh
        // Never persist derived state, temporary flags, or large collections
      }),
    },
  ),
);
```

**Store naming**: `useAuthStore`, `useMapStore`, `useUiStore`, `useAlertStore`, `useNavigationStore` — always `use{Name}Store`.

**Store location**: Each feature that needs local state gets its own `store.ts` inside the feature folder. Global UI state goes in `shared/lib/ui-store.ts`.

### 3. React Query Hook Pattern

ALL data-fetching hooks follow this pattern:

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { QUERY_KEYS } from '@shared/lib/constants';

export function useFeatureItems() {
  return useQuery({
    queryKey: QUERY_KEYS.featureItems,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/endpoint');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,  // 30s default for most data
  });
}
```

**Convention**:
- Query keys go in `shared/lib/constants.ts` as `QUERY_KEYS`
- All API calls use `apiClient.GET/POST/PUT/DELETE` (typed via openapi-fetch)
- Error handling: `if (error) throw error` — let React Query handle it
- Default `staleTime: 30_000` (matches QueryClient default)
- Fallback: `return data ?? []` for lists, `return data!` for single items

### 4. API Client Pattern

```typescript
// shared/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './generated/schema';
import { useAuthStore } from '@features/auth/store';

const BASE_URL = '/api';

export const apiClient = createClient<paths>({
  baseUrl: BASE_URL,
  fetch: async (request: Request) => {
    const { token } = useAuthStore.getState();
    const headers = new Headers(request.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const newRequest = new Request(request, { headers, credentials: 'include' });
    const response = await globalThis.fetch(newRequest);
    // Auto-logout on 401
    if (response.status === 401 && !request.url.includes('/session')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return response;
  },
});
```

**NEVER** use raw `fetch()`. Always use `apiClient` for type safety.

### 5. WebSocket Pattern

The project uses a singleton WebSocket service at `features/positions/services/websocket.ts`:

```typescript
// Service: singleton with listener pattern
export const wsService = {
  connect(),
  disconnect(),
  onPosition(handler): () => void,  // returns unsubscribe fn
  onStatus(handler): () => void,
  onEvent(handler): () => void,      // NEW for alerts
};

// Hook: manages lifecycle
export function useWebSocket() {
  // 1. Connect on mount, disconnect on unmount
  // 2. Forward positions to React Query cache
  // 3. Invalidate devices query with 30s throttle
  // 4. Forward events to AlertStore
}
```

**WebSocket message types** (from Traccar backend):
- `{ type: "positions", data: Position[] }` — already handled
- `{ type: "devices", data: Device[] }` — already handled
- `{ type: "events", data: Event[] }` — NEW, to be added

### 6. Permissions Hook Pattern

```typescript
// shared/permissions/usePermissions.ts
import { useAuthStore } from '@features/auth/store';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  if (!user) return ALL_FALSE_PERMS;

  const canManage = !user.readonly && !user.disabled;

  return {
    isAdmin: user.administrator === true,
    isManager: (user.userLimit ?? 0) > 0,
    canManage,
    canManageDevices: canManage && !user.deviceReadonly,
    canManageUsers: user.administrator || (user.userLimit ?? 0) > 0,
    canSendCommands: !user.limitCommands,
    canCreateAlerts: canManage,
    canDeleteAlerts: canManage,
    canEditAlerts: canManage,
  };
}
```

**Usage**: Import `usePermissions()` in ANY component that needs to show/hide UI based on role. This is the SINGLE SOURCE OF TRUTH for all permission checks. NEVER check `user.administrator` or `user.readonly` directly.

### 7. Navigation Pattern

The dashboard uses an icon-nav sidebar with section switching:

```typescript
// shared/lib/navigation-store.ts
interface NavigationState {
  activeSection: 'fleet' | 'alerts';  // extensible: 'settings' | 'users' | ...
}
```

The sidebar content changes based on `activeSection`. The icon-nav (56px vertical bar) is always visible. When adding a new section:
1. Add section key to `NavigationState` type
2. Add icon to `IconNav` component
3. Add content component to `SidebarContent`
4. DO NOT create separate routes — it's a single-page app with sidebar sections

### 8. Component Style Pattern

All components use **inline CSSProperties** (no CSS modules, no Tailwind utility classes in the source):

```typescript
const cardStyle: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: '0.875rem',
  // ...
};
```

**Design system values** (from DESIGN-GUIDE.md):
- Primary accent: `#6366f1` (indigo)
- Success: `#10b981`, Warning: `#f59e0b`, Danger: `#ef4444`
- Font: Outfit (headings, labels), system stack (body)
- Glass effect: `rgba(255, 255, 255, 0.92)` + `backdropFilter: 'blur(16px)'`
- Border: `1px solid rgba(15, 23, 42, 0.08)`
- Border radius: `0.875rem` (cards), `0.625rem` (items), `9999px` (badges/pills)

### 9. Type Import Pattern

```typescript
// Re-exported types from shared
import type { Device, Position, Event, Notification, Geofence } from '@shared/api/types.models';
import type { paths, components, operations } from '@shared/api/types';

// NEVER import from 'generated/schema' directly in feature code
// Use types.models.ts which provides clean re-exports
```

### 10. Unit Conversion Pattern

Speed and distance always use the conversion hook:

```typescript
import { useUnitConversion } from '@shared/hooks/useUnitConversion';

const { formatSpeed, formatDistance } = useUnitConversion();
formatSpeed(knots, decimals)  // Returns "80 km/h" or "50 mph" based on user pref
formatDistance(meters, decimals) // Returns "15 km" or "9 mi" based on user pref
```

Speed from Traccar API is ALWAYS in knots. Convert to user preference (km/h or mph) using this hook.

### 11. Add New Query Keys Pattern

When adding a new feature, add keys to `shared/lib/constants.ts`:

```typescript
export const QUERY_KEYS = {
  devices: ['devices'] as const,
  device: (id: number) => ['devices', id] as const,
  allPositions: ['positions'] as const,
  positions: (params: { deviceId: number; from: string; to: string }) => ['positions', params] as const,
  geofences: ['geofences'] as const,
  session: ['session'] as const,
  groups: ['groups'] as const,
  reports: ['reports'] as const,
  // ADD NEW KEYS HERE:
  notifications: ['notifications'] as const,
  notificationTypes: ['notificationTypes'] as const,
  events: ['events'] as const,
  reportEvents: (params: Record<string, unknown>) => ['reportEvents', params] as const,
} as const;
```

Always use `as const` for type safety. Never create query keys inline.

## Commands

```bash
# Generate types from OpenAPI spec
cd frontend && npm run generate

# Run dev server
cd frontend && npm run dev

# Run tests
cd frontend && npm run test

# Run tests in watch mode
cd frontend && npm run test:watch

# Lint
cd frontend && npm run lint

# Format
cd frontend && npm run format
```

## Traccar API Quick Reference

### Event Types (from Event.java source)
| Type String | Description |
|------------|-------------|
| `deviceOverspeed` | Speed exceeded limit |
| `geofenceEnter` | Device entered geofence |
| `geofenceExit` | Device exited geofence |
| `deviceOnline` | Device came online |
| `deviceOffline` | Device went offline |
| `deviceMoving` | Device started moving |
| `deviceStopped` | Device stopped |
| `deviceUnknown` | Device status unknown |
| `ignitionOn` | Ignition turned on |
| `ignitionOff` | Ignition turned off |
| `alarm` | Generic alarm (attributes.alarm has type) |
| `commandResult` | Command execution result |
| `maintenance` | Maintenance due |

### Notification Types (from /notifications/types)
Common types: `deviceOverspeed`, `geofenceEnter`, `geofenceExit`, `ignitionOn`, `ignitionOff`, `deviceOnline`, `deviceOffline`, `deviceMoving`, `deviceStopped`

### Key API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notifications` | GET/POST | List/Create notifications |
| `/notifications/{id}` | PUT/DELETE | Update/Delete notification |
| `/notifications/types` | GET | Available notification types |
| `/permissions` | POST/DELETE | Link/unlink objects (device↔notification, user↔notification, device↔geofence) |
| `/events/{id}` | GET | Get event by ID |
| `/reports/events` | GET | Query events (deviceId, type, from, to) |
| `/geofences` | GET/POST | List/Create geofences |
| `/devices` | GET | List devices |

### Traccar User Role Flags
| Flag | Type | Behavior |
|------|------|----------|
| `administrator` | boolean | Full access to everything |
| `userLimit > 0` | number | Manager — can create subordinate users |
| `readonly` | boolean | Cannot change any settings |
| `deviceReadonly` | boolean | Cannot modify device attributes |
| `limitCommands` | boolean | Cannot send commands |
| `disabled` | boolean | Account is disabled |

### Speed Limits
- Set on `device.attributes.speedLimit` (in knots) or `geofence.attributes.speedLimit`
- `OverspeedEventHandler` checks: position speed limit → geofence speed limit → device speed limit → global config
- `preferLowest` config: when device is in multiple geofences with speed limits, use lowest or highest

## Resources

- **Design Guide**: `frontend/DESIGN-GUIDE.md`
- **OpenAPI Spec**: `api/openapi.yaml`
- **Generated Types**: `frontend/src/shared/api/generated/schema.d.ts`