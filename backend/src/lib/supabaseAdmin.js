import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseAdminConfigured = Boolean(url && serviceKey);

/**
 * Server-side Supabase client with the service role key.
 * Bypasses RLS, so it must never be exposed to the browser.
 */
export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
