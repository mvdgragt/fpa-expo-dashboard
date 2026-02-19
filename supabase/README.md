## Supabase migrations

This repo contains SQL migrations under `supabase/migrations/`.

### 001_test_results.sql

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Paste the contents of `supabase/migrations/001_test_results.sql` and run it.

### Verify

- Table exists: `public.test_results`
- RLS is enabled on `public.test_results`
- Policies exist:
  - `staff/admin can read club results`
  - `staff/admin can insert club results`

### Sanity check query

After running the migration, you can run:

```sql
select count(*) from public.test_results;
```

### Notes

- Inserts are allowed for:
  - admins (`is_admin_user() = true`)
  - club staff with a `club_staff` row matching `auth.uid()` + `club_id`
- The Expo app sync will insert rows with:
  - `club_id` from the stored club session
  - `user_id` from the selected athlete
  - `time_seconds` numeric
