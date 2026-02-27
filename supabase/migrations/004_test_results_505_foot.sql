alter table public.test_results
  add column if not exists foot text null;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'test_results_foot_chk'
  ) THEN
    ALTER TABLE public.test_results
      ADD CONSTRAINT test_results_foot_chk
      CHECK (foot is null or foot in ('left', 'right'));
  END IF;
END
$$;

create index if not exists test_results_foot_idx on public.test_results (foot);
