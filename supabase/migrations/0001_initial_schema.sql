-- OmideNo7 Meetings — Step 20 Initial Supabase Schema
create extension if not exists "pgcrypto";

do $$ begin create type public.user_status as enum ('pending','approved','rejected','blocked','suspended'); exception when duplicate_object then null; end $$;
do $$ begin create type public.user_role as enum ('owner','approved_member','senior_host','meeting_host','co_host','door_servant','media_servant','prayer_servant','chat_moderator'); exception when duplicate_object then null; end $$;
do $$ begin create type public.request_status as enum ('pending','approved','rejected','blocked','more_info'); exception when duplicate_object then null; end $$;
do $$ begin create type public.waiting_status as enum ('waiting','admitted','rejected','removed'); exception when duplicate_object then null; end $$;
do $$ begin create type public.meeting_status as enum ('scheduled','opening','live','ended','cancelled'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  display_name text not null default '',
  email text not null,
  country text,
  role public.user_role not null default 'approved_member',
  status public.user_status not null default 'pending',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  country text,
  relationship text,
  reason text,
  status public.request_status not null default 'pending',
  approved_role public.user_role,
  risk text not null default 'normal',
  owner_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.permission_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role public.user_role not null,
  can_start_meeting boolean not null default false,
  can_admit_waiting_room boolean not null default false,
  can_reject_waiting_room boolean not null default false,
  can_remove_participant boolean not null default false,
  can_mute_participants boolean not null default false,
  can_activate_lecture_mode boolean not null default false,
  can_start_recording boolean not null default false,
  can_view_limited_reports boolean not null default false,
  can_view_full_reports boolean not null default false,
  can_publish_recordings boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.servant_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  template_id uuid references public.permission_templates(id),
  active boolean not null default true,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_type text not null default 'service',
  status public.meeting_status not null default 'scheduled',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  livekit_room_name text,
  recording_enabled boolean not null default false,
  lecture_mode boolean not null default false,
  low_bandwidth_mode boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.waiting_room_entries (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  device_label text,
  status public.waiting_status not null default 'waiting',
  admitted_by uuid references public.profiles(id),
  admitted_at timestamptz,
  rejected_by uuid references public.profiles(id),
  rejected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  role public.user_role,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  duration_seconds int default 0,
  reconnect_count int not null default 0,
  connection_quality text,
  removed_by uuid references public.profiles(id),
  removed_reason text
);

create table if not exists public.meeting_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  message_type text not null default 'chat',
  body text not null,
  visible_to text not null default 'meeting',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type text not null default 'system',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  sender_name text not null default 'System',
  subject text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  title text not null,
  visibility text not null default 'owner_only',
  mp4_path text,
  mp3_path text,
  transcript_path text,
  srt_path text,
  vtt_path text,
  published_at timestamptz,
  published_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_reports (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.meetings(id) on delete cascade,
  total_participants int not null default 0,
  peak_concurrent int not null default 0,
  average_duration_seconds int not null default 0,
  reconnect_total int not null default 0,
  poor_connection_count int not null default 0,
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
