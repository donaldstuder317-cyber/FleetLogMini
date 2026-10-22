import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (set them in front-end/.env)');
}

/**
 * Typed Supabase client. Supabase Auth keeps the session in localStorage and refreshes it,
 * so requests run as the signed-in user and RLS limits them to that user's rows.
 */
export const supabase = createClient<Database>(url, anonKey);
