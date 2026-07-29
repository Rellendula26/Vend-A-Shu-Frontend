/**
 * Server-side Supabase client for hardware command queue access.
 * Credentials must never be exposed to the Expo mobile app.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

/**
 * Returns a lazily initialized Supabase admin client using the service role key.
 * Used by the hardware command queue (see enqueue-dispense.ts).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = requireEnv("SUPABASE_URL");
    const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

/**
 * Clears the cached client (for tests or env reload).
 */
export function resetSupabaseAdminForTests(): void {
  adminClient = null;
}
