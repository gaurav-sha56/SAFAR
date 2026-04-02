alter table if exists public.fleet_alerts
  add column if not exists resolved_by text,
  add column if not exists resolution_note text,
  add column if not exists resolution_status text not null default 'open';

create index if not exists fleet_alerts_resolution_status_idx
  on public.fleet_alerts (resolution_status, created_at desc);
