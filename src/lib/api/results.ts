import { supabase } from "../supabase";

export type TestResultRow = {
  id: string;
  club_id: string;
  user_id: string;
  station_id: string;
  station_name: string;
  station_short_name: string;
  time_seconds: number;
  tested_at: string;
};

export type ResultWithUser = TestResultRow & {
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    sex: string | null;
    dob: string | null;
    image_url: string | null;
  };
};

type RawResultRow = TestResultRow & {
  club_users?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    sex: string | null;
    dob: string | null;
    image_url: string | null;
  } | null;
};

export const listResults = async (args: {
  clubId: string;
  stationId?: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
}) => {
  const limit = args.limit ?? 200;

  let q = supabase
    .from("test_results")
    .select(
      [
        "id",
        "club_id",
        "user_id",
        "station_id",
        "station_name",
        "station_short_name",
        "time_seconds",
        "tested_at",
        "club_users:club_users(id,first_name,last_name,sex,dob,image_url)",
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

  const rows = (data || []) as unknown as RawResultRow[];

  return rows.map((r) => {
    const { club_users, ...rest } = r;
    const user = club_users || undefined;
    return { ...(rest as TestResultRow), user } as ResultWithUser;
  });
};
