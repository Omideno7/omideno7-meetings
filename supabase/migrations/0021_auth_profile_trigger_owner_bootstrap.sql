-- OmideNo7 Meetings — Step 21 Real Supabase Auth + Owner Bootstrap
-- Run this in Supabase SQL Editor after previous migrations.

-- 1) Create profile automatically when a new Supabase Auth user signs up.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_full_name text;
begin
  user_full_name := coalesce(new.raw_user_meta_data->>'full_name', new.email, '');

  insert into public.profiles (
    id,
    full_name,
    display_name,
    email,
    role,
    status,
    created_at,
    updated_at
  )
  values (
    new.id,
    user_full_name,
    user_full_name,
    new.email,
    'approved_member',
    'pending',
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- 2) Owner bootstrap helper.
-- Replace the email below manually in SQL Editor after Apostle Yuhana signs up.
-- Example:
-- select public.bootstrap_owner_by_email('your-email@example.com');

create or replace function public.bootstrap_owner_by_email(owner_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
begin
  select id into target_profile_id
  from public.profiles
  where lower(email) = lower(owner_email)
  limit 1;

  if target_profile_id is null then
    return 'No profile found for email: ' || owner_email || '. Sign up first, then run this again.';
  end if;

  update public.profiles
  set
    role = 'owner',
    status = 'approved',
    approved_at = now(),
    updated_at = now(),
    full_name = coalesce(nullif(full_name, ''), 'Apostle Yuhana'),
    display_name = 'Apostle Yuhana'
  where id = target_profile_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    target_profile_id,
    'owner_bootstrap',
    'profile',
    target_profile_id::text,
    jsonb_build_object('email', owner_email)
  );

  return 'Owner approved successfully for: ' || owner_email;
end;
$$;

-- 3) Helpful index for lookup.
create index if not exists profiles_email_lower_idx
on public.profiles (lower(email));

create index if not exists access_requests_email_lower_idx
on public.access_requests (lower(email));
