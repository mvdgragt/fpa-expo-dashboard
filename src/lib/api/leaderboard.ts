import { supabase } from "../supabase";

export type LeaderboardSample = {
  station_id: string;
  station_name: string;
  station_short_name: string;
  time_seconds: number;
  tested_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    sex: string | null;
    dob: string | null;
  };
};

type RawRow = {
  station_id: string;
  station_name: string;
  station_short_name: string;
  time_seconds: number;
  tested_at: string;
  club_users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    sex: string | null;
    dob: string | null;
  } | null;
};

export const listLeaderboardSamples = async (args: {
  clubId: string;
  stationId?: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
}): Promise<LeaderboardSample[]> => {
  const limit = args.limit ?? 5000;

  let q = supabase
    .from("test_results")
    .select(
      [
        "station_id",
        "station_name",
        "station_short_name",
        "time_seconds",
        "tested_at",
        "club_users:club_users(id,first_name,last_name,sex,dob)",
      ].join(","),
    )
    .eq("club_id", args.clubId)
    .order("tested_at", { ascending: false })
    .limit(limit);

  if (args.stationId) q = q.eq("station_id", args.stationId);
  if (args.fromIso) q = q.gte("tested_at", args.fromIso);
  if (args.toIso) q = q.lte("tested_at", args.toIso);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data || []) as unknown as RawRow[];

  return rows
    .map((r) => {
      if (!r.club_users) return null;
      return {
        station_id: String(r.station_id),
        station_name: String(r.station_name),
        station_short_name: String(r.station_short_name),
        time_seconds: Number(r.time_seconds),
        tested_at: String(r.tested_at),
        user: r.club_users,
      } satisfies LeaderboardSample;
    })
    .filter((x): x is LeaderboardSample => !!x && Number.isFinite(x.time_seconds));
};
