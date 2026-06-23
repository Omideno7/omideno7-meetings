-- OmideNo7 Meetings — Realtime Persistence SQL Patch
-- Run once in Supabase SQL Editor before uploading the app update.
-- Purpose:
-- 1) Persist avatar_url/display profile data.
-- 2) Add realtime meeting state tables so host actions can be seen across devices.
-- 3) Add chat/alert tables for real cross-device UI state before LiveKit media engine.

alter table public.profiles
add column if not exists avatar_url text;

create table if not exists public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
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
  status text not null default 'online' check (status in ('online','waiting','removed','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, profile_id)
);

create table if not exists public.meeting_chat_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id text not null default 'main-room',
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  target_type text not null default 'everyone' check (target_type in ('everyone','hosts','direct')),
  target_id text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_alerts (
  id uuid primary key default gen_random_uuid(),
  meeting_id text not null default 'main-room',
  alert_type text not null default 'info',
  title text not null,
  status text not null default 'active' check (status in ('active','resolved')),
  color text not null default 'red' check (color in ('red','green','blue')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists meeting_participants_meeting_idx on public.meeting_participants(meeting_id);
create index if not exists meeting_chat_messages_meeting_idx on public.meeting_chat_messages(meeting_id, created_at);
create index if not exists meeting_alerts_meeting_idx on public.meeting_alerts(meeting_id, created_at);

alter table public.meeting_participants enable row level security;
alter table public.meeting_chat_messages enable row level security;
alter table public.meeting_alerts enable row level security;

drop policy if exists "approved users can read meeting participants" on public.meeting_participants;
create policy "approved users can read meeting participants"
on public.meeting_participants for select
using (public.is_approved());

drop policy if exists "approved users can upsert own participant row" on public.meeting_participants;
create policy "approved users can upsert own participant row"
on public.meeting_participants for insert
with check (public.is_approved() and profile_id = auth.uid());

drop policy if exists "approved users can update own participant row" on public.meeting_participants;
create policy "approved users can update own participant row"
on public.meeting_participants for update
using (public.is_approved() and (profile_id = auth.uid() or public.is_host_role()))
with check (public.is_approved() and (profile_id = auth.uid() or public.is_host_role()));

drop policy if exists "approved users can read meeting chat" on public.meeting_chat_messages;
create policy "approved users can read meeting chat"
on public.meeting_chat_messages for select
using (public.is_approved());

drop policy if exists "approved users can insert meeting chat" on public.meeting_chat_messages;
create policy "approved users can insert meeting chat"
on public.meeting_chat_messages for insert
with check (public.is_approved());

drop policy if exists "approved users can read alerts" on public.meeting_alerts;
create policy "approved users can read alerts"
on public.meeting_alerts for select
using (public.is_approved());

drop policy if exists "hosts can manage alerts" on public.meeting_alerts;
create policy "hosts can manage alerts"
on public.meeting_alerts for all
using (public.is_host_role())
with check (public.is_host_role());

-- Enable realtime publication for these tables.
do $$
begin
  begin
    alter publication supabase_realtime add table public.meeting_participants;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.meeting_chat_messages;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.meeting_alerts;
  exception when duplicate_object then null;
  end;
end $$;

create or replace function public.touch_meeting_participants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meeting_participants_touch_updated_at on public.meeting_participants;
create trigger meeting_participants_touch_updated_at
before update on public.meeting_participants
for each row execute function public.touch_meeting_participants_updated_at();
