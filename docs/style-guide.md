# Style Guide — FleetLog Mini

- **Vibe:** a night-shift instrument panel meets a shop-floor service logbook. Dark, calm, precise; one electric-blue accent that says "this is the thing to press." Not a generic SaaS dashboard.
- **Stack:** React (function components + hooks) styled **only** with Tailwind CSS utility classes. Design tokens live in `tailwind.config.js` (below) — no hex codes or inline styles in components.
- **Mobile-first, scales to desktop:** design for a 390px phone first (single column, `px-4`). `md:` (≥768px) → two-column grids for lists/forms, max content width `max-w-5xl mx-auto`. `lg:` (≥1024px) → persistent left sidebar nav, Dashboard shows status cards in a 3-column grid next to the asset list. Nothing should feel like a stretched phone on desktop.
- **Colors:** near-black navy background, layered navy surfaces with 1px hairline borders, ONE electric-blue accent used only for primary actions, active nav, focus rings, sliders/toggles and progress rings. Status colors (green / amber / red) are reserved for status badges and errors only — never decoration. Error red is distinct from the blue accent.
- **Surfaces:** rounded cards (`rounded-xl`), 1px `border-line` borders, no heavy drop shadows. Buttons get a subtle darker "lip" on the bottom edge (`shadow-lip`) like the reference kit, so they read as physical, pressable keys.
- **Type:** a clean geometric sans (Inter) for body; a condensed, tabular face (Barlow Semi Condensed, `tabular-nums`) for headings and every number — odometer, hours, costs and countdowns should read like gauges. Scale: `text-3xl` page title → `text-xl` section → `text-base` body → `text-sm` meta/labels.
- **Data visuals:** circular progress rings show "interval used" per task (blue ring; turns amber at ≥90%, red when overdue). Small vertical bar sparklines show monthly parts cost. Both always have a text value beside them.
- **Status badges:** pill shape, icon + word + color — 🟢 Good, 🟡 Due Soon, 🔴 Overdue. Never color alone.
- **Touch targets:** at least 44px tall (`min-h-11`). Primary buttons ("Log Service", "Save Entry", "Download") are full-width on mobile (`w-full md:w-auto`).
- **Forms:** dark inset inputs (`bg-sunken`), visible label above every field, numeric keyboard for odometer/cost (`inputMode="decimal"`), inline error text below the field in red with an icon.
- **Motion:** subtle and quick (150–200ms). A new log row slides in; a badge flipping to Good gets one small pulse; progress rings animate on load. Wrap all of it in `motion-safe:` so reduced-motion users get none.
- **Navigation:** bottom tab bar on mobile (Dashboard · Alerts · Log · Export) with the current tab in blue; becomes a left sidebar at `lg:`. Respect iOS safe areas (`pb-[env(safe-area-inset-bottom)]`).
- **Accessibility:** visible blue focus ring on everything (`focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-bg`), labels on every input, contrast AA or better (all text pairs below checked ≥ 4.5:1), status never conveyed by color alone, semantic HTML (`<table>` for history on desktop, `<button>` not clickable `<div>`s).

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#070B14` | Page background |
| `surface` | `#0E1524` | Cards, nav bar |
| `raised` | `#152036` | Hovered rows, active chips |
| `sunken` | `#0A101C` | Form inputs |
| `line` | `#24314A` | 1px borders & dividers |
| `ink` | `#E8EEF8` | Primary text (16.9:1 on bg) |
| `muted` | `#8A9AB5` | Secondary text (6.4:1 on surface) |
| `accent` | `#2E8BFF` | Accent on dark: rings, icons, active nav (5.9:1 on bg) |
| `accent-strong` | `#1F6FE5` | Primary button fill, white text (4.7:1) |
| `accent-soft` | `#7DB6FF` | Hover tints, chart secondary |
| `good` | `#34D399` | Good badge (9.5:1 on surface) |
| `warn` | `#FBBF24` | Due Soon badge (10.9:1 on surface) |
| `danger` | `#F87171` | Overdue badge & errors (6.6:1 on surface) |

## Tailwind config

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070B14', surface: '#0E1524', raised: '#152036', sunken: '#0A101C',
        line: '#24314A', ink: '#E8EEF8', muted: '#8A9AB5',
        accent: { DEFAULT: '#2E8BFF', strong: '#1F6FE5', soft: '#7DB6FF' },
        good: '#34D399', warn: '#FBBF24', danger: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Barlow Semi Condensed"', 'Inter', 'sans-serif'],
      },
      boxShadow: { lip: 'inset 0 -3px 0 rgb(0 0 0 / 0.35)' },
      borderRadius: { xl: '0.75rem' },
    },
  },
};
```

## React components (one job each)

- `<AppShell>` — bottom tab bar on mobile, sidebar at `lg:`.
- `<StatusBadge status="good|due|overdue" />` — pill with icon + label.
- `<AssetRow>` / `<AlertRow>` — badge, name, task, countdown, chevron; whole row is one link.
- `<IntervalRing percent={…} status={…} />` — SVG progress ring with the value as text in the middle.
- `<Field label error>` — wraps every input; renders label, input and inline error.
- `<Button variant="primary|secondary|ghost">` — primary: `bg-accent-strong text-white shadow-lip rounded-xl min-h-11 w-full md:w-auto`; secondary: `border border-accent text-accent`; ghost: `border border-line text-muted`.
- `<EmptyState title action />` — dashed border card with one message and one button.

## Responsive checklist

- [ ] 390px: one column, full-width primary buttons, bottom tabs, nothing scrolls sideways
- [ ] 768px: lists and forms in two columns, buttons size to content
- [ ] 1024px+: sidebar nav, history renders as a table, max content width respected
