
-- OmideNo7 Meetings — Steps 51–60 SQL patch
-- Meeting recurrence, edit, and delete support.
-- Run this once in Supabase SQL Editor after deploying the app update.

create extension if not exists pgcrypto;

alter table public.meetings
add column if not exists updated_at timestamptz not null default now();

alter table public.meetings
add column if not exists recurrence_frequency text not null default 'once';

alter table public.meetings
add column if not exists recurrence_label text;

alter table public.meetings
add column if not exists recurrence_group_id uuid;

alter table public.meetings
add column if not exists notes text;

create or replace function public.create_meeting_advanced_admin(
  p_title text,
  p_meeting_type text default 'service',
  p_scheduled_start timestamptz default null,
  p_scheduled_end timestamptz default null,
  p_recurrence_frequency text default 'once',
  p_repeat_count integer default 1,
  p_recurrence_label text default null,
  p_notes text default null
)
returns setof public.meetings
language plpgsql
security definer
set search_path = public
as $$
declare
  idx integer;
  total integer;
  step_interval interval;
  group_id uuid;
  created_meeting public.meetings;
  clean_frequency text;
begin
  if not public.is_host_role() then
    raise exception 'Only Owner or authorized hosts can create meetings.';
  end if;

  clean_frequency := coalesce(nullif(trim(p_recurrence_frequency), ''), 'once');

  total := case
    when clean_frequency = 'once' then 1
    else greatest(1, least(coalesce(p_repeat_count, 1), 52))
  end;

  step_interval := case clean_frequency
    when 'daily' then interval '1 day'
    when 'weekly' then interval '1 week'
    when 'monthly' then interval '1 month'
    else interval '0'
  end;

  group_id := case when total > 1 then gen_random_uuid() else null end;

  for idx in 0..(total - 1) loop
    insert into public.meetings (
      title,
      meeting_type,
      status,
      scheduled_start,
      scheduled_end,
      owner_id,
      created_by,
      livekit_room_name,
      recording_enabled,
      lecture_mode,
      low_bandwidth_mode,
      recurrence_frequency,
      recurrence_label,
      recurrence_group_id,
      notes,
      created_at,
      updated_at
    )
    values (
      trim(p_title),
      coalesce(nullif(trim(p_meeting_type), ''), 'custom'),
      'scheduled',
      case when p_scheduled_start is null then null else p_scheduled_start + (idx * step_interval) end,
      case when p_scheduled_end is null then null else p_scheduled_end + (idx * step_interval) end,
      (select id from public.profiles where role='owner' and status='approved' order by approved_at nulls last limit 1),
      auth.uid(),
      'omideno7-' || gen_random_uuid()::text,
      false,
      false,
      false,
      clean_frequency,
      p_recurrence_label,
      group_id,
      p_notes,
      now(),
      now()
    )
    returning * into created_meeting;

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      auth.uid(),
      'create_meeting_advanced',
      'meeting',
      created_meeting.id::text,
      jsonb_build_object(
        'title', created_meeting.title,
        'meeting_type', created_meeting.meeting_type,
        'recurrence_frequency', clean_frequency,
        'recurrence_group_id', group_id
      )
    );

    return next created_meeting;
  end loop;

  return;
end;
$$;

grant execute on function public.create_meeting_advanced_admin(text, text, timestamptz, timestamptz, text, integer, text, text) to authenticated;

create or replace function public.update_meeting_details_admin(
  p_meeting_id uuid,
  p_title text default null,
  p_meeting_type text default null,
  p_scheduled_start timestamptz default null,
  p_scheduled_end timestamptz default null,
  p_recurrence_frequency text default null,
  p_recurrence_label text default null,
  p_notes text default null
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
    title = coalesce(nullif(trim(p_title), ''), title),
    meeting_type = coalesce(nullif(trim(p_meeting_type), ''), meeting_type),
    scheduled_start = p_scheduled_start,
    scheduled_end = p_scheduled_end,
    recurrence_frequency = coalesce(nullif(trim(p_recurrence_frequency), ''), recurrence_frequency),
    recurrence_label = p_recurrence_label,
    notes = p_notes,
    updated_at = now()
  where id = p_meeting_id
  returning * into updated_meeting;

  if updated_meeting.id is null then
    raise exception 'Meeting not found.';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'update_meeting_details',
    'meeting',
    p_meeting_id::text,
    jsonb_build_object('title', updated_meeting.title, 'meeting_type', updated_meeting.meeting_type)
  );

  return updated_meeting;
end;
$$;

grant execute on function public.update_meeting_details_admin(uuid, text, text, timestamptz, timestamptz, text, text, text) to authenticated;

create or replace function public.delete_meeting_admin(
  p_meeting_id uuid,
  p_scope text default 'single',
  p_recurrence_group_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
  target_group uuid;
begin
  if not public.is_host_role() then
    raise exception 'Only Owner or authorized hosts can delete meetings.';
  end if;

  select recurrence_group_id into target_group from public.meetings where id = p_meeting_id;

  if p_scope = 'series' and coalesce(p_recurrence_group_id, target_group) is not null then
    delete from public.meetings
    where recurrence_group_id = coalesce(p_recurrence_group_id, target_group);
    get diagnostics deleted_count = row_count;
  else
    delete from public.meetings where id = p_meeting_id;
    get diagnostics deleted_count = row_count;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'delete_meeting',
    'meeting',
    p_meeting_id::text,
    jsonb_build_object('scope', p_scope, 'deleted_count', deleted_count)
  );

  return deleted_count > 0;
end;
$$;

grant execute on function public.delete_meeting_admin(uuid, text, uuid) to authenticated;
