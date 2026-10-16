# FleetLog Mini

Fleet maintenance logbook — Vite + React + TypeScript + Tailwind, no backend.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests
npx playwright install chromium && npm run test:e2e
```

See `CLAUDE.md` for conventions and `docs/` for specs, style guide and wireframes.

## Database schema

`docs/architecture/fleetlog.sql` is a PostgreSQL schema for the app's data (`users`, `assets`, `schedules`, `service_entries`, `faults`). It is written to import into drawSQL (Import > PostgreSQL). The app itself still uses `localStorage`; the schema is a design reference.

- **`assets.owner_id` is nullable.** It was `UUID NOT NULL` and is now `UUID`. The foreign key to `users (id)` is unchanged. The demo assets in `src/data/seed.ts` (Truck 12, Van 4, Excavator 3) have no owner, so they can be inserted without a `users` row, and an asset can be linked to a user later.

### Supabase status

The schema was applied to the Supabase project `ynkuzblcjzxzgetpotiz` with `supabase/migrations/20261015202451_init_fleetlog_schema.sql`. That migration created `assets`, `schedules`, `service_entries` and `faults`, with row level security on and `anon` limited to select, insert and update (`faults` is select and insert only; no deletes). It also added check constraints, a `unique (asset_id, task)` key on `schedules` and an `updated_at` trigger on `assets`.

Not done yet:

- **`users` table is not in Supabase.** `supabase/migrations/20261015203600_add_users_and_asset_owner.sql` is written but has not been applied. It also adds `assets.owner_id` (FK to `users`) and `idx_assets_owner_id`. Until it is applied, the remote `assets` table has no `owner_id` column. Apply it with `npx supabase db push` or the dashboard SQL editor. If real login is added later, point `owner_id` at `auth.users` instead of storing `password_hash`.
- **The remote schema differs from `fleetlog.sql`.** Beyond the missing `users` table and `owner_id`, the migration uses `text` with check constraints instead of `VARCHAR`, adds defaults such as `gen_random_uuid()`, and makes `service_entries.notes` `NOT NULL DEFAULT ''`.
- **The app does not use Supabase.** It still reads and writes `localStorage`, and `@supabase/supabase-js` is not installed or wired into `src/services/`.
- **No data loaded.** All tables are empty; `src/data/seed.ts` has not been inserted.
- **No auth.** The anon key can read and edit every row, so this is fine for a demo only.
