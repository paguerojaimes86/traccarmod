# MSGLOBAL GPS — Traccar Frontend

## Servidor Backend (Traccar)

| Componente | Detalle |
|---|---|
| **Traccar Server** | v6.12.2 (API OpenAPI 3.1.0) |
| **URL producción** | `https://gps.msglobalgps.com` |
| **Puertos** | 8082 (alternativo) / 80 |
| **Protocolos** | HTTP REST API + WebSocket (`ws: true` en proxy) |
| **Autenticación** | BasicAuth + ApiKey (header) |
| **Base de datos** | Gestionada por Traccar (no en este repo) |

## Frontend (SPA)

| Tecnología | Versión | Rol |
|---|---|---|
| **React** | 19.2.4 | UI framework |
| **React DOM** | 19.2.4 | Renderizado |
| **React Router** | 7.14.0 | Navegación SPA |
| **TypeScript** | ~5.9.3 | Tipado estático |
| **Vite** | 8.0.1 | Build tool + dev server |
| **Zustand** | 5.0.12 | State management |
| **TanStack React Query** | 5.96.2 | Server state / caching |
| **MapLibre GL** | 4.7.1 | Mapas interactivos |
| **Lucide React** | 1.7.0 | Iconos |
| **openapi-fetch** | 0.14.1 | Client API type-safe |
| **openapi-typescript** | 7.13.0 | Generación de tipos desde OpenAPI |
| **xlsx** | 0.18.5 | Exportación Excel |
| **wellknown** | 0.5.0 | Parseo WKT (geometría) |

## Herramientas de Desarrollo

| Tecnología | Versión | Rol |
|---|---|---|
| **Node.js** | 22.22.2 | Runtime |
| **npm** | 10.9.7 | Package manager |
| **ESLint** | 9.39.4 | Linting |
| **Prettier** | 3.8.1 | Formato |
| **Vitest** | 3.2.4 | Testing |
| **Testing Library** | 16.3.2 (React) / 6.9.1 (jest-dom) | Test utils |
| **MSW** | 2.12.14 | API mocking |
| **jsdom** | 26.1.0 | DOM en tests |

## Configuración del Build

| Aspecto | Detalle |
|---|---|
| **Target** | ES2023 |
| **JSX** | react-jsx |
| **Module** | ESNext (bundler) |
| **Module Resolution** | bundler |
| **Strict mode** | Habilitado |
| **Code splitting** | `vendor-react`, `vendor-query`, `vendor-map` |
| **CSS** | Puro — inline styles + `<style>` blocks (sin Tailwind) |
| **Fuentes** | Inter + Outfit (Google Fonts) |
| **Mapa tiles** | MapLibre GL (requiere tileserver externo) |

---

## Consideraciones Críticas para Instalación en Servidor

### 1. Requisitos de Runtime

- **Node.js >= 18** (ideal 22.x para compatibilidad con Vite 8)
- **npm >= 9** (ideal 10.x+)
- El proxy Vite apunta a `https://gps.msglobalgps.com/api` — en producción necesitás configurar el reverse proxy (Nginx/Caddy) para que `/api` derive al backend Traccar

### 2. Reverse Proxy (producción)

El build genera un SPA estático (`dist/`). Necesitás:

- Servir el `dist/` como archivos estáticos
- Proxear `/api` al servidor Traccar (`gps.msgglobalgps.com`)
- Proxear WebSocket para actualizaciones en tiempo real
- Configurar HTTPS (el backend usa SSL)

### 3. Mapas

- MapLibre GL requiere un **tile server** (MapTiler, self-hosted con tileserver-gl, o similar)
- La librería `maplibre-gl.css` se importa en `global.css`
- Verificar CORS del tile server

### 4. Variables de Entorno / Config

- No hay `.env` en el repo — la URL del backend está hardcodeada en `vite.config.ts` (`https://gps.msglobalgps.com`)
- En producción el proxy settings de Vite solo aplica en dev; en prod el server debe manejar `/api` routing

### 5. Build de Producción

```bash
npm install
npm run build
```

Genera `dist/` (~1.3MB).

### 6. Seguridad

- Autenticación: el frontend usa BasicAuth + ApiKey contra la API de Traccar
- CORS debe estar configurado en el servidor Traccar
- HTTPS obligatorio (el backend ya lo exige)

### 7. Dependencias Externas

- Google Fonts (Inter + Outfit) — considerar self-hosting para producción
- Map tiles provider — verificar disponibilidad y límites

---

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Compilar TypeScript + build de producción |
| `npm run preview` | Previsualizar build de producción |
| `npm run lint` | Ejecutar ESLint |
| `npm run format` | Formatear con Prettier |
| `npm run format:check` | Verificar formato |
| `npm run test` | Ejecutar tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run generate` | Regenerar tipos desde OpenAPI |