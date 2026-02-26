import { supabase } from "../supabase";

import { compressImageToMaxBytes } from "../imageCompress";

const ATHLETE_PHOTO_BUCKET = "user-photos";

export type ClubUser = {
  id: string;
  club_id: string;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  sex: string | null;
  image_url: string | null;
  sport_id?: string | null;
  position_id?: string | null;
  created_at?: string | null;
};

export const listAthletes = async (args: {
  clubId: string;
  limit?: number;
}): Promise<ClubUser[]> => {
  const limit = args.limit ?? 500;

  const { data, error } = await supabase
    .from("club_users")
    .select(
      "id,club_id,first_name,last_name,dob,sex,image_url,sport_id,position_id,created_at",
    )
    .eq("club_id", args.clubId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as ClubUser[];
};

export const getAthlete = async (args: {
  clubId: string;
  userId: string;
}): Promise<ClubUser | null> => {
  const { data, error } = await supabase
    .from("club_users")
    .select(
      "id,club_id,first_name,last_name,dob,sex,image_url,sport_id,position_id,created_at",
    )
    .eq("club_id", args.clubId)
    .eq("id", args.userId)
    .maybeSingle();

  if (error) throw error;
  return data ? (data as unknown as ClubUser) : null;
};

export const createAthlete = async (args: {
  clubId: string;
  id?: string;
  firstName: string;
  lastName: string;
  dob?: string;
  sex?: string;
  photoFile?: File;
}): Promise<ClubUser> => {
  const id =
    args.id ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);
  if (!id) throw new Error("Could not generate athlete id");

  const insertPayload = {
    id,
    club_id: args.clubId,
    first_name: args.firstName,
    last_name: args.lastName,
    dob: args.dob || null,
    sex: args.sex || null,
    image_url: null,
    sport_id: null,
    position_id: null,
  };

  const { data: created, error: insertError } = await supabase
    .from("club_users")
    .insert(insertPayload)
    .select(
      "id,club_id,first_name,last_name,dob,sex,image_url,sport_id,position_id,created_at",
    )
    .single();

  if (insertError) throw insertError;

  if (!args.photoFile) return created as unknown as ClubUser;

  const compressed = await compressImageToMaxBytes({
    file: args.photoFile,
    maxBytes: 65 * 1024,
    maxDim: 640,
  });

  const objectPath = `club_users/${args.clubId}/${id}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(ATHLETE_PHOTO_BUCKET)
    .upload(objectPath, compressed, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) throw uploadError;

  const { data: updated, error: updateError } = await supabase
    .from("club_users")
    .update({ image_url: objectPath })
    .eq("id", id)
    .eq("club_id", args.clubId)
    .select(
      "id,club_id,first_name,last_name,dob,sex,image_url,sport_id,position_id,created_at",
    )
    .single();

  if (updateError) throw updateError;
  return updated as unknown as ClubUser;
};

export const getAthletePhotoSignedUrl = async (args: {
  objectPath: string;
  expiresIn?: number;
}) => {
  const expiresIn = args.expiresIn ?? 60 * 60;

  const { data, error } = await supabase.storage
    .from(ATHLETE_PHOTO_BUCKET)
    .createSignedUrl(args.objectPath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
};

export const updateAthlete = async (args: {
  clubId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  sex?: string;
  sportId?: string | null;
  positionId?: string | null;
  photoFile?: File | null;
}): Promise<ClubUser> => {
  const patch: Record<string, unknown> = {};
  if (args.firstName !== undefined) patch.first_name = args.firstName || null;
  if (args.lastName !== undefined) patch.last_name = args.lastName || null;
  if (args.dob !== undefined) patch.dob = args.dob || null;
  if (args.sex !== undefined) patch.sex = args.sex || null;
  if (args.sportId !== undefined) patch.sport_id = args.sportId;
  if (args.positionId !== undefined) patch.position_id = args.positionId;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase
      .from("club_users")
      .update(patch)
      .eq("club_id", args.clubId)
      .eq("id", args.userId);
    if (error) throw error;
  }

  if (args.photoFile) {
    const compressed = await compressImageToMaxBytes({
      file: args.photoFile,
      maxBytes: 65 * 1024,
      maxDim: 640,
    });

    const objectPath = `club_users/${args.clubId}/${args.userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(ATHLETE_PHOTO_BUCKET)
      .upload(objectPath, compressed, {
        upsert: true,
        contentType: "image/jpeg",
      });
    if (uploadError) throw uploadError;

    const { error: imgErr } = await supabase
      .from("club_users")
      .update({ image_url: objectPath })
      .eq("club_id", args.clubId)
      .eq("id", args.userId);
    if (imgErr) throw imgErr;
  }

  const { data, error } = await supabase
    .from("club_users")
    .select(
      "id,club_id,first_name,last_name,dob,sex,image_url,sport_id,position_id,created_at",
    )
    .eq("club_id", args.clubId)
    .eq("id", args.userId)
    .single();

  if (error) throw error;
  return data as unknown as ClubUser;
};
