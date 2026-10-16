-- FleetLog Mini: initial schema (demo, single shared owner, no auth).
-- Derived from docs/architecture/fleetlog.sql. Status/alerts are computed in the app, not stored.
-- WARNING: the anon key ships in the browser, so anon can read/insert/update (never delete) every row.

create table public.assets (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  kind         text not null check (char_length(kind) between 1 and 60),
  model        text not null check (char_length(model) between 1 and 120),
  reading      numeric(10,1) not null default 0 check (reading >= 0),
  reading_unit text not null check (reading_unit in ('mi', 'hrs')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.schedules (
  id             uuid primary key default gen_random_uuid(),
  asset_id       uuid not null references public.assets (id) on delete restrict,
  task           text not null check (task in ('Oil change', 'Brakes', 'Tire rotation', 'Inspection')),
  interval_value integer not null check (interval_value > 0),
  interval_unit  text not null check (interval_unit in ('mi', 'hrs', 'days')),
  last_reading   numeric(10,1) not null default 0 check (last_reading >= 0),
  last_date      date not null,
  unique (asset_id, task)
);

create table public.service_entries (
  id           uuid primary key default gen_random_uuid(),
  asset_id     uuid not null references public.assets (id) on delete restrict,
  task         text not null check (task in ('Oil change', 'Brakes', 'Tire rotation', 'Inspection', 'Other')),
  service_date date not null,
  reading      numeric(10,1) not null check (reading >= 0),
  parts_cost   numeric(10,2) not null default 0 check (parts_cost >= 0),
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create table public.faults (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid not null references public.assets (id) on delete restrict,
  fault_date  date not null default current_date,
  description text not null check (char_length(trim(description)) > 0),
  created_at  timestamptz not null default now()
);

-- schedules(asset_id) is covered by the unique (asset_id, task) index.
create index idx_service_entries_asset_date on public.service_entries (asset_id, service_date desc);
create index idx_faults_asset_id on public.faults (asset_id);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

-- Row level security
alter table public.assets          enable row level security;
alter table public.schedules       enable row level security;
alter table public.service_entries enable row level security;
alter table public.faults          enable row level security;

-- Explicit grants: no delete or truncate for anon.
revoke all on public.assets, public.schedules, public.service_entries, public.faults from anon, authenticated;
grant select, insert, update on public.assets, public.schedules, public.service_entries to anon;
grant select, insert on public.faults to anon;

create policy "anon select assets" on public.assets for select to anon using (true);
create policy "anon insert assets" on public.assets for insert to anon with check (true);
create policy "anon update assets" on public.assets for update to anon using (true) with check (true);

create policy "anon select schedules" on public.schedules for select to anon using (true);
create policy "anon insert schedules" on public.schedules for insert to anon with check (true);
create policy "anon update schedules" on public.schedules for update to anon using (true) with check (true);

create policy "anon select service_entries" on public.service_entries for select to anon using (true);
create policy "anon insert service_entries" on public.service_entries for insert to anon with check (true);
create policy "anon update service_entries" on public.service_entries for update to anon using (true) with check (true);

create policy "anon select faults" on public.faults for select to anon using (true);
create policy "anon insert faults" on public.faults for insert to anon with check (true);
