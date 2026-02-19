const clean = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  if (s === "undefined" || s === "null") return "";
  return s;
};

export const env = {
  supabaseUrl: clean(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: clean(import.meta.env.VITE_SUPABASE_ANON_KEY),
};

const anonKeyLooksLikePublishable =
  env.supabaseAnonKey.startsWith("sb_publishable_");

export const envIsConfigured =
  !!env.supabaseUrl && !!env.supabaseAnonKey && !anonKeyLooksLikePublishable;

export const envConfigError = envIsConfigured
  ? ""
  : anonKeyLooksLikePublishable
    ? "Invalid Supabase key in .env. VITE_SUPABASE_ANON_KEY must be the 'anon public' key from Supabase Project Settings → API (usually starts with 'eyJ...'), not an 'sb_publishable_...' key."
    : "Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).";
