create table public.users (
  id            uuid primary key default gen_random_uuid(),
  email         varchar(255) not null unique,
  password_hash text not null,
  name          varchar(120) not null,
  created_at    timestamptz not null default now()
);

alter table public.assets add column owner_id uuid references public.users (id);
create index idx_assets_owner_id on public.assets (owner_id);

-- No anon/authenticated access: users holds password hashes.
alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
