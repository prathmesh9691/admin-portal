import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const SUPABASE_BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined) || "";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anon) return null;
  client = createClient(url, anon, { auth: { persistSession: false } });
  return client;
}
