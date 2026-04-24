## Exploration: HistoryPanel (Replay Panel) Layout & Spacing Issues

### Current State

HistoryPanel.tsx is a floating HUD overlay at the bottom of the map, operating in two visual states:

1. **Pre-load form** (`loaded=false`): Period dropdown, optional custom date pickers, and "CARGAR RECORRIDO" button
2. **Playback HUD** (`loaded=true`): Telemetry grid (speed + timestamp), progress scrubber, play/speed/reset controls, and footer

It replaces DeviceInfoPanel when `showHistory` is true. It's absolutely positioned at `bottom: 2rem; left: 50%; transform: translateX(-50%)`.

---

### Affected Areas

- `frontend/src/features/positions/components/HistoryPanel.tsx` — Primary target, all layout issues
- `frontend/src/features/map/components/DeviceInfoPanel.tsx` — Sibling panel; design conventions should be consistent
- `frontend/src/app/DashboardPage.tsx` — Parent layout rendering conditionally
- `frontend/DESIGN-GUIDE.md` — Reference for tokens and spacing conventions
- `frontend/src/global.css` — CSS variables and base styles

---

### Specific Spacing/Column/Layout Issues (by line number)

#### A. Container (L72-89)

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L86 | `minWidth` | `'450px'` | No `maxWidth`, no responsive. Overflows on screens <450px |
| L78 | `backgroundColor` | `'rgba(255, 255, 255, 0.95)'` | Hardcoded, not `var(--bg-card)`. DeviceInfoPanel uses 0.92 |
| L80 | `borderRadius` | `'1.25rem'` (20px) | Design guide glass card = 0.75rem. DeviceInfoPanel = 0.875rem. Inconsistent |
| L81 | `boxShadow` | `'0 10px 30px …0.12)'` | Doesn't match design guide shadows |
| L74 | `bottom` | `'2rem'` | DeviceInfoPanel uses `'1rem'`. Different positioning |

#### B. Title bar (L91-104)

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L93 | `fontSize` | `'0.8125rem'` (13px) | Small for a heading; design guide has no entry at this size |
| L103 | `marginBottom` | `'0.25rem'` | Extra spacing on top of container gap (1rem) — unpredictable rhythm |

#### C. Telemetry grid (L106-111)

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L109 | `gap` | `'1.5rem'` (24px) | Too much gap between two short-content columns |
| L108 | `gridTemplateColumns` | `'1fr 1fr'` | Timestamps are much wider than speed values — asymmetric looks unbalanced |

#### D. Telemetry box & labels (L113-132)

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L116 | `gap` | `'0.125rem'` (2px) | Only 2px between label and value — visually cramped |
| L120 | `fontSize` | `'0.55rem'` (~8.8px) | **CRITICAL**: Unreadably small. Design guide minimum = 11px |
| L123 | `letterSpacing` | `'0.05em'` | At this tiny size, letter-spacing accentuates illegibility |

#### E. Scrubber (L134-166)

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L137 | `height` | `'6px'` | Very thin — nearly impossible to tap on mobile |
| L139 | `margin` | `'0.5rem 0'` | Competes with container gap |
| — | — | — | No hover/active visual affordance for interactivity |

#### F. Form row & label (L168-180) — Pre-load state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L170 | `gap` | `'0.75rem'` | OK but inconsistent with playback gap of 0.5rem |
| L175 | `fontSize` | `'0.65rem'` (~10.4px) | Below design guide minimum (11px) |
| L178 | `minWidth` | `'4.5rem'` | Fixed width can cause misalignment with varying label text |

#### G. Select / Input (L182-197) — Pre-load state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L184 | `padding` | `'0.5rem 0.75rem'` | Implicit height ~34-36px. **Design guide = 56px** |
| L185 | `borderRadius` | `'0.5rem'` (8px) | Design guide inputs = 16px (1rem) |
| — | — | — | No `height` or `minHeight` to enforce sizing |

#### H. Load button (L199-223) — Pre-load state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L205 | `padding` | `'0.75rem 1rem'` | Implicit height ~36-38px. **Design guide CTA = 56px** |
| L206 | `borderRadius` | `'0.75rem'` (12px) | Design guide CTA = 16px (1rem) |
| L212 | `marginTop` | `'0.5rem'` | Extra spacing beyond container gap — inconsistent rhythm |

#### I. Segmented speed control (L225-244) — Playback state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L229 | `padding` | `'0.2rem'` | Very thin container padding |
| L230 | `gap` | `'0.125rem'` (2px) | Buttons visually crammed together |
| L235 | `padding` | `'0.35rem 0.65rem'` | Tap targets ~28×24px. **WCAG minimum = 44×44px** |
| L240 | `fontSize` | `'0.65rem'` (~10.4px) | Below design guide minimum |

#### J. Play button (L246-259) — Playback state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L247-248 | `width/height` | `42px/42px` | Reasonable, but no hover/active state defined |
| — | — | — | No `aria-label` — accessibility gap |

#### K. Reset button (L261-272) — Playback state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L265 | `padding` | `'0.5rem'` | Implicit size ~32px — below WCAG 44px touch target |

#### L. Controls row (L409-427, inline) — Playback state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L410 | `gap` | `'1.25rem'` (20px) | Larger than overall panel gap (0.5rem) — visual inconsistency |
| L409 | `marginTop` | `'0.5rem'` | Extra spacing on top of container gap |

#### M. Footer (L429, inline) — Playback state

| Line | Property | Value | Problem |
|------|----------|-------|---------|
| L429 | `fontSize` | `'0.6rem'` (~9.6px) | Below readable threshold |
| L429 | `opacity` | `0.6` | Makes tiny text even harder to read |

#### N. Inline close button (L366)

| — | — | — | Hardcoded inline style, no hover state, no visual feedback |

#### O. Gap inconsistency between states

| State | Gap | Notes |
|-------|-----|-------|
| Pre-load form (L372) | `0.875rem` (14px) | Looser spacing |
| Playback HUD (L392) | `0.5rem` (8px) | Tighter spacing |

Panel height and density changes abruptly between states.

---

### Design Guide Discrepancies Summary

| Element | Current | Design Guide | Gap |
|---------|---------|-------------|-----|
| Input height | ~34-36px | 56px | 55-60% undersized |
| CTA button height | ~36-38px | 56px | 55% undersized |
| Input border-radius | 8px | 16px | 50% undersized |
| CTA border-radius | 12px | 16px | 25% undersized |
| Smallest text | 8.8px | 11px minimum | 20% undersized |
| Spacing | Ad-hoc values | xs/sm/md/lg/xl/2xl/3xl tokens | No token usage |
| Card border-radius | 20px | 12-14px (glass/device) | Inconsistent |
| Container bg | rgba(0.95) | var(--bg-card) = rgba(0.88) | Hardcoded, off-token |
| Position bottom | 2rem | 1rem (DeviceInfo) | Position mismatch |

---

### Mobile/Responsive Issues

1. **`minWidth: '450px'`** — Overflows on screens <450px with no fallback
2. **No `maxWidth`** — Can over-stretch on wide screens
3. **Scrubber 6px** — Almost impossible to tap on mobile (WCAG: 44px minimum)
4. **Speed buttons ~28×24px** — Below 44px minimum mobile touch target
5. **Reset button ~32px** — Below 44px minimum touch target
6. **`datetime-local` inputs** — Vary across browsers; may be unusable on some mobile browsers
7. **No responsive breakpoints** — No adaptation at ≤600px, ≤900px (design guide defines these)

---

### Approaches

1. **Design-System-Aligned Refactor** — Rewrite all CSSProperties to use design guide tokens, apply correct sizes (56px inputs/CTAs), fix border-radius, replace hardcoded colors with CSS vars, add responsive constraints
   - Pros: Full consistency with the rest of the app, proper spacing rhythm, accessible sizing
   - Cons: Medium effort, touches every style constant
   - Effort: Medium

2. **Targeted Fix — Critical Issues Only** — Fix unreadable fonts (min 0.7rem), add maxWidth/responsive, increase input/button heights, add mobile tap targets
   - Pros: Focused, lower risk
   - Cons: Leaves inconsistencies with design guide, doesn't solve spacing rhythm
   - Effort: Low

3. **Full HUD Redesign** — Redesign layout from scratch using DeviceInfoPanel's responsive pattern (width: calc(100% - 2rem), maxWidth), match card styling, redesign both states with consistent spacing grid
   - Pros: Best long-term result, mobile-first
   - Cons: Higher effort, more regression risk
   - Effort: High

---

### Recommendation

**Approach 1** — Design-System-Aligned Refactor. The component structure is sound. The problems are almost entirely in spacing/sizing values that should use design tokens. Fix values, add responsive constraints, ensure consistency with DeviceInfoPanel.

---

### Risks

- Changing input/button heights increases panel height, could affect viewport fit
- Telemetry label scaling (0.55rem → 0.7rem+) makes HUD taller; needs viewport testing
- `datetime-local` mobile behavior varies by browser; custom date picker may be needed (out of scope)
- Both visual states (form vs playback) must be validated after any change