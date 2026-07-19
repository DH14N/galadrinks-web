import { createClient } from '@supabase/supabase-js';

// Placeholder values keep the BUILD from crashing when the environment
// variables aren't set (e.g. a fresh deploy before configuration).
// Real values from the environment are always used when present.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
);
