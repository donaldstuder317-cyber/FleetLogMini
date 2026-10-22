# FleetLog Mini

A mobile-first fleet maintenance logbook. Each user signs up, builds their own fleet, and gets an at-a-glance view of what is due, what is overdue, and which assets are blocked by a deadline fault. Services and faults are logged in a few taps, and the full history exports to CSV or PDF.

Built with React 19, TypeScript (strict), Tailwind CSS and Supabase (Auth, PostgreSQL, Row Level Security).

---

## Features

- **Abuse protection.** Cloudflare Turnstile CAPTCHA on sign-up and sign-in (verified by Supabase, so direct API calls are rejected too), Supabase auth rate limits per IP, per-account row quotas enforced by database triggers (10 assets, 10 service entries, 10 faults), and a daily job that removes accounts inactive for 5 days.
- **Per-user fleets.** Email/password sign-up and sign-in via Supabase Auth. Every query is scoped to the signed-in user by RLS, and new accounts start empty.
- **Service status at a glance.** Each asset's schedules show **On Track**, **Due Soon** (≥ 90% of the interval used) or **Overdue** (remaining < 0). Status is always an icon, a word and a color, never color alone.
- **Service logging.** Record a completed service with date, reading, parts cost and notes. The asset reading and matching schedule update in one database transaction.
- **Fault reporting with deadlines.** Report faults with a cost and a `DEADLINE` flag. An asset is *deadlined* while it has at least one open deadline fault, and it is highlighted and sorted first under "Most urgent".
- **Fault correction.** Logging a service can mark open faults as corrected (None / All / any mix). Corrected faults lock their cost and deadline, and deleting the service entry reopens them.
- **Full edit and delete.** Assets, service entries, faults and schedule intervals are all editable and deletable, with validation mirrored in the UI and the database. Schedules recalculate from the latest remaining entry.
- **Upcoming alerts.** An alerts window covers overdue items plus anything coming up by days or by mileage/hours, with a Deadline filter.
- **Export.** CSV and PDF grouped per asset: entries, the faults each one corrected, open deadline faults, per-asset totals and a grand total. PDFs print deadline rows in a print-safe red.
- **Accessible, responsive UI.** 44px touch targets, a visible label on every input, `focus-visible` rings, and motion that respects `prefers-reduced-motion`.

## Tech stack

| Area | Choice |
| --- | --- |
| Build / dev | Vite |
| UI | React 19 (function components + hooks), React Router 6 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3, design tokens only (no hard-coded colors) |
| Backend | Supabase: Auth, PostgreSQL, PostgREST, RPC functions, RLS |
| Export | jsPDF + jspdf-autotable |
| Unit tests | Vitest + Testing Library |
| E2E tests | Playwright |

## Architecture

```
Browser (Vite SPA)
 ├─ pages/              one file per route
 ├─ components/         presentational pieces, no business logic
 ├─ app/                AuthProvider (session) and FleetProvider (user's data)
 ├─ hooks/              useAuth, useFleet, useInlineSave, useMediaQuery
 ├─ services/           pure business logic: status, alerts, validation, export
 ├─ services/api.ts     the only code that reads/writes Supabase data
 ├─ services/authService.ts   the only code that calls supabase.auth
 └─ Supabase            Auth + PostgREST + RPCs → PostgreSQL with RLS
```

Design decisions worth noting:

- **Logic lives in services, not components.** Status math, the alerts window, validation and export are pure functions, so they are easy to unit test.
- **Narrow data boundary.** `api.ts` is the single data-access module and `mappers.ts` converts database rows to app types, so the rest of the app never sees the database shape. `src/types/database.ts` is generated from the schema.
- **Security in the database.** RLS restricts every table to its owner (`auth.uid() = user_id`), updates are limited by column-level grants, and triggers enforce invariants (reading floor, schedule clamping, fault correction rules). Multi-step writes (`log_service_entry`, `update_service_entry`, `delete_asset`, …) are `security invoker` RPCs, so they run as the caller and remain subject to RLS.
- **Secrets stay server-side.** The front end only holds the public publishable key. The Supabase secret key is never given a `VITE_` prefix or shipped to the browser, and a pre-commit hook blocks committing `.env` files or secret keys.

More detail is in [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md), [`docs/style-guide.md`](docs/style-guide.md), the per-page specs in [`docs/pages/`](docs/pages), and the wireframes in [`docs/wireframes/`](docs/wireframes).

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/sign-in`, `/sign-up` | Signed out only | Authentication |
| `/` | Signed in | Dashboard: every asset's status, filters and sorting |
| `/assets/new` | Signed in | Add an asset |
| `/assets/:id` | Signed in | Asset detail: schedules, history, faults, inline editing |
| `/log` | Signed in | Log a service and correct faults |
| `/alerts` | Signed in | Upcoming and overdue alerts |
| `/export` | Signed in | Filter and export CSV / PDF |

## Getting started

**Prerequisites:** Node.js 20+ and a Supabase project with the FleetLog schema applied.

```bash
npm install
```

Create `.env` in this folder:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your publishable key>
VITE_TURNSTILE_SITE_KEY=<your Cloudflare Turnstile site key>   # optional; hides the CAPTCHA if empty
```

In your Supabase project, turn **off** "Confirm email" under Auth settings so sign-up signs the user straight in.

```bash
npm run dev:web     # Vite at http://localhost:5173
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev:web` | Start the Vite dev server |
| `npm run dev` | Start the optional Node health-check server, then Vite (needs the `server/` folder) |
| `npm run build` | Type-check and produce a production build |
| `npm run typecheck` | TypeScript check only |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

## Testing

- **Unit tests** (`tests/unit`) cover status math, the alerts window, validation, fleet derivations, CSV/PDF export, the auth service, the API layer and key components. They mock `lib/supabase` and `services/api.ts`.
- **End-to-end tests** (`tests/e2e`) cover auth, dashboard, asset detail, logging, faults, edit, delete, alerts, export and responsive behavior. Playwright intercepts all `auth/v1` and `rest/v1` requests with a per-user in-memory database that imitates RLS, so **tests never touch a real database**. They run against Vite on port 5174 with fake Supabase environment values.

First E2E run: `npx playwright install chromium`.

## Project structure

```
front-end/
├─ src/
│  ├─ app/          providers and contexts
│  ├─ components/   common, forms, layout, modules
│  ├─ data/         seed data (tests and the e2e mock only)
│  ├─ hooks/
│  ├─ lib/          formatting, dates, class-name helper, Supabase client
│  ├─ pages/
│  ├─ services/     business logic and data access
│  └─ types/
├─ tests/           unit and e2e
├─ docs/            style guide, page specs, wireframes, architecture
└─ public/
```

## Notes

This repository contains the front end only. The database schema and migrations, and the small Node health-check server used by `npm run dev`, are maintained in sibling folders (`supabase/` and `server/`) of the original project and are not included here. Use `npm run dev:web` to run the app without the server.
