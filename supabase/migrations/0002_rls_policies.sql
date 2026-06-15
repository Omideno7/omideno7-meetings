-- OmideNo7 Meetings — Step 20 RLS Policies
alter table public.profiles enable row level security;
alter table public.access_requests enable row level security;
alter table public.permission_templates enable row level security;
alter table public.servant_assignments enable row level security;
alter table public.meetings enable row level security;
alter table public.waiting_room_entries enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.recordings enable row level security;
alter table public.attendance_reports enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_owner() returns boolean language sql security definer set search_path=public as $$
  select exists (select 1 from public.profiles where id=auth.uid() and role='owner' and status='approved')
$$;
create or replace function public.is_approved() returns boolean language sql security definer set search_path=public as $$
  select exists (select 1 from public.profiles where id=auth.uid() and status='approved')
$$;
create or replace function public.is_host_role() returns boolean language sql security definer set search_path=public as $$
  select exists (select 1 from public.profiles where id=auth.uid() and status='approved' and role in ('owner','senior_host','meeting_host','co_host','door_servant','media_servant','prayer_servant','chat_moderator'))
$$;

create policy "profiles_self_or_owner_select" on public.profiles for select using (id=auth.uid() or public.is_owner());
create policy "profiles_owner_all" on public.profiles for all using (public.is_owner()) with check (public.is_owner());
create policy "access_requests_public_insert" on public.access_requests for insert with check (true);
create policy "access_requests_owner_all" on public.access_requests for all using (public.is_owner()) with check (public.is_owner());
create policy "templates_owner_all" on public.permission_templates for all using (public.is_owner()) with check (public.is_owner());
create policy "servants_owner_all" on public.servant_assignments for all using (public.is_owner()) with check (public.is_owner());
create policy "meetings_approved_select" on public.meetings for select using (public.is_approved());
create policy "meetings_owner_all" on public.meetings for all using (public.is_owner()) with check (public.is_owner());
create policy "waiting_approved_select" on public.waiting_room_entries for select using (public.is_approved());
create policy "waiting_approved_insert" on public.waiting_room_entries for insert with check (public.is_approved());
create policy "waiting_hosts_update" on public.waiting_room_entries for update using (public.is_host_role()) with check (public.is_host_role());
create policy "participants_approved_select" on public.meeting_participants for select using (public.is_approved());
create policy "participants_approved_insert" on public.meeting_participants for insert with check (public.is_approved());
create policy "participants_hosts_update" on public.meeting_participants for update using (public.is_host_role()) with check (public.is_host_role());
create policy "messages_approved_select" on public.meeting_messages for select using (public.is_approved());
create policy "messages_approved_insert" on public.meeting_messages for insert with check (public.is_approved());
create policy "notifications_self_select" on public.notifications for select using (profile_id=auth.uid() or public.is_owner());
create policy "notifications_self_update" on public.notifications for update using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy "notifications_owner_all" on public.notifications for all using (public.is_owner()) with check (public.is_owner());
create policy "inbox_self_select" on public.inbox_messages for select using (profile_id=auth.uid() or public.is_owner());
create policy "inbox_self_update" on public.inbox_messages for update using (profile_id=auth.uid()) with check (profile_id=auth.uid());
create policy "recordings_select" on public.recordings for select using (public.is_owner() or (public.is_approved() and visibility in ('approved_members','public')));
create policy "recordings_owner_all" on public.recordings for all using (public.is_owner()) with check (public.is_owner());
create policy "reports_owner_all" on public.attendance_reports for all using (public.is_owner()) with check (public.is_owner());
create policy "audit_owner_all" on public.audit_logs for all using (public.is_owner()) with check (public.is_owner());
