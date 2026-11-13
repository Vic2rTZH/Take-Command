import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const dbConfigured = Boolean(url && serviceKey);

export const FILES_BUCKET = "tc-files";
export const PUBLIC_BUCKET = "tc-public";

let client: SupabaseClient | null = null;

/** Service-role client. Server only: it bypasses row level security. */
export function db(): SupabaseClient {
  if (!url || !serviceKey) throw new Error("Supabase is not configured");
  if (!client) client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function publicFileUrl(path: string): string {
  return `${url}/storage/v1/object/public/${PUBLIC_BUCKET}/${path}`;
}
