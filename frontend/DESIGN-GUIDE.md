# MSGLOBAL GPS — Design Guide

## Filosofía

Todo el estilo es **CSS puro inline** (via `style` prop con objetos `CSSProperties`) o **bloques `<style>`** para componentes complejos. No usamos Tailwind ni frameworks de CSS.

---

## Paleta de Colores

### App (Dark Theme — Dashboard)

| Token | Hex | Uso |
|---|---|---|
| `--bg-app` | `#020617` | Fondo general |
| `--bg-sidebar` | `#0f172a` | Sidebar, header |
| `--bg-card` | `rgba(15, 23, 42, 0.85)` | Cards, paneles glassmorphism |
| `--bg-header` | `#0f172a` | Header principal |
| `--accent` | `#6366f1` | Accento primario (indigo) |
| `--accent-hover` | `#818cf8` | Hover de acento |
| `--accent-glow` | `rgba(99, 102, 241, 0.3)` | Glow/sombra de acento |
| `--text-primary` | `#f8fafc` | Texto principal |
| `--text-secondary` | `#94a3b8` | Texto secundario |
| `--text-muted` | `#64748b` | Texto terciario/placeholders |
| `--border` | `rgba(255, 255, 255, 0.12)` | Bordes glass |
| `--border-focus` | `rgba(99, 102, 241, 0.5)` | Bordes en focus/selected |
| `--status-online` | `#22c55e` | Online/activo |
| `--status-offline` | `#64748b` | Offline/inactivo |
| `--status-unknown` | `#f59e0b` | Desconocido/warning |
| `--status-error` | `#ef4444` | Error |

### Login (Light Theme)

| Rol | Hex | Uso |
|---|---|---|
| Brand primary | `#1d4ed8` | Botones, links, acentos |
| Brand dark | `#020617` | Headings |
| Text heading | `#0f172a` | Títulos |
| Text body | `#334155` | Párrafos |
| Text label | `#1e293b` | Labels |
| Text secondary | `#475569` | Copy, descripciones |
| Placeholder | `#64748b` | Inputs placeholder |
| Border input | `#cbd5e1` | Bordes de inputs |
| Border focus | `#2563eb` | Border on focus |
| Ring focus | `#dbeafe` | Ring de focus |
| Error text | `#b91c1c` | Mensajes de error |
| Error border | `#f87171` | Borde de input con error |
| Error ring | `#fee2e2` | Ring de error |
| Error bg | `#fef2f2` | Fondo de alerta |
| Error border | `#fecaca` | Borde de alerta |
| Brand bg | `#f8fafc` | Sidebar brand |
| Divider | `#e2e8f0` | Bordes suaves |
| Badge bg | `#ffffff` | Badges, cards |
| Badge border | `#dbeafe` | Borde de badge |
| Benefit icon bg | `#eff6ff` | Fondo de iconos benefit |

---

## Tipografía

| Elemento | Font | Peso | Ejemplo |
|---|---|---|---|
| Headings (h1-h4) | `'Outfit', sans-serif` | 700-900 | Dashboard headers, form titles |
| Body | `'Inter', -apple-system, sans-serif` | 400-600 | Texto general, labels, inputs |
| Logo principal | `'Outfit', sans-serif` | 900 | "MSGLOBAL GPS" |
| Labels de formulario | `'Inter'` | 900 | "Correo electrónico" |
| Texto pequeño | `'Inter'` | 500-600 | Descripciones, badges |

### Escala (Login)

| Elemento | Tamaño | Line-height | Letter-spacing |
|---|---|---|---|
| Logo h1 | `56px` | `0.95` | `-0.06em` |
| Form h2 | `40px` | `1` | `-0.055em` |
| Body copy | `18px` | `1.65` | normal |
| Form subtitle | `16px` | `1.55` | normal |
| Labels | `14px` | `1.2` | normal |
| Input text | `16px` | normal | normal |
| Badge text | `11px` | normal | `0.18em` (uppercase) |
| Error text | `14px` | normal | normal |
| Secure copy | `14px` | `1.5` | normal |

---

## Espaciado

| Token | Valor | Uso |
|---|---|---|
| `xs` | `4px` | Gaps mínimos |
| `sm` | `8px` | Gap entre label e input, icono-badge |
| `md` | `12-16px` | Padding de benefit cards, gaps internos |
| `lg` | `24px` | Gap entre campos de formulario |
| `xl` | `32px` | Margen de form-header, gap de benefit-list |
| `2xl` | `48px` | Padding lateral del sidebar, padding de panel |
| `3xl` | `56px` | Padding del panel login |

### Reglas

- **Inputs**: alto `56px`, border-radius `16px`, padding-left `48px` (espacio para icono)
- **Botones CTA**: alto `56px`, border-radius `16px`
- **Cards/Benefits**: border-radius `18px`, padding `16px`
- **Shell**: border-radius `32px`
- **Error banner**: border-radius `16px`

---

## Iconografía

- Librería: **Lucide React** (`lucide-react`)
- Wrapper: componentes en `@shared/ui/icons.tsx` con props `size`, `style`, `className`, `color`, `strokeWidth`
- Tamaños comunes: `14` (badges), `16` (labels), `18-20` (iconos decorativos), `25` (iconos principales)
- Iconos dentro de inputs: `20px`, posicionados con `position: absolute`, `left: 16px` / `right: 16px`, `top: 50%`, `transform: translateY(-50%)`

---

## Componentes del Design System

### Input con Icono

```
Estructura: div.input-shell > svg.input-icon + input (+ svg.input-icon-right)
- Alto: 56px
- Border: 1px solid #cbd5e1
- Border-radius: 16px
- Padding: 0 16px 0 48px (icono izquierdo) / 0 48px 0 48px (iconos ambos lados)
- Font-size: 16px, font-weight: 600
- Focus: border-color #2563eb, box-shadow 0 0 0 4px #dbeafe
- Error: border-color #f87171, focus ring #fee2e2
- Disabled: background #f8fafc, color #64748b, cursor not-allowed
```

### Botón CTA Primario

```
- Alto: 56px
- Border-radius: 16px
- Background: #1d4ed8
- Color: #ffffff
- Font-size: 16px, font-weight: 900
- Shadow: 0 14px 28px rgba(37, 99, 235, 0.22)
- Hover: background #1e40af, translateY(-1px)
- Focus-visible: outline none, box-shadow 0 0 0 4px #dbeafe
- Disabled: opacity 0.7, cursor not-allowed
- Spinner: 16px circle, border 2px rgba(255,255,255,0.45), border-top #fff
```

### Error Banner

```
- Border-radius: 16px
- Border: 1px solid #fecaca
- Background: #fef2f2
- Color: #b91c1c
- Padding: 12px 16px
- Font-size: 14px, font-weight: 700
- Role: alert
```

### Benefit Card

```
- Display: flex, align-items: center, gap: 16px
- Padding: 16px
- Border-radius: 18px
- Border: 1px solid #e2e8f0
- Background: #ffffff
- Shadow: 0 1px 2px rgba(15, 23, 42, 0.05)
- Icon box: 48x48px, border-radius 14px, background #eff6ff, color #1d4ed8
```

### Glass Card (Dashboard)

```
- Background: var(--bg-card) = rgba(15, 23, 42, 0.85)
- Backdrop-filter: blur(8px-12px)
- Border: 1px solid rgba(255, 255, 255, 0.12)
- Border-radius: 0.75rem
- Hover: border-color rgba(99, 102, 241, 0.5), translateY(-2px)
- Shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5)
```

### Status Badge

```
- Display: inline-flex, align-items: center, gap: 0.375rem
- Padding: 0.25rem 0.625rem
- Border-radius: 9999px
- Font-size: 0.75rem
- Background: {color}20 (color con 12.5% opacidad)
- Color: color del estado
- Dot: 0.625rem, border-radius: 50%, boxShadow si online
```

---

## Layout Login

```
┌──────────────────────────────────────────────┐
│               .login-screen                   │
│  (fixed, inset 0, flex center, padding 32px) │
│  background: radial-gradient + grid overlay   │
│                                               │
│  ┌─────────────┬─────────────────────────┐   │
│  │ .login-brand │      .login-panel        │   │
│  │  (430px col) │    (1fr, flex center)   │   │
│  │              │                          │   │
│  │  [badge]     │   ┌─ .login-form-wrap ─┐│   │
│  │  MSGLOBAL    │   │ form-icon (56x56)  ││   │
│  │  GPS         │   │ h2 "Iniciar sesión"││   │
│  │              │   │ p subtitle         ││   │
│  │  copy text   │   │                     ││   │
│  │              │   │ [error?]            ││   │
│  │  benefit-list│   │ .login-form (grid)  ││   │
│  │  ┌─────────┐ │   │   field-group       ││   │
│  │  │icon+title│ │   │   field-group       ││   │
│  │  └─────────┘ │   │   form-options      ││   │
│  │  ┌─────────┐ │   │   submit-button     ││   │
│  │  │icon+title│ │   │                     ││   │
│  │  └─────────┘ │   │ secure-copy         ││   │
│  │  ┌─────────┐ │   └────────────────────┘│   │
│  │  │icon+title│ │                          │   │
│  │  └─────────┘ │                          │   │
│  └─────────────┴─────────────────────────┘   │
└──────────────────────────────────────────────┘

Grid: grid-template-columns: 430px 1fr
Shell: border-radius 32px, border 1px, max-width min(100%, 1040px)
```

### Breakpoints

| Query | Cambios |
|---|---|
| `≤ 900px` | Grid → 1 columna, .login-brand hidden, shell width 520px, padding 32px 24px |
| `≤ 600px` | .form-options → columna, gap 12px |
| `≤ 420px` | Shell border-radius 24px, padding reducido |

---

## Convenciones de Accesibilidad

- Todo input con `id` + `<label htmlFor>`
- `aria-invalid` en inputs con error
- `aria-describedby` vinculado al mensaje de error
- `role="alert"` en banners de error
- `focus-visible` rings en botones y links
- `aria-label` en botones de toggle (mostrar/ocultar contraseña)
- `aria-hidden="true"` en iconos decorativos SVG

---

## Animaciones

| Nombre | Definition | Uso |
|---|---|---|
| `login-spin` | `to { transform: rotate(360deg) }` | Spinner de botón submit |
| `pulse-soft` | `scale(1) → scale(1.1) opacity 0.8 → scale(1)` | Status dot online |
| `pulse` (inline) | `opacity 1 → 0.4 → 1` | WS reconnecting |

### Transiciones comunes

| Propiedad | Duración | Easing | Uso |
|---|---|---|---|
| border-color, box-shadow | `160ms` | `ease` | Input focus, error |
| all (buttons, cards) | `200ms` | `cubic-bezier(0.4, 0, 0.2, 1)` | Hover, selected |
| transform (CTA hover) | `160ms` | `ease` | Submit button hover translateY |

---

## Sombras

| Nombre | Valor | Uso |
|---|---|---|
| Shell | `0 30px 90px rgba(15, 23, 42, 0.18)` | Login shell card |
| CTA | `0 14px 28px rgba(37, 99, 235, 0.22)` | Botón submit |
| Focus ring | `0 0 0 4px #dbeafe` | Input/button focus |
| Error ring | `0 0 0 4px #fee2e2` | Input error focus |
| Card subtle | `0 1px 2px rgba(15, 23, 42, 0.05)` | Benefit cards |
| Badge subtle | `0 1px 2px rgba(15, 23, 42, 0.06)` | Login badge |
| Glass (dark) | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)` | Dashboard glass cards |

---

## Patrones CSS

- **Componentes complejos (login)**: Bloque `<style>` dentro del componente, con clases BEM-like (`.login-screen`, `.login-shell`, `.input-shell`)
- **Componentes del dashboard**: Inline `style` con objetos `CSSProperties` constantes
- **Utilidades globales**: Clases en `global.css` (`.glass`, `.card-premium`, `.animate-pulse-online`)
- **Variables CSS**: Definidas en `:root` en `global.css`, referenciadas en inline styles como `var(--nombre)`