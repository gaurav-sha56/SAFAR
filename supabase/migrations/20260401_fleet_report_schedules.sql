create table if not exists public.fleet_report_schedules (
  id bigint generated always as identity primary key,
  fleet_id uuid not null,
  owner_user_id text,
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  delivery_mode text not null default 'manual' check (delivery_mode in ('manual', 'email', 'download_only')),
  enabled boolean not null default true,
  recipient_email text,
  last_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fleet_report_schedules_fleet_id_idx
  on public.fleet_report_schedules (fleet_id);

create unique index if not exists fleet_report_schedules_fleet_period_idx
  on public.fleet_report_schedules (fleet_id, period);
