import { createClient } from "@supabase/supabase-js";

export type RequestUserResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string | null;
        metadata: Record<string, unknown>;
      };
      accessToken: string;
    }
  | {
      ok: false;
      code: "MISSING_BEARER_TOKEN" | "INVALID_ACCESS_TOKEN";
    };

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return null;

  const [scheme, token, ...rest] = authorization.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null;
  }

  return token;
}

function normalizeUserMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function getRequestUser(
  request: Request,
): Promise<RequestUserResult> {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return { ok: false, code: "MISSING_BEARER_TOKEN" };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public authentication configuration is missing.");
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(accessToken);

  if (error || !user) {
    return { ok: false, code: "INVALID_ACCESS_TOKEN" };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      metadata: normalizeUserMetadata(user.user_metadata),
    },
    accessToken,
  };
}
