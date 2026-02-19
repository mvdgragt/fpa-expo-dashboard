import { createClient } from "@supabase/supabase-js";

import { env } from "./env";

const supabaseUrl = env.supabaseUrl || "http://localhost:54321";
const supabaseAnonKey = env.supabaseAnonKey || "invalid";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
