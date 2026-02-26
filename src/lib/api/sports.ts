import { supabase } from "../supabase";

export type Sport = {
  id: string;
  club_id: string;
  name: string;
  created_at?: string | null;
};

export type SportPosition = {
  id: string;
  club_id: string;
  sport_id: string;
  name: string;
  created_at?: string | null;
};

export const listSports = async (args: { clubId: string }): Promise<Sport[]> => {
  const { data, error } = await supabase
    .from("sports")
    .select("id,club_id,name,created_at")
    .eq("club_id", args.clubId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as Sport[];
};

export const createSport = async (args: {
  clubId: string;
  name: string;
}): Promise<Sport> => {
  const { data, error } = await supabase
    .from("sports")
    .insert({ club_id: args.clubId, name: args.name })
    .select("id,club_id,name,created_at")
    .single();

  if (error) throw error;
  return data as unknown as Sport;
};

export const listSportPositions = async (args: {
  clubId: string;
  sportId: string;
}): Promise<SportPosition[]> => {
  const { data, error } = await supabase
    .from("sport_positions")
    .select("id,club_id,sport_id,name,created_at")
    .eq("club_id", args.clubId)
    .eq("sport_id", args.sportId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as SportPosition[];
};

export const createSportPosition = async (args: {
  clubId: string;
  sportId: string;
  name: string;
}): Promise<SportPosition> => {
  const { data, error } = await supabase
    .from("sport_positions")
    .insert({ club_id: args.clubId, sport_id: args.sportId, name: args.name })
    .select("id,club_id,sport_id,name,created_at")
    .single();

  if (error) throw error;
  return data as unknown as SportPosition;
};
