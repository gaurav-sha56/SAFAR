create table if not exists public.owner_push_tokens (
  id bigint generated always as identity primary key,
  fleet_id uuid not null,
  user_id text not null,
  token text not null,
  notification_permission text not null default 'granted',
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists owner_push_tokens_token_key
  on public.owner_push_tokens (token);

create index if not exists owner_push_tokens_fleet_id_idx
  on public.owner_push_tokens (fleet_id, updated_at desc);

create or replace function public.set_owner_push_tokens_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists owner_push_tokens_set_updated_at on public.owner_push_tokens;

create trigger owner_push_tokens_set_updated_at
before update on public.owner_push_tokens
for each row execute function public.set_owner_push_tokens_updated_at();
