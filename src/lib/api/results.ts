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
  foot?: string | null;
  device_id?: string | null;
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
        "foot",
        "device_id",
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

export const updateResult = async (args: {
  clubId: string;
  resultId: string;
  timeSeconds?: number;
  foot?: string | null;
  testedAtIso?: string;
}) => {
  const patch: Record<string, unknown> = {};
  if (args.timeSeconds !== undefined) patch.time_seconds = args.timeSeconds;
  if (args.foot !== undefined) patch.foot = args.foot;
  if (args.testedAtIso !== undefined) patch.tested_at = args.testedAtIso;

  const { error } = await supabase
    .from("test_results")
    .update(patch)
    .eq("club_id", args.clubId)
    .eq("id", args.resultId);

  if (error) throw error;
};

export const insertResult = async (args: {
  clubId: string;
  userId: string;
  stationId: string;
  stationName: string;
  stationShortName: string;
  timeSeconds: number;
  testedAtIso: string;
  foot?: string | null;
}) => {
  const payload = {
    club_id: args.clubId,
    user_id: args.userId,
    station_id: args.stationId,
    station_name: args.stationName,
    station_short_name: args.stationShortName,
    time_seconds: args.timeSeconds,
    tested_at: args.testedAtIso,
    foot: args.foot ?? null,
  };

  const { data, error } = await supabase
    .from("test_results")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
};

export const deleteResult = async (args: {
  clubId: string;
  resultId: string;
}) => {
  const { error } = await supabase
    .from("test_results")
    .delete()
    .eq("club_id", args.clubId)
    .eq("id", args.resultId);

  if (error) throw error;
};

export const deleteResultsByIds = async (args: {
  clubId: string;
  resultIds: string[];
}) => {
  if (args.resultIds.length === 0) return;
  const { error } = await supabase
    .from("test_results")
    .delete()
    .eq("club_id", args.clubId)
    .in("id", args.resultIds);

  if (error) throw error;
};
