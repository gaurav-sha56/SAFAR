alter table public.fleets
  add column if not exists owner_user_id text,
  add column if not exists owner_email text;

create unique index if not exists fleets_owner_user_id_key
  on public.fleets (owner_user_id)
  where owner_user_id is not null;

create unique index if not exists fleets_owner_email_key
  on public.fleets (owner_email)
  where owner_email is not null;
