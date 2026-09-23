import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

const CANONICAL_HOST = "mlamh.net";
const LEGACY_PUBLIC_HOSTS = new Set([
  "mlamh.live",
  "www.mlamh.live",
  "mlamh.vercel.app",
]);

function getRequestHost(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "";

  return host
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function isStaleAuthSessionError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error ?? "").toLowerCase();

  return (
    message.includes("refresh token not found") ||
    message.includes("invalid refresh token") ||
    message.includes("auth session missing")
  );
}

export async function proxy(
  request: NextRequest,
) {
  const requestHost = getRequestHost(request);

  if (LEGACY_PUBLIC_HOSTS.has(requestHost)) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.hostname = CANONICAL_HOST;
    canonicalUrl.port = "";

    return NextResponse.redirect(canonicalUrl, 308);
  }

  // Next.js interprets any POST carrying next-action as a Server Action request.
  // Internet probes can forge that header (including against paths like /index.php),
  // which otherwise reaches the framework and is reported as a 500 "Failed to find
  // Server Action". A genuine action id is a 40-character lowercase hex digest.
  const serverActionId = request.headers.get("next-action");
  if (
    request.method === "POST" &&
    serverActionId &&
    !/^[a-f0-9]{40}$/.test(serverActionId)
  ) {
    return new NextResponse(null, {
      status: 400,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  const firstPathSegment = request.nextUrl.pathname.split("/")[1];

  requestHeaders.set(
    "x-mlamh-locale",
    firstPathSegment === "en" ? "en" : "ar",
  );

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value,
              );
            },
          );

          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(headers).forEach(
            ([key, value]) => {
              response.headers.set(
                key,
                value,
              );
            },
          );
        },
      },
    },
  );

  try {
    const { error } = await supabase.auth.getClaims();

    if (error && isStaleAuthSessionError(error)) {
      // Do not clear auth cookies from middleware here. Multiple concurrent
      // requests (common on Safari/iOS when returning to a backgrounded tab)
      // can race while Supabase rotates a refresh token. One request may see
      // the old token while another has already issued a fresh cookie. Deleting
      // cookies from the stale request can overwrite the fresh session and log
      // the user out unexpectedly. Treat this request as unauthenticated and
      // let the normal sign-in flow replace genuinely invalid sessions.
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("x-mlamh-auth-recovery", "stale-session");
    }
  } catch (error) {
    if (!isStaleAuthSessionError(error)) {
      throw error;
    }

    // Same recovery rule as above: never let one stale concurrent
    // request delete a newer session cookie written by another request.
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("x-mlamh-auth-recovery", "stale-session");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
