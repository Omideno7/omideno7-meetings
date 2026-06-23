-- OmideNo7 Meetings — Waiting Sync / Profile Settings SQL Patch
-- Run once in Supabase SQL Editor.
-- This creates NEW v2 tables to avoid conflicts with previous test schemas.

alter table public.profiles
add column if not exists avatar_url text;

create table if not exists public.profile_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text,
  avatar_data_url text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_settings enable row level security;

drop policy if exists "users can read own profile settings" on public.profile_settings;
create policy "users can read own profile settings"
on public.profile_settings for select
using (user_id = auth.uid() or public.is_owner());

drop policy if exists "users can write own profile settings" on public.profile_settings;
create policy "users can write own profile settings"
on public.profile_settings for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table if not exists public.meeting_room_participants (
  id text primary key,
  meeting_id text not null default 'main-room',
  profile_id uuid references public.profiles(id) on delete cascade,
  display_name text not null,
  role_label text not null default 'member',
  avatar_url text,
  mic_on boolean not null default false,
  camera_on boolean not null default false,
  hand_raised boolean not null default false,
  allowed_mic boolean not null default false,
  room_name text not null default 'Main Room',
  status text not null default 'waiting' check (status in ('waiting','online','removed','blocked','left')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_room_chat_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id text not null default 'main-room',
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  target_type text not null default 'everyone' check (target_type in ('everyone','hosts','direct')),
  target_id text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_room_alerts (
  id uuid primary key default gen_random_uuid(),
  meeting_id text not null default 'main-room',
  alert_type text not null default 'info',
  title text not null,
  status text not null default 'active' check (status in ('active','resolved')),
  color text not null default 'red' check (color in ('red','green','blue')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists meeting_room_participants_meeting_idx on public.meeting_room_participants(meeting_id, status, updated_at);
create index if not exists meeting_room_chat_messages_meeting_idx on public.meeting_room_chat_messages(meeting_id, created_at);
create index if not exists meeting_room_alerts_meeting_idx on public.meeting_room_alerts(meeting_id, created_at);

alter table public.meeting_room_participants enable row level security;
alter table public.meeting_room_chat_messages enable row level security;
alter table public.meeting_room_alerts enable row level security;

drop policy if exists "approved users can read room participants" on public.meeting_room_participants;
create policy "approved users can read room participants"
on public.meeting_room_participants for select
using (public.is_approved());

drop policy if exists "approved users can insert own room participant row" on public.meeting_room_participants;
create policy "approved users can insert own room participant row"
on public.meeting_room_participants for insert
with check (public.is_approved() and (profile_id = auth.uid() or public.is_host_role()));

drop policy if exists "approved users can update own or host room participant row" on public.meeting_room_participants;
create policy "approved users can update own or host room participant row"
on public.meeting_room_participants for update
using (public.is_approved() and (profile_id = auth.uid() or public.is_host_role()))
with check (public.is_approved() and (profile_id = auth.uid() or public.is_host_role()));

drop policy if exists "approved users can read room chat" on public.meeting_room_chat_messages;
create policy "approved users can read room chat"
on public.meeting_room_chat_messages for select
using (public.is_approved());

drop policy if exists "approved users can insert room chat" on public.meeting_room_chat_messages;
create policy "approved users can insert room chat"
on public.meeting_room_chat_messages for insert
with check (public.is_approved());

drop policy if exists "approved users can read room alerts" on public.meeting_room_alerts;
create policy "approved users can read room alerts"
on public.meeting_room_alerts for select
using (public.is_approved());

drop policy if exists "hosts can manage room alerts" on public.meeting_room_alerts;
create policy "hosts can manage room alerts"
on public.meeting_room_alerts for all
using (public.is_host_role())
with check (public.is_host_role());

create or replace function public.save_my_profile_settings(
  next_display_name text,
  next_avatar_data_url text
)
returns public.profile_settings
language plpgsql
security definer
set search_path=public
as $$
declare
  saved public.profile_settings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profile_settings (user_id, display_name, avatar_data_url, avatar_url, updated_at)
  values (auth.uid(), next_display_name, next_avatar_data_url, next_avatar_data_url, now())
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      avatar_data_url = excluded.avatar_data_url,
      avatar_url = excluded.avatar_url,
      updated_at = now()
  returning * into saved;

  update public.profiles
  set display_name = coalesce(next_display_name, display_name),
      full_name = coalesce(next_display_name, full_name),
      avatar_url = next_avatar_data_url,
      updated_at = now()
  where id = auth.uid();

  return saved;
end;
$$;

grant execute on function public.save_my_profile_settings(text, text) to authenticated;

create or replace function public.get_my_profile_settings()
returns table (
  user_id uuid,
  display_name text,
  avatar_data_url text,
  avatar_url text,
  updated_at timestamptz
)
language sql
security definer
set search_path=public
as $$
  select ps.user_id, ps.display_name, ps.avatar_data_url, ps.avatar_url, ps.updated_at
  from public.profile_settings ps
  where ps.user_id = auth.uid()
$$;

grant execute on function public.get_my_profile_settings() to authenticated;

do $$
begin
  begin alter publication supabase_realtime add table public.meeting_room_participants; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.meeting_room_chat_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.meeting_room_alerts; exception when duplicate_object then null; end;
end $$;

create or replace function public.touch_meeting_room_participants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meeting_room_participants_touch_updated_at on public.meeting_room_participants;
create trigger meeting_room_participants_touch_updated_at
before update on public.meeting_room_participants
for each row execute function public.touch_meeting_room_participants_updated_at();
