import { supabase } from "../supabase";

export type ClubSummary = {
  id: string;
  name: string | null;
  code_4: string | null;
};

export const listClubs = async (args?: { limit?: number }): Promise<ClubSummary[]> => {
  const limit = args?.limit ?? 500;

  const { data, error } = await supabase
    .from("clubs")
    .select("id,name,code_4")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as ClubSummary[];
};
