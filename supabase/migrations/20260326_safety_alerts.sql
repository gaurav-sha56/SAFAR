create table if not exists public.fleet_alerts (
  id bigint generated always as identity primary key,
  fleet_id uuid not null,
  driver_id uuid,
  driver_name text,
  driver_phone text,
  type text not null,
  severity text not null default 'medium',
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists fleet_alerts_fleet_id_created_at_idx
  on public.fleet_alerts (fleet_id, created_at desc);

create index if not exists fleet_alerts_driver_id_created_at_idx
  on public.fleet_alerts (driver_id, created_at desc);

create index if not exists fleet_alerts_type_created_at_idx
  on public.fleet_alerts (type, created_at desc);
