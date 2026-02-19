import { supabase } from "../supabase";

export type BenchmarkSample = {
  time_seconds: number;
  tested_at: string;
  user: {
    sex: string | null;
    dob: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

type RawRow = {
  time_seconds: number;
  tested_at: string;
  club_users: {
    sex: string | null;
    dob: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export const listBenchmarkSamples = async (args: {
  clubId: string;
  stationId: string;
  limit?: number;
}): Promise<BenchmarkSample[]> => {
  const limit = args.limit ?? 5000;

  const { data, error } = await supabase
    .from("test_results")
    .select(
      [
        "time_seconds",
        "tested_at",
        "club_users:club_users(sex,dob,first_name,last_name)",
      ].join(","),
    )
    .eq("club_id", args.clubId)
    .eq("station_id", args.stationId)
    .order("tested_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data || []) as unknown as RawRow[];

  return rows
    .map((r) => {
      if (!r.club_users) return null;
      return {
        time_seconds: Number(r.time_seconds),
        tested_at: String(r.tested_at),
        user: r.club_users,
      } satisfies BenchmarkSample;
    })
    .filter((x): x is BenchmarkSample => !!x && Number.isFinite(x.time_seconds));
};
