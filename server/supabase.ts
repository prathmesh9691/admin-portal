import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Prefer service role key on the server to bypass RLS for admin operations
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const key = serviceKey || anon;
  if (!url || !key) throw new Error("Supabase server env not configured");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}


