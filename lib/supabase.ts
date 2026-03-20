import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// A getter injected from AuthContext to avoid circular imports.
// Returns the current Firebase ID token, or null if not authenticated.
let getFirebaseToken: (() => Promise<string | null>) | null = null;

export function setFirebaseTokenGetter(fn: () => Promise<string | null>) {
  getFirebaseToken = fn;
}

// The `accessToken` option is the official Supabase way to integrate Third-Party Auth.
// Supabase will call this before every request and use the returned value as the Bearer token.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    if (getFirebaseToken) {
      try {
        return await getFirebaseToken();
      } catch (e) {
        return null;
      }
    }
    return null;
  },
});
