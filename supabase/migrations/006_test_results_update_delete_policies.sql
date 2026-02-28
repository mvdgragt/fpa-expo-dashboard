-- Allow staff/admin to update and delete club test results

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'test_results'
      AND policyname = 'staff/admin can update club results'
  ) THEN
    create policy "staff/admin can update club results"
    on public.test_results
    for update
    using (
      public.is_admin_user()
      or exists (
        select 1
        from public.club_staff cs
        where cs.user_id = auth.uid()
          and cs.club_id = test_results.club_id
      )
    )
    with check (
      public.is_admin_user()
      or exists (
        select 1
        from public.club_staff cs
        where cs.user_id = auth.uid()
          and cs.club_id = test_results.club_id
      )
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'test_results'
      AND policyname = 'staff/admin can delete club results'
  ) THEN
    create policy "staff/admin can delete club results"
    on public.test_results
    for delete
    using (
      public.is_admin_user()
      or exists (
        select 1
        from public.club_staff cs
        where cs.user_id = auth.uid()
          and cs.club_id = test_results.club_id
      )
    );
  END IF;
END
$$;
