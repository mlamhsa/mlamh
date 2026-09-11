import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type BrowserSupabaseClient = SupabaseClient;

let browserClient: BrowserSupabaseClient | undefined;

export function createBrowserSupabaseClient(): BrowserSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  }

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}

export const supabase = createBrowserSupabaseClient();
