create extension if not exists "pgcrypto";

alter table public.club_users enable row level security;

-- staff/admin can read club athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_users'
      AND policyname = 'staff/admin can read club athletes'
  ) THEN
    CREATE POLICY "staff/admin can read club athletes"
    ON public.club_users
    FOR SELECT
    USING (
      public.is_admin_user()
      OR EXISTS (
        SELECT 1
        FROM public.club_staff cs
        WHERE cs.user_id = auth.uid()
          AND cs.club_id = club_users.club_id
      )
    );
  END IF;
END
$$;

-- staff/admin can create club athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_users'
      AND policyname = 'staff/admin can insert club athletes'
  ) THEN
    CREATE POLICY "staff/admin can insert club athletes"
    ON public.club_users
    FOR INSERT
    WITH CHECK (
      public.is_admin_user()
      OR EXISTS (
        SELECT 1
        FROM public.club_staff cs
        WHERE cs.user_id = auth.uid()
          AND cs.club_id = club_users.club_id
      )
    );
  END IF;
END
$$;

-- staff/admin can update club athletes (incl sport_id/position_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'club_users'
      AND policyname = 'staff/admin can update club athletes'
  ) THEN
    CREATE POLICY "staff/admin can update club athletes"
    ON public.club_users
    FOR UPDATE
    USING (
      public.is_admin_user()
      OR EXISTS (
        SELECT 1
        FROM public.club_staff cs
        WHERE cs.user_id = auth.uid()
          AND cs.club_id = club_users.club_id
      )
    )
    WITH CHECK (
      public.is_admin_user()
      OR EXISTS (
        SELECT 1
        FROM public.club_staff cs
        WHERE cs.user_id = auth.uid()
          AND cs.club_id = club_users.club_id
      )
    );
  END IF;
END
$$;
