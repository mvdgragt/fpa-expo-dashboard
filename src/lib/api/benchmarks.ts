import { supabase } from "../supabase";

export type BenchmarkSample = {
  user_id: string;
  time_seconds: number;
  tested_at: string;
  foot: string | null;
  user: {
    sex: string | null;
    dob: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};

type RawRow = {
  user_id: string;
  time_seconds: number;
  tested_at: string;
  foot: string | null;
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
        "user_id",
        "time_seconds",
        "tested_at",
        "foot",
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
        user_id: String(r.user_id),
        time_seconds: Number(r.time_seconds),
        tested_at: String(r.tested_at),
        foot: r.foot ? String(r.foot) : null,
        user: r.club_users,
      } satisfies BenchmarkSample;
    })
    .filter(
      (x): x is BenchmarkSample => !!x && Number.isFinite(x.time_seconds),
    );
};
