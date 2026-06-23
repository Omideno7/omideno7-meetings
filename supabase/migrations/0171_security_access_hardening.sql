-- OmideNo7 Meetings — Security Access Hardening SQL Patch
-- Run once in Supabase SQL Editor.
-- Purpose:
-- 1) Make Owner approval really update the user's profile.
-- 2) Auto-sync approved access requests with existing/new profiles.
-- 3) Prevent pending users from being treated as approved by backend rules.

alter table public.access_requests
add column if not exists account_profile_id uuid references public.profiles(id) on delete set null;

alter table public.access_requests
add column if not exists decision_note text;

alter table public.access_requests
add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
add column if not exists avatar_url text;

create index if not exists profiles_email_lower_idx
on public.profiles (lower(email));

create index if not exists access_requests_email_lower_idx
on public.access_requests (lower(email));

create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'owner'
    and status = 'approved'
  )
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and status = 'approved'
  )
$$;

create or replace function public.is_host_role()
returns boolean
language sql
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and status = 'approved'
    and role in ('owner','senior_host','meeting_host','co_host','door_servant','media_servant','prayer_servant','chat_moderator')
  )
$$;

create or replace function public.sync_my_profile_from_access_request()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_email text;
  req public.access_requests;
  synced public.profiles;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  select email into current_email
  from auth.users
  where id = current_user_id;

  if current_email is null then
    raise exception 'Authenticated email not found.';
  end if;

  select * into req
  from public.access_requests
  where lower(email) = lower(current_email)
  and status = 'approved'
  order by reviewed_at desc nulls last, updated_at desc nulls last, created_at desc
  limit 1;

  if req.id is null then
    select * into synced
    from public.profiles
    where id = current_user_id;
    return synced;
  end if;

  update public.profiles
  set
    status = 'approved',
    role = coalesce(req.approved_role, 'approved_member'),
    full_name = coalesce(nullif(full_name, ''), req.full_name),
    display_name = coalesce(nullif(display_name, ''), req.full_name),
    approved_at = coalesce(approved_at, now()),
    updated_at = now()
  where id = current_user_id
  and role <> 'owner'
  returning * into synced;

  update public.access_requests
  set
    account_profile_id = current_user_id,
    updated_at = now()
  where id = req.id;

  return synced;
end;
$$;

grant execute on function public.sync_my_profile_from_access_request() to authenticated;

create or replace function public.owner_decide_access_request(
  request_id uuid,
  next_status public.request_status,
  next_role public.user_role default null,
  note text default null
)
returns public.access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.access_requests;
  matched_profile public.profiles;
  updated_req public.access_requests;
  final_role public.user_role;
begin
  if not public.is_owner() then
    raise exception 'Only Owner can decide access requests.';
  end if;

  select * into req
  from public.access_requests
  where id = request_id
  for update;

  if req.id is null then
    raise exception 'Access request not found.';
  end if;

  final_role := coalesce(next_role, 'approved_member');

  select * into matched_profile
  from public.profiles
  where lower(email) = lower(req.email)
  order by created_at desc
  limit 1;

  if matched_profile.id is not null and next_status = 'approved' then
    update public.profiles
    set
      role = final_role,
      status = 'approved',
      approved_by = auth.uid(),
      approved_at = now(),
      updated_at = now(),
      full_name = coalesce(nullif(full_name, ''), req.full_name),
      display_name = coalesce(nullif(display_name, ''), req.full_name)
    where id = matched_profile.id
    and role <> 'owner';
  end if;

  if matched_profile.id is not null and next_status in ('rejected', 'blocked') then
    update public.profiles
    set
      status = case when next_status = 'blocked' then 'blocked' else 'rejected' end,
      updated_at = now()
    where id = matched_profile.id
    and role <> 'owner';
  end if;

  update public.access_requests
  set
    status = next_status,
    approved_role = case when next_status = 'approved' then final_role else approved_role end,
    account_profile_id = matched_profile.id,
    decision_note = note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = request_id
  returning * into updated_req;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'access_request_' || next_status::text,
    'access_request',
    request_id::text,
    jsonb_build_object(
      'email', req.email,
      'role', final_role,
      'matched_profile', matched_profile.id,
      'note', note
    )
  );

  return updated_req;
end;
$$;

grant execute on function public.owner_decide_access_request(uuid, public.request_status, public.user_role, text) to authenticated;

-- Make new profiles automatically approved if the email already has an approved request.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_full_name text;
  approved_req public.access_requests;
  final_role public.user_role;
  final_status public.user_status;
begin
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email, '');

  select * into approved_req
  from public.access_requests
  where lower(email) = lower(new.email)
  and status = 'approved'
  order by reviewed_at desc nulls last, updated_at desc nulls last, created_at desc
  limit 1;

  final_role := coalesce(approved_req.approved_role, 'approved_member');
  final_status := case when approved_req.id is not null then 'approved'::public.user_status else 'pending'::public.user_status end;

  insert into public.profiles (
    id,
    full_name,
    display_name,
    email,
    role,
    status,
    approved_at,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(nullif(user_full_name, ''), new.email),
    coalesce(nullif(user_full_name, ''), new.email),
    new.email,
    final_role,
    final_status,
    case when final_status = 'approved' then now() else null end,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case when public.profiles.role = 'owner' then public.profiles.role else excluded.role end,
    status = case when public.profiles.role = 'owner' then public.profiles.status else excluded.status end,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
    approved_at = coalesce(public.profiles.approved_at, excluded.approved_at),
    updated_at = now();

  if approved_req.id is not null then
    update public.access_requests
    set account_profile_id = new.id, updated_at = now()
    where id = approved_req.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Repair existing already-approved access requests for profiles with the same email.
update public.profiles p
set
  status = 'approved',
  role = coalesce(ar.approved_role, 'approved_member'),
  approved_at = coalesce(p.approved_at, now()),
  updated_at = now()
from public.access_requests ar
where lower(ar.email) = lower(p.email)
and ar.status = 'approved'
and p.role <> 'owner';

update public.access_requests ar
set
  account_profile_id = p.id,
  updated_at = now()
from public.profiles p
where lower(ar.email) = lower(p.email)
and ar.status = 'approved';

-- Optional: allow users to update only safe display/avatar fields later through RPC/frontend steps.
