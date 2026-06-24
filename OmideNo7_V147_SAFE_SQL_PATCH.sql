-- OmideNo7 Meetings v1.47 safe SQL patch
-- Run this in Supabase SQL Editor if: hand raise does not persist, chat mode jumps back,
-- co-host/member changes do not apply, or host mic lock does not persist.

-- 1) Required columns
alter table public.meeting_room_settings add column if not exists updated_by uuid;
alter table public.meeting_room_settings add column if not exists updated_at timestamptz default now();

alter table public.meeting_room_participants add column if not exists hand_raised boolean default false;
alter table public.meeting_room_participants add column if not exists allowed_mic boolean default true;
alter table public.meeting_room_participants add column if not exists avatar_url text;
alter table public.meeting_room_participants add column if not exists role_label text default 'approved_member';
alter table public.meeting_room_participants add column if not exists mic_on boolean default false;
alter table public.meeting_room_participants add column if not exists camera_on boolean default false;
alter table public.meeting_room_participants add column if not exists updated_at timestamptz default now();

-- 2) Make settings upsert reliable
create unique index if not exists meeting_room_settings_meeting_id_uidx
on public.meeting_room_settings (meeting_id);

-- 3) Host role checks
create or replace function public.is_host_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('owner','senior_host','meeting_host','co_host','door_servant','media_servant','prayer_servant','chat_moderator')
  );
$$;

grant execute on function public.is_host_role() to authenticated;

create or replace function public.is_mic_host_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('owner','senior_host','meeting_host','co_host')
  );
$$;

grant execute on function public.is_mic_host_role() to authenticated;

-- 4) Stable chat/open settings update
create or replace function public.host_update_room_settings(
  p_chat_mode text default null,
  p_live_open boolean default null,
  p_active_room_name text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_host_role() then
    raise exception 'Only host roles can update room settings.';
  end if;

  if p_chat_mode is not null and p_chat_mode not in ('public','admin','closed') then
    raise exception 'Invalid chat mode: %', p_chat_mode;
  end if;

  insert into public.meeting_room_settings (
    meeting_id,
    chat_mode,
    live_open,
    active_room_name,
    updated_by,
    updated_at
  )
  values (
    'main-room',
    coalesce(p_chat_mode, 'public'),
    coalesce(p_live_open, true),
    coalesce(p_active_room_name, 'Main Room'),
    auth.uid(),
    now()
  )
  on conflict (meeting_id) do update set
    chat_mode = coalesce(excluded.chat_mode, public.meeting_room_settings.chat_mode),
    live_open = coalesce(excluded.live_open, public.meeting_room_settings.live_open),
    active_room_name = coalesce(excluded.active_room_name, public.meeting_room_settings.active_room_name),
    updated_by = auth.uid(),
    updated_at = now();

  return true;
end;
$$;

grant execute on function public.host_update_room_settings(text, boolean, text) to authenticated;

-- 5) Member can raise/lower only their own hand
create or replace function public.set_my_hand_raised(
  p_meeting_id text default 'main-room',
  p_raised boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.meeting_room_participants
  set hand_raised = coalesce(p_raised, false),
      updated_at = now()
  where meeting_id = coalesce(p_meeting_id, 'main-room')
    and profile_id = auth.uid();

  return true;
end;
$$;

grant execute on function public.set_my_hand_raised(text, boolean) to authenticated;

-- 6) Host mic permission control
create or replace function public.host_set_participant_mic_permission(
  p_participant_id text,
  p_allowed boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_mic_host_role() then
    raise exception 'Only microphone host roles can update microphone permissions.';
  end if;

  update public.meeting_room_participants
  set allowed_mic = coalesce(p_allowed, true),
      mic_on = case when coalesce(p_allowed, true) then mic_on else false end,
      updated_at = now()
  where id = p_participant_id
    and meeting_id = 'main-room';

  return true;
end;
$$;

grant execute on function public.host_set_participant_mic_permission(text, boolean) to authenticated;

-- 7) Host role control: meeting participant row + real profile role
create or replace function public.host_update_participant_role(
  p_participant_id text,
  p_role_label text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_role text;
begin
  if not public.is_host_role() then
    raise exception 'Only host roles can update participant roles.';
  end if;

  v_role := lower(replace(coalesce(p_role_label, 'approved_member'), ' ', '_'));

  if v_role = 'member' then
    v_role := 'approved_member';
  end if;

  if v_role not in ('approved_member','co_host','door_servant','media_servant','prayer_servant','chat_moderator') then
    raise exception 'Invalid meeting role: %', v_role;
  end if;

  update public.meeting_room_participants
  set role_label = v_role,
      allowed_mic = case when v_role = 'co_host' then true else allowed_mic end,
      updated_at = now()
  where id = p_participant_id
    and meeting_id = 'main-room'
  returning profile_id into v_profile_id;

  if v_profile_id is not null then
    update public.profiles
    set role = v_role,
        updated_at = now()
    where id = v_profile_id;
  end if;

  return true;
end;
$$;

grant execute on function public.host_update_participant_role(text, text) to authenticated;

create or replace function public.host_update_profile_role(
  p_profile_id uuid,
  p_role text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_host_role() then
    raise exception 'Only host roles can update profile roles.';
  end if;

  v_role := lower(replace(coalesce(p_role, 'approved_member'), ' ', '_'));

  if v_role = 'member' then
    v_role := 'approved_member';
  end if;

  if v_role not in ('approved_member','co_host','door_servant','media_servant','prayer_servant','chat_moderator') then
    raise exception 'Invalid profile role: %', v_role;
  end if;

  update public.profiles
  set role = v_role,
      updated_at = now()
  where id = p_profile_id;

  return true;
end;
$$;

grant execute on function public.host_update_profile_role(uuid, text) to authenticated;

-- 8) Sync online participant rows with current profile names/photos once.
update public.meeting_room_participants mrp
set display_name = coalesce(p.display_name, p.full_name, p.email, mrp.display_name),
    avatar_url = coalesce(p.avatar_url, mrp.avatar_url),
    role_label = coalesce(nullif(mrp.role_label, ''), p.role, 'approved_member'),
    updated_at = now()
from public.profiles p
where mrp.profile_id::text = p.id::text;

-- 9) Default room state for next test.
insert into public.meeting_room_settings (meeting_id, chat_mode, live_open, active_room_name, updated_by, updated_at)
values ('main-room', 'public', true, 'Main Room', null, now())
on conflict (meeting_id) do update set
  chat_mode = 'public',
  live_open = true,
  active_room_name = 'Main Room',
  updated_at = now();
