## Exploration: Menu Reorganization by User Profile/Permissions

### Current State

**Frontend Architecture:**
- Single-page dashboard application (`DashboardPage.tsx`) — NO multi-page navigation menu exists today
- All UI is rendered as panels/overlays within one route (`/`)
- React Router only has `/login` and `/` routes
- Collapsible sidebars/panels instead of traditional navigation: `DeviceList` (left), `AlertsPanel` (right), `MapView` (center), modals for reports and alerts

**User Roles (from OpenAPI User schema):**
| Field | Type | Meaning |
|-------|------|---------|
| `administrator` | boolean | Full admin privileges |
| `userLimit` | integer | Max subordinate users (>0 = manager) |
| `readonly` | boolean | Cannot change any settings |
| `deviceReadonly` | boolean | Cannot modify device attributes |
| `limitCommands` | boolean | Cannot send unsupported commands |
| `disabled` | boolean | Account disabled |
| `deviceLimit` | integer | Max devices user can manage |

**Computed Permissions (frontend `permission-utils.ts`):**
| Permission | Logic |
|------------|-------|
| `isAdmin` | `user.administrator === true` |
| `isManager` | `(user.userLimit ?? 0) > 0` |
| `canManage` | `!user.readonly && !user.disabled` |
| `canManageDevices` | `canManage && !user.deviceReadonly` |
| `canManageUsers` | `isAdmin \|\| isManager` |
| `canSendCommands` | `!user.limitCommands` |
| `canCreateAlerts` | `canManage` |
| `canDeleteAlerts` | `canManage` |
| `canEditAlerts` | `canManage` |

**Current Permission Usage in UI:**
- ONLY `AlertsPanel.tsx` uses `usePermissions()` hook today
- Conditionally shows: Clear events button, Delete notification button, Create Alert button
- No other panels check permissions — all users see everything

**API Endpoints Requiring Admin/Manager (`all=true` param):**
- GET `/commands`, `/orders`, `/devices`, `/groups`, `/notifications`, `/geofences`, `/calendars`, `/attributes/computed`, `/drivers`, `/maintenance`
- GET `/users` with `userId` param

**Server-Admin Endpoints (implicitly admin-only):**
- PUT `/server`
- POST `/server/file/{path}`, `/server/reboot`
- GET `/server/gc`, `/server/cache`
- GET `/statistics`

**Current Dashboard UI Panels ("Menu Items"):**
1. **Mi Flota** (`DeviceList`) — device list sidebar with search/filters
2. **Mapa** (`MapView`) — map with device markers, geofences, routes, motion trails
3. **Info Dispositivo** (`DeviceInfoPanel`) — bottom overlay with telemetry and history toggle
4. **Historial** (`HistoryPanel`) — route history for selected device
5. **Rutas** (`RouteLayers` toggle) — show/hide routes on map
6. **Reporte de Flota** (`MileageReport`) — modal with summary report
7. **Alertas** (`AlertsPanel`) — right sidebar with active/configured alerts
8. **Crear Alerta** (`AlertWizard`) — modal to create notifications

### Affected Areas
- `frontend/src/shared/permissions/permission-utils.ts` — extend permission flags for new menu visibility
- `frontend/src/app/DashboardPage.tsx` — conditionally render panels based on permissions
- `frontend/src/features/devices/components/DeviceList.tsx` — hide "Reporte de Flota" button for readonly users
- `frontend/src/features/map/components/DeviceInfoPanel.tsx` — potentially hide command buttons
- `frontend/src/features/alerts/components/AlertsPanel.tsx` — already uses permissions, may need expansion
- New files likely needed: `frontend/src/shared/navigation/` or `frontend/src/shared/menu/` for menu configuration

### Role-to-Panel Visibility Matrix

| Panel / Feature | Admin | Manager | Standard | Readonly | DeviceReadonly | LimitCommands |
|-----------------|-------|---------|----------|----------|----------------|---------------|
| Device List (view) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Map & Markers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Device Info / Telemetry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| History / Routes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports (view) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alerts (view active) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alerts (create/edit/delete) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Device management (CRUD) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Commands (send to device) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Users management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Groups management | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Geofences management | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Calendars management | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Drivers management | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Maintenance management | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Server settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Statistics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Approaches

1. **Inline Permission Gates** — Wrap each panel/button with permission checks directly in components
   - Pros: Simple, no new abstractions, works immediately
   - Cons: Scattered logic, hard to maintain, duplicated checks
   - Effort: Low

2. **Menu Configuration Array** — Define a declarative menu config array with `visibleWhen` predicates
   - Pros: Centralized, easy to audit, can generate both sidebar and mobile menus
   - Cons: Requires refactoring current panel rendering
   - Effort: Medium

3. **Feature Flags + Permissions Store** — Extend Zustand store with feature visibility derived from user
   - Pros: Reactive, can be used anywhere, consistent with existing stores
   - Cons: Slightly more boilerplate
   - Effort: Medium

### Recommendation

Combine approaches 2 and 3:
1. Extend `permission-utils.ts` with `visibleFeatures` or `menuItems` derived from user
2. Create a `menuConfig.ts` that declares all dashboard sections with required permission predicates
3. Use the config to conditionally render panels in `DashboardPage.tsx` and any future navigation

### Risks
- The app currently has NO traditional menu/navigation — "reorganizing menus" may mean creating a navigation system from scratch
- Backend already enforces permissions; frontend hiding is purely UX — API calls will 403 anyway
- `readonly` users should still see all data but not modify; `deviceReadonly` users can modify alerts/geofences but not device fields
- Need to distinguish between "view" and "manage" for each feature category

### Ready for Proposal
Yes. The orchestrator should ask the user:
1. Do they want a traditional sidebar navigation menu with links/pages, or permission-gated panels within the current single-page dashboard?
2. Which specific menu items/features are most important to gate first?
3. Should we add new pages (e.g., /users, /settings) or keep everything in the dashboard?
