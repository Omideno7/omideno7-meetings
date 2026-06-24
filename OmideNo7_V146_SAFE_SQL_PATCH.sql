-- OmideNo7 Meetings v1.46 safe SQL patch
-- Run in Supabase SQL Editor only if chat mode, co-host role, or host microphone controls revert/flash back.

alter table if exists public.meeting_room_settings
  add column if not exists updated_by uuid;

alter table if exists public.meeting_room_participants
  add column if not exists hand_raised boolean default false,
  add column if not exists allowed_mic boolean default true,
  add column if not exists avatar_url text,
  add column if not exists role_label text default 'approved_member';

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

  insert into public.meeting_room_settings (meeting_id, chat_mode, live_open, active_room_name, updated_by, updated_at)
  values (
    'main-room',
    coalesce(p_chat_mode, 'public'),
    coalesce(p_live_open, true),
    coalesce(p_active_room_name, 'Main Room'),
    auth.uid(),
    now()
  )
  on conflict (meeting_id) do update set
    chat_mode = coalesce(p_chat_mode, public.meeting_room_settings.chat_mode),
    live_open = coalesce(p_live_open, public.meeting_room_settings.live_open),
    active_room_name = coalesce(p_active_room_name, public.meeting_room_settings.active_room_name),
    updated_by = auth.uid(),
    updated_at = now();

  return true;
end;
$$;

grant execute on function public.host_update_room_settings(text, boolean, text) to authenticated;

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
  set allowed_mic = p_allowed,
      mic_on = case when p_allowed then mic_on else false end,
      updated_at = now()
  where id = p_participant_id
    and meeting_id = 'main-room';

  return true;
end;
$$;

grant execute on function public.host_set_participant_mic_permission(text, boolean) to authenticated;

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
  v_role text := lower(replace(coalesce(p_role_label, 'approved_member'), ' ', '_'));
begin
  if not public.is_host_role() then
    raise exception 'Only host roles can update participant roles.';
  end if;

  if v_role not in ('approved_member','member','co_host','door_servant','media_servant','prayer_servant','chat_moderator') then
    raise exception 'Invalid meeting role: %', v_role;
  end if;

  update public.meeting_room_participants
  set role_label = v_role,
      allowed_mic = case when v_role = 'co_host' then true else allowed_mic end,
      updated_at = now()
  where id = p_participant_id
    and meeting_id = 'main-room'
  returning profile_id into v_profile_id;

  if v_profile_id is not null and v_role in ('approved_member','co_host','door_servant','media_servant','prayer_servant','chat_moderator') then
    update public.profiles
    set role = v_role,
        updated_at = now()
    where id = v_profile_id;
  end if;

  return true;
end;
$$;

grant execute on function public.host_update_participant_role(text, text) to authenticated;

-- Keep the current room open and reset chat to public for testing.
insert into public.meeting_room_settings (meeting_id, chat_mode, live_open, active_room_name, updated_by, updated_at)
values ('main-room', 'public', true, 'Main Room', null, now())
on conflict (meeting_id) do update set
  chat_mode = 'public',
  live_open = true,
  active_room_name = 'Main Room',
  updated_at = now();
