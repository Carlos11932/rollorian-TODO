# Rollorian TODO — Design System

Design language inspired by Linear's dark-mode-native philosophy, adapted for a personal task management app. Replaces the previous Material Design 3 token system.

## 1. Visual Theme & Atmosphere

A near-black canvas where content emerges through carefully calibrated luminance steps. Dark-mode is the native medium — not a theme applied on top. Information hierarchy is managed through subtle gradations of white opacity rather than color variation.

The only chromatic colors in the system are **functional**: emerald for the brand accent, and a small set of status/priority colors. Everything else is achromatic — dark backgrounds with white/gray text.

**Key Characteristics:**
- Dark-mode-native: `#0a0a0c` app background, `#111114` panel background, `#1a1a1e` elevated surfaces
- Inter Variable with `"cv01", "ss03"` globally — geometric alternates
- Signature weight 510 (between regular and medium) for UI text
- Brand emerald: `#34d399` (accent) / `#10b981` (bg) / `#6ee7b7` (hover)
- Semi-transparent white borders: `rgba(255,255,255,0.05)` to `rgba(255,255,255,0.08)`
- Button backgrounds at near-zero opacity: `rgba(255,255,255,0.02)` to `rgba(255,255,255,0.05)`
- Luminance-based elevation — deeper = darker, elevated = lighter
- Material Symbols Outlined for iconography (existing system, proven and flexible)

## 2. Color Palette & Roles

### Background Surfaces
| Token | Value | Use |
|-------|-------|-----|
| `--bg-base` | `#0a0a0c` | App background, deepest canvas |
| `--bg-panel` | `#111114` | Sidebar, panels, bottom nav |
| `--bg-surface` | `#1a1a1e` | Cards, dropdowns, elevated containers |
| `--bg-elevated` | `#242429` | Hover states, secondary elevation |
| `--bg-overlay` | `rgba(0,0,0,0.85)` | Modal/dialog backdrop |

### Text & Content
| Token | Value | Use |
|-------|-------|-----|
| `--text-primary` | `#f7f8f8` | Headings, primary content |
| `--text-secondary` | `#d0d6e0` | Body text, descriptions |
| `--text-tertiary` | `#8a8f98` | Placeholders, metadata |
| `--text-quaternary` | `#62666d` | Timestamps, disabled, subtle labels |

### Brand Accent
| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#34d399` | Interactive elements, links, active states |
| `--accent-bg` | `#10b981` | CTA button backgrounds, brand marks |
| `--accent-hover` | `#6ee7b7` | Hover on accent elements |
| `--accent-muted` | `rgba(52,211,153,0.12)` | Accent badge backgrounds, subtle tints |

### Status Colors
Each status has a solid color (for dots/icons) and a muted variant (for badge backgrounds).

| Status | Solid | Muted (12% opacity) | Use |
|--------|-------|---------------------|-----|
| `pending` | `#8a8f98` | `rgba(138,143,152,0.12)` | Default/awaiting state |
| `in_progress` | `#34d399` | `rgba(52,211,153,0.12)` | Active work |
| `blocked` | `#f87171` | `rgba(248,113,113,0.12)` | Impediment (animate-pulse on dot) |
| `postponed` | `#fbbf24` | `rgba(251,191,36,0.12)` | Deferred |
| `done` | `#34d399` | `rgba(52,211,153,0.12)` | Successfully completed |
| `canceled` | `#62666d` | `rgba(98,102,109,0.12)` | Abandoned (strikethrough text) |
| `scheduled` | `#60a5fa` | `rgba(96,165,250,0.12)` | Future-dated |
| `completed` | `#34d399` | `rgba(52,211,153,0.12)` | Alias for done |

### Priority Colors
| Priority | Color | Badge bg |
|----------|-------|----------|
| `urgent` | `#f87171` | `rgba(248,113,113,0.12)` |
| `high` | `#fbbf24` | `rgba(251,191,36,0.12)` |
| `medium` | `#34d399` | `rgba(52,211,153,0.12)` |
| `low` | `#8a8f98` | `rgba(138,143,152,0.12)` |

### Border & Divider
| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `rgba(255,255,255,0.05)` | Default separator, card borders |
| `--border-standard` | `rgba(255,255,255,0.08)` | Inputs, prominent borders |
| `--border-solid` | `#23252a` | Solid alternative when needed |
| `--border-accent` | `rgba(52,211,153,0.3)` | Focus rings, active borders |

## 3. Typography Rules

### Font Family
- **Primary**: `Inter Variable` with fallbacks: `-apple-system, system-ui, Segoe UI, Roboto, sans-serif`
- **Monospace**: `JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace`
- **OpenType Features**: `"cv01", "ss03"` enabled globally

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Display | 32px (2rem) | 510 | 1.13 | -0.704px | Page titles ("Hoy", "Mi Vista") |
| Heading | 20px (1.25rem) | 590 | 1.33 | -0.24px | Section headers, card titles |
| Subheading | 16px (1rem) | 510 | 1.50 | normal | Group headers, nav labels |
| Body | 15px (0.938rem) | 400 | 1.60 | -0.165px | Task descriptions, body text |
| Body Medium | 15px (0.938rem) | 510 | 1.60 | -0.165px | Emphasized body, nav items |
| Small | 13px (0.813rem) | 400 | 1.50 | -0.13px | Metadata, timestamps, captions |
| Small Medium | 13px (0.813rem) | 510 | 1.50 | -0.13px | Badge text, category labels |
| Label | 12px (0.75rem) | 510 | 1.40 | normal | Button text, small labels |
| Micro | 11px (0.688rem) | 510 | 1.40 | normal | Tiny status labels |

### Principles
- **510 is the UI weight**: Between regular (400) and medium (500) — subtle emphasis without heaviness.
- **Three-tier system**: 400 (reading), 510 (UI/emphasis), 590 (strong emphasis/headings).
- **OpenType as identity**: `"cv01", "ss03"` transform Inter into a cleaner, more geometric typeface.
- **No bold (700)**: Maximum weight is 590.

## 4. Iconography

Material Symbols Outlined from Google Fonts CDN with variable font settings.

**Default settings:**
```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24;
}
```

**Active/selected state:**
```css
font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24;
```

**Size variants:** 20px (inline), 24px (default), 28px (prominent), 32px (hero).

## 5. Component Stylings

### Buttons

**Ghost Button (Default)**
- Background: `rgba(255,255,255,0.02)`
- Text: `--text-secondary`
- Padding: 8px 12px
- Radius: 6px
- Border: `1px solid rgba(255,255,255,0.08)`
- Hover: background → `rgba(255,255,255,0.05)`

**Primary Button**
- Background: `--accent-bg` (`#10b981`)
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 6px
- Hover: `--accent-hover` (`#6ee7b7`)

**Subtle Button**
- Background: `rgba(255,255,255,0.04)`
- Text: `--text-tertiary`
- Padding: 4px 8px
- Radius: 6px
- Hover: background → `rgba(255,255,255,0.08)`

**Icon Button**
- Background: transparent
- Text: `--text-tertiary`
- Radius: 6px
- Hover: background → `rgba(255,255,255,0.05)`

**Danger Button**
- Background: `rgba(248,113,113,0.12)`
- Text: `#f87171`
- Hover: background → `rgba(248,113,113,0.20)`

### Cards & Containers
- Background: `rgba(255,255,255,0.02)` to `rgba(255,255,255,0.04)`
- Border: `1px solid rgba(255,255,255,0.08)`
- Radius: 8px (standard), 12px (featured/dialog)
- Hover: background opacity increases one step

### Task Card
- Background: `--bg-surface`
- Left border: 3px solid [status-color] (optional, for list view)
- Title: 15px weight 510, `--text-primary`
- Description snippet: 13px weight 400, `--text-tertiary`, 1 line clamp
- Metadata row: status badge + priority pill + due date, 12px
- Done state: title gets `line-through`, text shifts to `--text-quaternary`
- Hover: background → `--bg-elevated`

### Status Badge
- Background: status muted color (12% opacity)
- Text: status solid color
- Padding: 2px 8px
- Radius: 9999px (pill)
- Font: 12px weight 510
- Dot: 6px circle in status solid color, before text

### Priority Pill
- Background: transparent
- Text: priority color
- Padding: 2px 6px
- Radius: 4px
- Border: `1px solid` priority color at 30% opacity
- Font: 11px weight 510, uppercase

### Inputs & Forms

**Text Input**
- Background: `rgba(255,255,255,0.02)`
- Text: `--text-primary`
- Placeholder: `--text-quaternary`
- Border: `1px solid rgba(255,255,255,0.08)`
- Focus border: `--border-accent`
- Padding: 10px 12px
- Radius: 6px

**Command Palette (Cmd+K)**
- Overlay: `--bg-overlay`
- Container: `--bg-surface`, 12px radius, multi-layer shadow
- Search input: 16px weight 400, no border, transparent bg
- Result items: 14px weight 510, `--text-secondary`, 8px padding
- Active result: `rgba(255,255,255,0.05)` background
- Shortcut hints: `--text-quaternary`, monospace

### Navigation

**Side Nav (Desktop)**
- Background: `--bg-panel`
- Width: 256px (16rem)
- Logo area: top, 48px height
- Nav items: 14px weight 510, `--text-tertiary`, 8px 12px padding, 6px radius
- Active item: `rgba(255,255,255,0.05)` bg, `--text-primary` text, filled icon
- Hover: `rgba(255,255,255,0.03)` bg
- Section divider: `1px solid rgba(255,255,255,0.05)`, 8px vertical margin
- Admin link: after divider, only visible to SUPERADMIN

**Top Bar**
- Background: `--bg-panel` with `backdrop-blur-md`
- Height: 48px
- Border bottom: `1px solid rgba(255,255,255,0.05)`
- Offset: `ml-64` on desktop (sidebar width)

**Bottom Nav (Mobile)**
- Background: `--bg-panel`
- Border top: `1px solid rgba(255,255,255,0.05)`
- Icons: 24px, `--text-tertiary`, active → `--accent`
- Safe area padding for notch devices

### Admin Tables
- Header row: `--text-tertiary`, 12px weight 510, uppercase
- Body rows: `--text-secondary`, 14px weight 400
- Row hover: `rgba(255,255,255,0.02)`
- Row border: `1px solid rgba(255,255,255,0.05)`
- Avatar: 32px circle, fallback with initials on `--bg-elevated`
- Role badge: same pattern as status badge
- Action buttons: ghost/danger variants, right-aligned

### Quick Capture Dialog
- Trigger: FAB on mobile, Cmd+K on desktop
- Container: `--bg-surface`, 12px radius
- Group selector: dropdown with ghost button style
- Submit: primary button

## 6. Layout Principles

### Spacing System
Base unit: 4px. Primary rhythm: 8px, 12px, 16px, 24px, 32px, 48px.

### Grid
- Sidebar: fixed 256px on desktop, hidden on mobile
- Main content: fluid, max-width 960px for readability
- Top bar: fixed 48px height
- Content padding: 24px desktop, 16px mobile

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 4px | Inline badges, small elements |
| `--radius-md` | 6px | Buttons, inputs, nav items |
| `--radius-lg` | 8px | Cards, containers |
| `--radius-xl` | 12px | Dialogs, featured panels |
| `--radius-pill` | 9999px | Status badges, filter chips |
| `--radius-circle` | 50% | Avatars, status dots |

## 7. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| L0 | No shadow, `--bg-base` | Page background |
| L1 | `rgba(255,255,255,0.02)` bg, `--border-subtle` border | Cards, default containers |
| L2 | `rgba(255,255,255,0.04)` bg, `--border-standard` border | Inputs, active cards |
| L3 | `--bg-surface` bg, `--border-standard` border, subtle shadow | Dropdowns, popovers |
| L4 | `--bg-surface` bg, multi-layer shadow stack | Command palette, dialogs |
| L5 | `--bg-overlay` backdrop + L4 container | Modal overlays |

Shadow on dark surfaces is nearly invisible. Elevation is communicated through background luminance steps, not shadow depth.

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 1024px | Bottom nav, no sidebar, compact padding |
| Desktop | >= 1024px (`lg:`) | Side nav, top bar, expanded layout |

### Collapsing Strategy
- Sidebar: visible on `lg:`, hidden on mobile
- Bottom nav: visible on mobile, hidden on `lg:`
- Top bar: always visible, offset by sidebar on desktop
- Task cards: full-width on mobile, contained width on desktop
- Command palette: full-width on mobile with top position, centered on desktop

## 9. Migration Reference

Mapping from current MD3 tokens to new system:

| MD3 Token | New Token |
|-----------|-----------|
| `--color-surface` | `--bg-base` |
| `--color-surface-container-low` | `--bg-panel` |
| `--color-surface-container` | `--bg-surface` |
| `--color-surface-container-high` | `--bg-elevated` |
| `--color-on-surface` | `--text-primary` |
| `--color-on-surface-variant` | `--text-tertiary` |
| `--color-primary` | `--accent` |
| `--color-secondary` | (use status/priority colors directly) |
| `--color-error` | Status `blocked` / Priority `urgent` color |
| `--color-outline` | `--border-standard` |
| `--color-outline-variant` | `--border-subtle` |

### Font Migration
- **From**: Manrope (single weight)
- **To**: Inter Variable with `"cv01", "ss03"`, weights 400/510/590

## 10. Do's and Don'ts

### Do
- Use Inter Variable with `"cv01", "ss03"` on ALL text
- Use weight 510 as default UI emphasis weight
- Build on near-black backgrounds with luminance-based elevation
- Use semi-transparent white borders (`rgba(255,255,255,0.05)` to `0.08`)
- Keep button backgrounds nearly transparent (`rgba(255,255,255,0.02)` to `0.05`)
- Reserve emerald accent for interactive elements and primary CTAs only
- Use `#f7f8f8` for primary text, never pure `#ffffff`
- Apply status/priority colors consistently via the defined palette
- Use 12% opacity backgrounds for status/priority badges

### Don't
- Don't use pure white (`#ffffff`) as text — `#f7f8f8` prevents eye strain
- Don't use solid colored backgrounds for ghost buttons — transparency is the system
- Don't scatter the accent color decoratively — it marks interactivity
- Don't use weight 700 (bold) — max is 590
- Don't use warm background tones — the palette is cool-neutral
- Don't use drop shadows for elevation on dark surfaces — use luminance stepping
- Don't introduce new chromatic colors without adding them to this spec
- Don't mix MD3 token names with the new system during migration
