import { createClient } from "@supabase/supabase-js";

export type BearerAuthResult =
  | { ok: true; userId: string }
  | { ok: false; code: "MISSING_BEARER_TOKEN" | "INVALID_BEARER_TOKEN" | "AUTH_NOT_CONFIGURED" };

function getBearerToken(authorization: string | null) {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function getBearerUser(
  authorization: string | null,
): Promise<BearerAuthResult> {
  const token = getBearerToken(authorization);
  if (!token) return { ok: false, code: "MISSING_BEARER_TOKEN" };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("Bearer auth is not configured.");
    return { ok: false, code: "AUTH_NOT_CONFIGURED" };
  }

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);

  if (error || !user) {
    return { ok: false, code: "INVALID_BEARER_TOKEN" };
  }

  return { ok: true, userId: user.id };
}
