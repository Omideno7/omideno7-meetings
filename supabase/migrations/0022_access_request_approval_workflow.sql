-- OmideNo7 Meetings — Step 22 Real Access Request + Owner Approval Workflow

alter table public.access_requests
add column if not exists account_profile_id uuid references public.profiles(id) on delete set null;

alter table public.access_requests
add column if not exists decision_note text;

alter table public.access_requests
add column if not exists updated_at timestamptz not null default now();

drop trigger if exists access_requests_touch_updated_at on public.access_requests;
create trigger access_requests_touch_updated_at
before update on public.access_requests
for each row execute function public.touch_updated_at();

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

  select * into matched_profile
  from public.profiles
  where lower(email) = lower(req.email)
  limit 1;

  if matched_profile.id is not null and next_status = 'approved' then
    update public.profiles
    set
      role = coalesce(next_role, 'approved_member'),
      status = 'approved',
      approved_by = auth.uid(),
      approved_at = now(),
      updated_at = now(),
      full_name = coalesce(nullif(full_name, ''), req.full_name),
      display_name = coalesce(nullif(display_name, ''), req.full_name)
    where id = matched_profile.id;
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
    approved_role = case when next_status = 'approved' then coalesce(next_role, 'approved_member') else approved_role end,
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
    jsonb_build_object('email', req.email, 'role', next_role, 'matched_profile', matched_profile.id)
  );

  return updated_req;
end;
$$;

create index if not exists access_requests_status_created_idx
on public.access_requests (status, created_at desc);
