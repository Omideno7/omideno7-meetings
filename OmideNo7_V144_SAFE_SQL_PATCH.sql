-- OmideNo7 Meetings v1.44 safe patch
-- Run only if the app reports missing columns/RPCs. Safe to run more than once.

alter table if exists public.meeting_room_participants
  add column if not exists hand_raised boolean not null default false;

alter table if exists public.meeting_room_participants
  add column if not exists allowed_mic boolean not null default true;

alter table if exists public.meeting_room_participants
  add column if not exists avatar_url text;

alter table if exists public.meeting_room_chat_messages
  add column if not exists target_type text not null default 'everyone';

alter table if exists public.meeting_room_chat_messages
  add column if not exists target_id uuid;

alter table if exists public.meeting_room_settings
  add column if not exists chat_mode text not null default 'public';

update public.meeting_room_settings
set chat_mode = coalesce(chat_mode, 'public')
where chat_mode is null;

alter table if exists public.meeting_room_settings
  drop constraint if exists meeting_room_settings_chat_mode_check;

alter table if exists public.meeting_room_settings
  add constraint meeting_room_settings_chat_mode_check
  check (chat_mode in ('public', 'admin', 'closed'));

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
  if not exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('owner','senior_host','meeting_host','co_host','door_servant','media_servant','prayer_servant','chat_moderator')
  ) then
    raise exception 'Only host roles can update room settings.';
  end if;

  insert into public.meeting_room_settings (meeting_id, chat_mode, live_open, active_room_name, updated_at)
  values (
    'main-room',
    coalesce(p_chat_mode, 'public'),
    coalesce(p_live_open, true),
    coalesce(p_active_room_name, 'Main Room'),
    now()
  )
  on conflict (meeting_id) do update set
    chat_mode = coalesce(p_chat_mode, public.meeting_room_settings.chat_mode),
    live_open = coalesce(p_live_open, public.meeting_room_settings.live_open),
    active_room_name = coalesce(p_active_room_name, public.meeting_room_settings.active_room_name),
    updated_at = now();

  return true;
end;
$$;

grant execute on function public.host_update_room_settings(text, boolean, text) to authenticated;
