DO $$
BEGIN
  -- If duplicates exist (historical inserts), remove them so we can enforce uniqueness.
  -- Keep the earliest row (created_at, then id) per (club_id,user_id,station_id,tested_at).
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT
        row_number() OVER (
          PARTITION BY club_id, user_id, station_id, tested_at
          ORDER BY created_at ASC, id ASC
        ) AS rn
      FROM public.test_results
    ) t
    WHERE t.rn > 1
  ) THEN
    DELETE FROM public.test_results tr
    WHERE tr.ctid IN (
      SELECT ctid
      FROM (
        SELECT
          ctid,
          row_number() OVER (
            PARTITION BY club_id, user_id, station_id, tested_at
            ORDER BY created_at ASC, id ASC
          ) AS rn
        FROM public.test_results
      ) d
      WHERE d.rn > 1
    );
  END IF;
END
$$;

create unique index if not exists test_results_unique_attempt
  on public.test_results (club_id, user_id, station_id, tested_at);
