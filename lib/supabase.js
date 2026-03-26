import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isValidHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function hasPublicSupabaseConfig() {
  return isValidHttpUrl(supabaseUrl) && typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0;
}

function hasServerSupabaseConfig() {
  return isValidHttpUrl(supabaseUrl) && typeof supabaseServiceRoleKey === 'string' && supabaseServiceRoleKey.length > 0;
}

function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

const globalForSupabase = globalThis;

export const supabase = hasPublicSupabaseConfig()
  ? (globalForSupabase.__safarSupabase ??= createBrowserClient())
  : null;

// Server-side client (uses service role key for admin ops)
export const createServerClient = () => {
  if (!isValidHttpUrl(supabaseUrl)) {
    throw new Error(
      'Supabase server environment variables are missing or invalid. Check NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  const serverKey =
    hasServerSupabaseConfig()
      ? supabaseServiceRoleKey
      : hasPublicSupabaseConfig()
        ? supabaseAnonKey
        : null;

  if (!serverKey) {
    throw new Error(
      'Supabase server environment variables are missing or invalid. Add NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  if (!hasServerSupabaseConfig()) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to anon key for server requests.');
  }

  return createClient(supabaseUrl, serverKey, {
    auth: { persistSession: false },
  });
};
