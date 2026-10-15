# FleetLog Mini

Mobile-first fleet maintenance logbook. Owners see every asset's service status, log completed services, review upcoming alerts and export history (CSV / PDF).

## Stack
Vite · React 19 (function components + hooks) · TypeScript (strict) · Tailwind CSS 3 · React Router 6 · jsPDF + jspdf-autotable · Vitest + Testing Library · Playwright. **No backend** — data lives in `localStorage` (`fleetlog-mini:v1`), seeded from `src/data/seed.ts`.

## Commands
- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` / `npm run typecheck`
- `npm test` — unit tests (`tests/unit`)
- `npm run test:e2e` — Playwright (`tests/e2e`; first run: `npx playwright install chromium`)

## Layout
- `src/pages/` one file per route · `src/components/{common,forms,layout,modules}/` one job each
- `src/services/` business logic (status math, alerts window, export, storage) — **no logic in components**
- `src/hooks/`, `src/lib/` (format/date/cn helpers), `src/types/index.ts`, `src/data/seed.ts`
- `docs/` — `style-guide.md`, `pages/*.md` (user stories + "Done when"), `wireframes/`, `architecture/` (`.tldr` = tldraw files)

## Rules
- Follow `docs/style-guide.md`. Colors/fonts only via Tailwind tokens in `tailwind.config.ts` — no hex codes or inline color styles in components.
- ONE accent (blue) for primary actions/active nav/focus/rings. Green/amber/red only for status badges and errors. Status = icon + word + color.
- Touch targets `min-h-11`; primary buttons `w-full md:w-auto`; visible label on every input; `focus-visible` ring on everything interactive.
- Motion 150–200ms, always `motion-safe:`.
- Routes: `/`, `/assets/:id`, `/assets/new`, `/log`, `/alerts`, `/export`.
- Status rules: Due Soon at ≥90% of interval used, Overdue when remaining < 0.

## Workflow
- New page or data-shape change → use the `planner` agent first.
- After implementing → use the `qa-agent` (typecheck, unit, e2e, style checklist). `/verify` runs the checks.
- Don't commit unless asked.
