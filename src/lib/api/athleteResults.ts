import { supabase } from "../supabase";

export type AthleteResult = {
  id: string;
  station_id: string;
  station_name: string;
  station_short_name: string;
  time_seconds: number;
  tested_at: string;
};

type RawRow = {
  id: string;
  station_id: string;
  station_name: string;
  station_short_name: string;
  time_seconds: number;
  tested_at: string;
};

export const listAthleteResults = async (args: {
  clubId: string;
  userId: string;
  stationId?: string;
  limit?: number;
}): Promise<AthleteResult[]> => {
  const limit = args.limit ?? 2000;

  let q = supabase
    .from("test_results")
    .select(
      [
        "id",
        "station_id",
        "station_name",
        "station_short_name",
        "time_seconds",
        "tested_at",
      ].join(","),
    )
    .eq("club_id", args.clubId)
    .eq("user_id", args.userId)
    .order("tested_at", { ascending: true })
    .limit(limit);

  if (args.stationId) q = q.eq("station_id", args.stationId);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data || []) as unknown as RawRow[];

  return rows.map((r) => ({
    id: String(r.id),
    station_id: String(r.station_id),
    station_name: String(r.station_name),
    station_short_name: String(r.station_short_name),
    time_seconds: Number(r.time_seconds),
    tested_at: String(r.tested_at),
  }));
};
