# System overview

```
Browser (Vite SPA)
 ├─ pages/             route screens (SignIn, SignUp, Dashboard, AssetDetail, LogService, Alerts, Export, AddAsset)
 ├─ components/        presentational pieces (no business logic); layout/AuthGate guards routes
 ├─ app/AuthProvider   Supabase session (incl. other tabs) → useAuth
 ├─ app/FleetProvider  the signed-in user's FleetData (keyed by user id); calls the API, then refetches
 ├─ hooks/             useAuth, useFleet (data + mutations + derived statuses), useInlineSave, useMediaQuery
 ├─ services/          pure logic: status, alerts, fleetService, validation, exportService
 ├─ services/api.ts    only data caller (+ mappers.ts: DB rows → app types), via lib/supabase.ts
 ├─ services/authService.ts  only supabase.auth caller (sign up / in / out, session events)
 └─ Supabase           Auth + PostgREST tables + RPCs → PostgreSQL with RLS (own rows only)
```

Data flow: React → `services/api.ts` → Supabase PostgREST / RPC as the signed-in user. See `supabase/api_notes.md`.

Routing: `/sign-in` and `/sign-up` are wrapped in `GuestOnly` (a signed-in user goes to the page they asked for, else `/`). Every other route is wrapped in `RequireAuth` (signed out → `/sign-in`, remembering the page unless the user just signed out).

Backend (`server/`, Node, `127.0.0.1:3001`): the only place the Supabase **secret** key (`server/.env`) may be used, reserved for future admin jobs. It exposes only `GET /api/health`, which `npm run dev` waits for. It no longer resets data (that would erase every user's fleet). The browser never talks to it.

## Data model (`src/types/index.ts`)
- **Asset** — id, name, kind, model, `reading` (odometer mi or engine hours), `unit`
- **Schedule** — per asset + task: `interval` in mi / hrs / days, `lastReading`, `lastDate`
- **ServiceEntry** — logged service: asset, task, date, reading, partsCost, notes
- **Fault** — dated free-text report against an asset
- In the database every row also has `user_id` (owner, defaults to `auth.uid()`); the app never sends or reads it.

## Key flows
- **Status** = `used / interval`: ≥90% → Due Soon, remaining < 0 → Overdue (`services/status.ts`).
- **Sign up** → Supabase Auth → `on_auth_user_created` trigger creates the profile → empty fleet.
- **Log service** → `log_service_entry` RPC inserts the entry, raises the asset reading and resets the matching schedule in one transaction → state refetched, badges recompute.
- **Edit** → asset / fault / interval: plain `PATCH` (column grants + RLS); service entry: `update_service_entry` RPC, which recalculates the task's schedule. The asset reading can't go below its highest logged service (DB trigger + `validateAssetReading`).
- **Delete** → `delete_asset` (children cascade) / `delete_service_entry` (schedule rolls back to the newest remaining entry for that task, else the schedule baseline; the asset reading is unchanged) / plain delete for faults.
- **Alerts window** → Overdue always shown; otherwise days OR mi/hrs (500 mi ≙ 25 hrs) whichever matches (`services/alerts.ts`).
- **Export** → filter entries → `buildCsv` / `buildPdf` (jsPDF, Letter) → Blob download. The preview count uses the same filter.

Diagrams: `fleetlog-8-questions.tldr` (this folder), `../wireframes/app-wireframes.tldr`. They predate accounts and don't show the sign-in / sign-up screens.
