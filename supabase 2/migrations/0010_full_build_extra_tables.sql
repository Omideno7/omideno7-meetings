-- OmideNo7 Meetings — Full Build Extra Tables for Steps 21-30

create table if not exists public.testing_checklists (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  item text not null,
  status text not null default 'not_tested',
  note text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.release_readiness_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  status text not null default 'pending',
  required_for_release boolean not null default true,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'approved_members',
  sent_by uuid references public.profiles(id),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.livekit_token_requests (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  waiting_room_entry_id uuid references public.waiting_room_entries(id) on delete set null,
  request_status text not null default 'requested',
  reason text,
  created_at timestamptz not null default now()
);

alter table public.testing_checklists enable row level security;
alter table public.release_readiness_items enable row level security;
alter table public.owner_broadcasts enable row level security;
alter table public.livekit_token_requests enable row level security;

drop policy if exists "testing_owner_all" on public.testing_checklists;
create policy "testing_owner_all" on public.testing_checklists
for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "readiness_owner_all" on public.release_readiness_items;
create policy "readiness_owner_all" on public.release_readiness_items
for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "broadcast_owner_all" on public.owner_broadcasts;
create policy "broadcast_owner_all" on public.owner_broadcasts
for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "token_requests_owner_select" on public.livekit_token_requests;
create policy "token_requests_owner_select" on public.livekit_token_requests
for select using (public.is_owner());

drop policy if exists "token_requests_self_insert" on public.livekit_token_requests;
create policy "token_requests_self_insert" on public.livekit_token_requests
for insert with check (profile_id = auth.uid() and public.is_approved());
