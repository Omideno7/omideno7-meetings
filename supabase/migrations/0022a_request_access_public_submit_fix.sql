-- OmideNo7 Meetings — Step 22A Request Access Fix
-- Run this in Supabase SQL Editor after Step 22.
-- Purpose: allow real public request access submissions and owner-only reading/decisions.

-- Make sure public insert is possible for first-time visitors.
alter table public.access_requests enable row level security;

drop policy if exists access_requests_public_insert_pending on public.access_requests;
create policy access_requests_public_insert_pending
on public.access_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and email is not null
  and full_name is not null
);

drop policy if exists access_requests_owner_select_all on public.access_requests;
create policy access_requests_owner_select_all
on public.access_requests
for select
to authenticated
using (public.is_owner());

drop policy if exists access_requests_owner_update_all on public.access_requests;
create policy access_requests_owner_update_all
on public.access_requests
for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists access_requests_owner_delete_all on public.access_requests;
create policy access_requests_owner_delete_all
on public.access_requests
for delete
to authenticated
using (public.is_owner());

-- RPC fallback for public request submission.
-- This avoids frontend/RLS confusion and always creates a pending request.
create or replace function public.submit_access_request_public(
  p_full_name text,
  p_email text,
  p_country text default null,
  p_relationship text default null,
  p_reason text default null
)
returns public.access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  created_request public.access_requests;
begin
  if p_email is null or length(trim(p_email)) < 5 then
    raise exception 'A valid email is required.';
  end if;

  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Full name is required.';
  end if;

  insert into public.access_requests (
    full_name,
    email,
    country,
    relationship,
    reason,
    status,
    risk,
    created_at,
    updated_at
  )
  values (
    trim(p_full_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_country, '')), ''),
    nullif(trim(coalesce(p_relationship, '')), ''),
    nullif(trim(coalesce(p_reason, '')), ''),
    'pending',
    'normal',
    now(),
    now()
  )
  returning * into created_request;

  return created_request;
end;
$$;

grant execute on function public.submit_access_request_public(text, text, text, text, text) to anon, authenticated;

create index if not exists access_requests_created_desc_idx
on public.access_requests (created_at desc);
