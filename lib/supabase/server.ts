import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { fetchWithPgrst303Retry } from "@/lib/supabase/pgrst-fetch";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithPgrst303Retry,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // ignore when cookies cannot be set
            }
          });
        },
      },
    }
  );
}