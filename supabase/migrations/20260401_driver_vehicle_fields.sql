alter table public.drivers
  add column if not exists vehicle_model text,
  add column if not exists vehicle_plate text;
