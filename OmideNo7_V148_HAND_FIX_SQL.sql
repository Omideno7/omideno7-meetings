-- OmideNo7 Meetings v1.48 hand-raise stability patch
-- Run this in Supabase SQL Editor if the raised-hand icon still appears and disappears.

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

-- Check current hand states after testing:
select id, profile_id, display_name, status, hand_raised, updated_at
from public.meeting_room_participants
where meeting_id = 'main-room'
order by updated_at desc;
