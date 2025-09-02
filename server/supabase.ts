import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase server env not configured");
  client = createClient(url, anon, { auth: { persistSession: false } });
  return client;
}


