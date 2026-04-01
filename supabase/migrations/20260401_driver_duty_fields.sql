alter table if exists public.drivers
  add column if not exists duty_status text not null default 'off_duty',
  add column if not exists tracking_expected boolean not null default false,
  add column if not exists last_tracking_reason text,
  add column if not exists duty_session_id text,
  add column if not exists duty_status_changed_at timestamptz;

create index if not exists drivers_fleet_id_duty_status_idx
  on public.drivers (fleet_id, duty_status);

create index if not exists drivers_tracking_expected_idx
  on public.drivers (tracking_expected);
