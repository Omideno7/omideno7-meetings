-- OmideNo7 Meetings v1.49 UI + media permissions patch
-- Run this only if screen-share permission, hand raise, or host controls do not persist.

alter table public.meeting_room_participants
  add column if not exists allowed_screen_share boolean default false;

alter table public.meeting_room_participants
  add column if not exists hand_raised boolean default false;

-- Member can update own hand reliably.
drop function if exists public.set_my_hand_raised(text, boolean);

create or replace function public.set_my_hand_raised(
  p_meeting_id text default 'main-room',
  p_hand_raised boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.meeting_room_participants
  set hand_raised = coalesce(p_hand_raised, false),
      updated_at = now()
  where meeting_id = coalesce(p_meeting_id, 'main-room')
    and profile_id::text = auth.uid()::text;

  return true;
end;
$$;

grant execute on function public.set_my_hand_raised(text, boolean) to authenticated;

create or replace function public.host_set_participant_screen_share_permission(
  p_participant_id text,
  p_allowed boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_host_role() then
    raise exception 'Only host roles can update screen share permissions.';
  end if;

  update public.meeting_room_participants
  set allowed_screen_share = coalesce(p_allowed, false),
      updated_at = now()
  where id = p_participant_id
    and meeting_id = 'main-room';

  return true;
end;
$$;

grant execute on function public.host_set_participant_screen_share_permission(text, boolean) to authenticated;
