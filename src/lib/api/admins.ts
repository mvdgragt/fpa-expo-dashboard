import { supabase } from "../supabase";

export type AdminRow = {
  user_id: string;
  email: string;
  created_at: string;
};

export const listAdmins = async (args?: { limit?: number }) => {
  const { data, error } = await supabase.rpc("list_admins_with_email");

  if (error) throw error;

  const rows = (data || []) as unknown as {
    user_id: unknown;
    email: unknown;
    created_at: unknown;
  }[];

  const mapped = rows
    .map((r) => ({
      user_id: String(r.user_id ?? ""),
      email: String(r.email ?? ""),
      created_at: String(r.created_at ?? ""),
    }))
    .filter((r) => !!r.user_id);

  if (args?.limit && mapped.length > args.limit)
    return mapped.slice(0, args.limit);
  return mapped;
};

export const createAdmin = async (args: { email: string }) => {
  const email = args.email.trim().toLowerCase();
  if (!email) throw new Error("Missing email");
  const { error } = await supabase.rpc("add_admin_by_email", {
    p_email: email,
  });
  if (error) throw error;
};

export const deleteAdmin = async (args: { email: string }) => {
  const email = args.email.trim().toLowerCase();
  if (!email) throw new Error("Missing email");
  const { error } = await supabase.rpc("remove_admin_by_email", {
    p_email: email,
  });
  if (error) throw error;
};

export const updateAdminEmail = async (args: {
  oldEmail: string;
  newEmail: string;
}) => {
  const oldEmail = args.oldEmail.trim().toLowerCase();
  const newEmail = args.newEmail.trim().toLowerCase();
  if (!oldEmail) throw new Error("Missing old email");
  if (!newEmail) throw new Error("Missing new email");
  const { error } = await supabase.rpc("replace_admin_email", {
    p_old_email: oldEmail,
    p_new_email: newEmail,
  });
  if (error) throw error;
};
