-- Admin management by email
-- This project uses public.admins(user_id uuid, created_at timestamptz)
-- Emails live in auth.users. Client apps cannot read auth.users directly.

-- Ensure we can safely use ON CONFLICT(user_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admins_user_id_key'
      AND conrelid = 'public.admins'::regclass
  ) THEN
    ALTER TABLE public.admins
      ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

-- List admins with their email address
create or replace function public.list_admins_with_email()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select a.user_id,
         u.email,
         a.created_at
  from public.admins a
  left join auth.users u on u.id = a.user_id
  where public.is_admin_user()
  order by a.created_at desc;
$$;

revoke all on function public.list_admins_with_email() from public;

grant execute on function public.list_admins_with_email() to authenticated;

-- Add admin by email
create or replace function public.add_admin_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
begin
  if not public.is_admin_user() then
    raise exception 'Not allowed';
  end if;

  select u.id into v_uid
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_uid is null then
    raise exception 'No auth user found for email: %', p_email;
  end if;

  insert into public.admins (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  return v_uid;
end;
$$;

revoke all on function public.add_admin_by_email(text) from public;

grant execute on function public.add_admin_by_email(text) to authenticated;

-- Remove admin by email
create or replace function public.remove_admin_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid;
begin
  if not public.is_admin_user() then
    raise exception 'Not allowed';
  end if;

  select u.id into v_uid
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_uid is null then
    raise exception 'No auth user found for email: %', p_email;
  end if;

  delete from public.admins where user_id = v_uid;
  return v_uid;
end;
$$;

revoke all on function public.remove_admin_by_email(text) from public;

grant execute on function public.remove_admin_by_email(text) to authenticated;

-- Replace an admin email (delete old, add new)
create or replace function public.replace_admin_email(p_old_email text, p_new_email text)
returns table (removed_user_id uuid, added_user_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_old uuid;
  v_new uuid;
begin
  if not public.is_admin_user() then
    raise exception 'Not allowed';
  end if;

  v_old := public.remove_admin_by_email(p_old_email);
  v_new := public.add_admin_by_email(p_new_email);

  removed_user_id := v_old;
  added_user_id := v_new;
  return next;
end;
$$;

revoke all on function public.replace_admin_email(text, text) from public;

grant execute on function public.replace_admin_email(text, text) to authenticated;
