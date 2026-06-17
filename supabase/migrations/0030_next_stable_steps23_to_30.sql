-- OmideNo7 Meetings — NEXT STABLE STEPS 23–30 SQL PATCH
-- Run once in Supabase SQL Editor after uploading the Next Stable package.
-- Safe/idempotent for the current project.

create or replace function public.is_host_role() returns boolean
language sql
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.profiles
    where id=auth.uid()
      and status='approved'
      and role in ('owner','senior_host','meeting_host','co_host','door_servant','media_servant','prayer_servant','chat_moderator')
  )
$$;

alter table public.permission_templates
add column if not exists updated_at timestamptz not null default now();

alter table public.meetings
add column if not exists updated_at timestamptz not null default now();

alter table public.waiting_room_entries
add column if not exists updated_at timestamptz not null default now();

drop trigger if exists permission_templates_touch_updated_at on public.permission_templates;
create trigger permission_templates_touch_updated_at
before update on public.permission_templates
for each row execute function public.touch_updated_at();

drop trigger if exists meetings_touch_updated_at on public.meetings;
create trigger meetings_touch_updated_at
before update on public.meetings
for each row execute function public.touch_updated_at();

drop trigger if exists waiting_entries_touch_updated_at on public.waiting_room_entries;
create trigger waiting_entries_touch_updated_at
before update on public.waiting_room_entries
for each row execute function public.touch_updated_at();

alter table public.permission_templates enable row level security;
alter table public.servant_assignments enable row level security;
alter table public.meetings enable row level security;
alter table public.waiting_room_entries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists templates_owner_all_v30 on public.permission_templates;
create policy templates_owner_all_v30
on public.permission_templates
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists templates_hosts_select_v30 on public.permission_templates;
create policy templates_hosts_select_v30
on public.permission_templates
for select
to authenticated
using (public.is_host_role());

drop policy if exists servants_owner_all_v30 on public.servant_assignments;
create policy servants_owner_all_v30
on public.servant_assignments
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists meetings_approved_select_v30 on public.meetings;
create policy meetings_approved_select_v30
on public.meetings
for select
to authenticated
using (public.is_approved());

drop policy if exists meetings_hosts_insert_v30 on public.meetings;
create policy meetings_hosts_insert_v30
on public.meetings
for insert
to authenticated
with check (public.is_host_role());

drop policy if exists meetings_hosts_update_v30 on public.meetings;
create policy meetings_hosts_update_v30
on public.meetings
for update
to authenticated
using (public.is_host_role())
with check (public.is_host_role());

drop policy if exists waiting_approved_select_v30 on public.waiting_room_entries;
create policy waiting_approved_select_v30
on public.waiting_room_entries
for select
to authenticated
using (public.is_approved());

drop policy if exists waiting_approved_insert_v30 on public.waiting_room_entries;
create policy waiting_approved_insert_v30
on public.waiting_room_entries
for insert
to authenticated
with check (public.is_approved());

drop policy if exists waiting_hosts_update_v30 on public.waiting_room_entries;
create policy waiting_hosts_update_v30
on public.waiting_room_entries
for update
to authenticated
using (public.is_host_role())
with check (public.is_host_role());

drop policy if exists audit_owner_select_v30 on public.audit_logs;
create policy audit_owner_select_v30
on public.audit_logs
for select
to authenticated
using (public.is_owner());

create or replace function public.seed_default_permission_templates()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only Owner can seed permission templates.';
  end if;

  insert into public.permission_templates (
    name, role, can_start_meeting, can_admit_waiting_room, can_reject_waiting_room,
    can_remove_participant, can_mute_participants, can_activate_lecture_mode,
    can_start_recording, can_view_limited_reports, can_view_full_reports, can_publish_recordings
  )
  values
    ('Approved Member Basic', 'approved_member', false, false, false, false, false, false, false, false, false, false),
    ('Senior Host Full Meeting Control', 'senior_host', true, true, true, true, true, true, false, true, false, false),
    ('Meeting Host Standard', 'meeting_host', true, true, true, true, true, false, false, true, false, false),
    ('Co-host Lecture Assistant', 'co_host', false, true, true, true, true, true, false, true, false, false),
    ('Door Servant Waiting Room', 'door_servant', false, true, true, false, false, false, false, false, false, false),
    ('Media Servant Recording', 'media_servant', false, false, false, false, false, false, true, true, false, false),
    ('Prayer Servant Support', 'prayer_servant', false, false, false, false, false, false, false, false, false, false),
    ('Chat Moderator', 'chat_moderator', false, false, false, false, false, false, false, false, false, false)
  on conflict do nothing;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'seed_permission_templates', 'permission_templates', 'default', jsonb_build_object('source', 'next_stable_steps_23_30'));

  return 'Default permission templates are ready.';
end;
$$;

grant execute on function public.seed_default_permission_templates() to authenticated;

create or replace function public.assign_profile_role_template(
  p_profile_id uuid,
  p_role public.user_role,
  p_template_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  template_row public.permission_templates;
begin
  if not public.is_owner() then
    raise exception 'Only Owner can assign servant roles.';
  end if;

  select * into template_row
  from public.permission_templates
  where name = p_template_name
  limit 1;

  if template_row.id is null then
    raise exception 'Permission template not found. Seed templates first.';
  end if;

  update public.profiles
  set role = p_role,
      status = 'approved',
      approved_by = auth.uid(),
      approved_at = coalesce(approved_at, now()),
      updated_at = now()
  where id = p_profile_id
    and role <> 'owner';

  update public.servant_assignments
  set active = false,
      revoked_at = now()
  where profile_id = p_profile_id
    and active = true;

  if p_role <> 'approved_member' then
    insert into public.servant_assignments (profile_id, role, template_id, active, assigned_by, assigned_at)
    values (p_profile_id, p_role, template_row.id, true, auth.uid(), now());
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'assign_role_template',
    'profile',
    p_profile_id::text,
    jsonb_build_object('role', p_role, 'template', p_template_name)
  );

  return 'Role/template assigned.';
end;
$$;

grant execute on function public.assign_profile_role_template(uuid, public.user_role, text) to authenticated;

create or replace function public.create_meeting_admin(
  p_title text,
  p_meeting_type text default 'service',
  p_scheduled_start timestamptz default null,
  p_scheduled_end timestamptz default null
)
returns public.meetings
language plpgsql
security definer
set search_path = public
as $$
declare
  created_meeting public.meetings;
begin
  if not public.is_host_role() then
    raise exception 'Only Owner or authorized hosts can create meetings.';
  end if;

  insert into public.meetings (
    title, meeting_type, status, scheduled_start, scheduled_end,
    owner_id, created_by, livekit_room_name, recording_enabled,
    lecture_mode, low_bandwidth_mode, created_at, updated_at
  )
  values (
    trim(p_title),
    coalesce(nullif(trim(p_meeting_type), ''), 'service'),
    'scheduled',
    p_scheduled_start,
    p_scheduled_end,
    (select id from public.profiles where role='owner' and status='approved' order by approved_at nulls last limit 1),
    auth.uid(),
    'omideno7-' || gen_random_uuid()::text,
    false,
    false,
    false,
    now(),
    now()
  )
  returning * into created_meeting;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'create_meeting', 'meeting', created_meeting.id::text, jsonb_build_object('title', created_meeting.title));

  return created_meeting;
end;
$$;

grant execute on function public.create_meeting_admin(text, text, timestamptz, timestamptz) to authenticated;

create or replace function public.set_meeting_state_admin(
  p_meeting_id uuid,
  p_status public.meeting_status default null,
  p_lecture_mode boolean default null,
  p_low_bandwidth_mode boolean default null,
  p_recording_enabled boolean default null
)
returns public.meetings
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_meeting public.meetings;
begin
  if not public.is_host_role() then
    raise exception 'Only Owner or authorized hosts can update meetings.';
  end if;

  update public.meetings
  set
    status = coalesce(p_status, status),
    lecture_mode = coalesce(p_lecture_mode, lecture_mode),
    low_bandwidth_mode = coalesce(p_low_bandwidth_mode, low_bandwidth_mode),
    recording_enabled = coalesce(p_recording_enabled, recording_enabled),
    updated_at = now()
  where id = p_meeting_id
  returning * into updated_meeting;

  if updated_meeting.id is null then
    raise exception 'Meeting not found.';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'update_meeting_state',
    'meeting',
    p_meeting_id::text,
    jsonb_build_object('status', p_status, 'lecture', p_lecture_mode, 'low_bandwidth', p_low_bandwidth_mode, 'recording', p_recording_enabled)
  );

  return updated_meeting;
end;
$$;

grant execute on function public.set_meeting_state_admin(uuid, public.meeting_status, boolean, boolean, boolean) to authenticated;

create or replace function public.join_waiting_room_for_meeting(
  p_meeting_id uuid,
  p_display_name text,
  p_device_label text default null
)
returns public.waiting_room_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  entry public.waiting_room_entries;
begin
  if not public.is_approved() then
    raise exception 'Only approved members can enter the waiting room.';
  end if;

  insert into public.waiting_room_entries (
    meeting_id, profile_id, display_name, device_label, status, created_at, updated_at
  )
  values (
    p_meeting_id, auth.uid(), trim(p_display_name), nullif(trim(coalesce(p_device_label, '')), ''), 'waiting', now(), now()
  )
  returning * into entry;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'join_waiting_room', 'waiting_room_entry', entry.id::text, jsonb_build_object('meeting_id', p_meeting_id));

  return entry;
end;
$$;

grant execute on function public.join_waiting_room_for_meeting(uuid, text, text) to authenticated;

create or replace function public.decide_waiting_room_entry(
  p_entry_id uuid,
  p_next_status public.waiting_status
)
returns public.waiting_room_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  entry public.waiting_room_entries;
begin
  if not public.is_host_role() then
    raise exception 'Only Owner or authorized servants can manage the waiting room.';
  end if;

  update public.waiting_room_entries
  set
    status = p_next_status,
    admitted_by = case when p_next_status = 'admitted' then auth.uid() else admitted_by end,
    admitted_at = case when p_next_status = 'admitted' then now() else admitted_at end,
    rejected_by = case when p_next_status in ('rejected','removed') then auth.uid() else rejected_by end,
    rejected_at = case when p_next_status in ('rejected','removed') then now() else rejected_at end,
    updated_at = now()
  where id = p_entry_id
  returning * into entry;

  if entry.id is null then
    raise exception 'Waiting room entry not found.';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'waiting_room_' || p_next_status::text, 'waiting_room_entry', p_entry_id::text, jsonb_build_object('meeting_id', entry.meeting_id));

  return entry;
end;
$$;

grant execute on function public.decide_waiting_room_entry(uuid, public.waiting_status) to authenticated;

create or replace function public.owner_security_event(
  p_action text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_owner() then
    raise exception 'Only Owner can run security actions.';
  end if;

  if p_action = 'emergency_lockdown' then
    update public.meetings
    set status = 'ended',
        updated_at = now()
    where status in ('opening','live');
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, 'security', 'owner-security-center', jsonb_build_object('note', p_note));

  return 'Security event recorded.';
end;
$$;

grant execute on function public.owner_security_event(text, text) to authenticated;

-- Seed a starter Sunday service if no meetings exist.
insert into public.meetings (title, meeting_type, status, scheduled_start, scheduled_end, owner_id, created_by, livekit_room_name, created_at, updated_at)
select
  'Sunday Church Service',
  'service',
  'scheduled',
  date_trunc('week', now()) + interval '6 days 20 hours',
  date_trunc('week', now()) + interval '6 days 22 hours',
  (select id from public.profiles where role='owner' and status='approved' order by approved_at nulls last limit 1),
  (select id from public.profiles where role='owner' and status='approved' order by approved_at nulls last limit 1),
  'omideno7-sunday-service',
  now(),
  now()
where not exists (select 1 from public.meetings);

select 'NEXT_STABLE_STEPS_23_TO_30_READY' as status;
