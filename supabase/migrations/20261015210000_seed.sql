-- FleetLog Mini: demo seed data (3 assets, 9 schedules, 7 service entries, no faults).
-- Mirrors the rows already in the Supabase project and is idempotent: re-running it,
-- or running it against a project that already has this data, inserts nothing.
--   assets          -> fixed ids, ON CONFLICT (id)
--   schedules       -> ON CONFLICT (asset_id, task), the table's unique key
--   service_entries -> no unique key, so guarded by NOT EXISTS (asset_id, task, service_date)
-- public.users is intentionally not seeded (it holds password hashes).

insert into public.assets (id, name, kind, model, reading, reading_unit) values
  ('11111111-1111-4111-8111-111111111111', 'Truck 12',    'Truck',     'Ford F-650',             48210, 'mi'),
  ('22222222-2222-4222-8222-222222222222', 'Van 4',       'Van',       'Mercedes Sprinter 2500', 61300, 'mi'),
  ('33333333-3333-4333-8333-333333333333', 'Excavator 3', 'Equipment', 'CAT 308',                 1230, 'hrs')
on conflict (id) do nothing;

insert into public.schedules (id, asset_id, task, interval_value, interval_unit, last_reading, last_date) values
  ('c563670c-f03d-41a3-837d-8977b0f9d583', '11111111-1111-4111-8111-111111111111', 'Oil change',    5000,  'mi',   42870, '2026-05-08'),
  ('dc558308-3808-4e69-ad06-944623a5f570', '11111111-1111-4111-8111-111111111111', 'Tire rotation', 8000,  'mi',   44000, '2026-06-17'),
  ('6d88a0f1-0da5-4992-b7db-1efbd2e660e3', '11111111-1111-4111-8111-111111111111', 'Brakes',        30000, 'mi',   30000, '2025-12-19'),
  ('9c81eb9f-0e34-425e-916c-63d8ace28088', '11111111-1111-4111-8111-111111111111', 'Inspection',    365,   'days', 40000, '2026-06-17'),
  ('ac6fca83-eb83-41bd-be8f-1464be1410fd', '22222222-2222-4222-8222-222222222222', 'Oil change',    7500,  'mi',   57000, '2026-07-17'),
  ('e87c186e-946c-4e95-bab9-49289dfdfda9', '22222222-2222-4222-8222-222222222222', 'Tire rotation', 180,   'days', 52000, '2026-04-30'),
  ('9712afb9-fb70-4d28-90c4-f6e38a82a2bc', '22222222-2222-4222-8222-222222222222', 'Inspection',    365,   'days', 56000, '2026-07-07'),
  ('18898d9a-e2d7-457d-8d60-3fea9c0bcd92', '33333333-3333-4333-8333-333333333333', 'Oil change',    250,   'hrs',  1000,  '2026-08-31'),
  ('db9f31a6-2308-4f19-b615-a6737e6a9220', '33333333-3333-4333-8333-333333333333', 'Inspection',    90,    'days', 1000,  '2026-09-15')
on conflict (asset_id, task) do nothing;

insert into public.service_entries (id, asset_id, task, service_date, reading, parts_cost, notes)
select v.id, v.asset_id, v.task, v.service_date, v.reading, v.parts_cost, v.notes
from (values
  ('d1e23275-9d90-4a2c-bc14-e6ff2a294bcc'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'Oil change',    '2026-05-08'::date, 42870::numeric, 86.50::numeric,  '15W-40, new filter'),
  ('73713603-a5c9-431d-9ae4-c79e2bb109cf'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'Tire rotation', '2026-06-17'::date, 44000::numeric, 0::numeric,      'Rotated and balanced'),
  ('b813e393-a836-4bb9-923e-ae337c304711'::uuid, '11111111-1111-4111-8111-111111111111'::uuid, 'Inspection',    '2026-06-17'::date, 44000::numeric, 35::numeric,     'Annual DOT inspection passed'),
  ('ac415b3b-6743-4cbe-a05e-7048ad275834'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'Oil change',    '2026-07-17'::date, 57000::numeric, 112.25::numeric, 'Synthetic'),
  ('65882b17-289f-46b8-9ca6-f2dbc02f59fa'::uuid, '22222222-2222-4222-8222-222222222222'::uuid, 'Tire rotation', '2026-04-30'::date, 52000::numeric, 0::numeric,      ''),
  ('5d09eba1-5d78-45dd-bdbb-011b6e35bed1'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Oil change',    '2026-08-31'::date, 1000::numeric,  210.80::numeric, 'Hydraulic filter also replaced'),
  ('a2af6a01-a08f-480a-9320-5827aed93f07'::uuid, '33333333-3333-4333-8333-333333333333'::uuid, 'Inspection',    '2026-09-15'::date, 1000::numeric,  0::numeric,      'No issues found')
) as v (id, asset_id, task, service_date, reading, parts_cost, notes)
where not exists (
  select 1 from public.service_entries e
  where e.asset_id = v.asset_id and e.task = v.task and e.service_date = v.service_date
)
on conflict (id) do nothing;
