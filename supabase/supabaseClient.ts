// shared/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Add this type declaration if using Vite
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

