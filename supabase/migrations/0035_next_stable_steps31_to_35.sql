-- OmideNo7 Meetings — NEXT STABLE STEPS 31–35 SQL PATCH
-- Run once in Supabase SQL Editor after uploading Steps 31–35 package.
-- Adds custom editable permission templates and prevents duplicate default templates.

-- Clean duplicate permission templates by name, keeping the earliest one.
with ranked as (
  select id,
         row_number() over (partition by lower(name) order by created_at asc, id asc) as rn
  from public.permission_templates
)
delete from public.permission_templates
where id in (select id from ranked where rn > 1);

create unique index if not exists permission_templates_unique_lower_name
on public.permission_templates (lower(name));

create or replace function public.upsert_permission_template(
  p_name text,
  p_role public.user_role,
  p_can_start_meeting boolean default false,
  p_can_admit_waiting_room boolean default false,
  p_can_reject_waiting_room boolean default false,
  p_can_remove_participant boolean default false,
  p_can_mute_participants boolean default false,
  p_can_activate_lecture_mode boolean default false,
  p_can_start_recording boolean default false,
  p_can_view_limited_reports boolean default false,
  p_can_view_full_reports boolean default false,
  p_can_publish_recordings boolean default false
)
returns public.permission_templates
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  saved_template public.permission_templates;
begin
  if not public.is_owner() then
    raise exception 'Only Owner can edit permission templates.';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Template name is required.';
  end if;

  select id into existing_id
  from public.permission_templates
  where lower(name) = lower(trim(p_name))
  limit 1;

  if existing_id is null then
    insert into public.permission_templates (
      name, role,
      can_start_meeting, can_admit_waiting_room, can_reject_waiting_room,
      can_remove_participant, can_mute_participants, can_activate_lecture_mode,
      can_start_recording, can_view_limited_reports, can_view_full_reports, can_publish_recordings,
      created_at, updated_at
    )
    values (
      trim(p_name), p_role,
      p_can_start_meeting, p_can_admit_waiting_room, p_can_reject_waiting_room,
      p_can_remove_participant, p_can_mute_participants, p_can_activate_lecture_mode,
      p_can_start_recording, p_can_view_limited_reports, p_can_view_full_reports, p_can_publish_recordings,
      now(), now()
    )
    returning * into saved_template;
  else
    update public.permission_templates
    set
      name = trim(p_name),
      role = p_role,
      can_start_meeting = p_can_start_meeting,
      can_admit_waiting_room = p_can_admit_waiting_room,
      can_reject_waiting_room = p_can_reject_waiting_room,
      can_remove_participant = p_can_remove_participant,
      can_mute_participants = p_can_mute_participants,
      can_activate_lecture_mode = p_can_activate_lecture_mode,
      can_start_recording = p_can_start_recording,
      can_view_limited_reports = p_can_view_limited_reports,
      can_view_full_reports = p_can_view_full_reports,
      can_publish_recordings = p_can_publish_recordings,
      updated_at = now()
    where id = existing_id
    returning * into saved_template;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'upsert_permission_template',
    'permission_template',
    saved_template.id::text,
    jsonb_build_object('name', saved_template.name, 'role', saved_template.role)
  );

  return saved_template;
end;
$$;

grant execute on function public.upsert_permission_template(
  text, public.user_role, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;

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

  perform public.upsert_permission_template('Approved Member Basic', 'approved_member', false, false, false, false, false, false, false, false, false, false);
  perform public.upsert_permission_template('Senior Host Full Meeting Control', 'senior_host', true, true, true, true, true, true, false, true, false, false);
  perform public.upsert_permission_template('Meeting Host Standard', 'meeting_host', true, true, true, true, true, false, false, true, false, false);
  perform public.upsert_permission_template('Co-host Lecture Assistant', 'co_host', false, true, true, true, true, true, false, true, false, false);
  perform public.upsert_permission_template('Door Servant Waiting Room', 'door_servant', false, true, true, false, false, false, false, false, false, false);
  perform public.upsert_permission_template('Media Servant Recording', 'media_servant', false, false, false, false, false, false, true, true, false, false);
  perform public.upsert_permission_template('Prayer Servant Support', 'prayer_servant', false, false, false, false, false, false, false, false, false, false);
  perform public.upsert_permission_template('Chat Moderator', 'chat_moderator', false, false, false, false, false, false, false, false, false, false);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'seed_or_repair_permission_templates', 'permission_templates', 'default', jsonb_build_object('source', 'steps_31_35'));

  return 'Default templates seeded/repaired without duplicates.';
end;
$$;

grant execute on function public.seed_default_permission_templates() to authenticated;

create or replace function public.create_custom_template_and_assign(
  p_profile_id uuid,
  p_name text,
  p_role public.user_role,
  p_can_start_meeting boolean default false,
  p_can_admit_waiting_room boolean default false,
  p_can_reject_waiting_room boolean default false,
  p_can_remove_participant boolean default false,
  p_can_mute_participants boolean default false,
  p_can_activate_lecture_mode boolean default false,
  p_can_start_recording boolean default false,
  p_can_view_limited_reports boolean default false,
  p_can_view_full_reports boolean default false,
  p_can_publish_recordings boolean default false
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_template public.permission_templates;
begin
  if not public.is_owner() then
    raise exception 'Only Owner can create custom servant permissions.';
  end if;

  saved_template := public.upsert_permission_template(
    p_name,
    p_role,
    p_can_start_meeting,
    p_can_admit_waiting_room,
    p_can_reject_waiting_room,
    p_can_remove_participant,
    p_can_mute_participants,
    p_can_activate_lecture_mode,
    p_can_start_recording,
    p_can_view_limited_reports,
    p_can_view_full_reports,
    p_can_publish_recordings
  );

  perform public.assign_profile_role_template(p_profile_id, p_role, saved_template.name);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'create_custom_template_and_assign',
    'profile',
    p_profile_id::text,
    jsonb_build_object('template', saved_template.name, 'role', p_role)
  );

  return 'Custom template saved and applied.';
end;
$$;

grant execute on function public.create_custom_template_and_assign(
  uuid, text, public.user_role, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean
) to authenticated;

select 'NEXT_STABLE_STEPS_31_TO_35_READY' as status;
