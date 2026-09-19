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

const PUBLIC_READ_API_PATHS = new Set([
  "/api/opportunities",
  "/api/mobile/talents",
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

  if (
    request.method === "GET" &&
    PUBLIC_READ_API_PATHS.has(request.nextUrl.pathname)
  ) {
    return NextResponse.next();
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
      // A rotated/revoked refresh token is an unauthenticated state, not a
      // runtime failure. Clear only this Supabase project's auth cookies so
      // the browser can establish a clean session on the next sign-in.
      request.cookies
        .getAll()
        .filter(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"))
        .forEach(({ name }) => {
          request.cookies.delete(name);
          response.cookies.delete(name);
        });

      response.headers.set("Cache-Control", "private, no-store");
    }
  } catch (error) {
    if (!isStaleAuthSessionError(error)) {
      throw error;
    }

    request.cookies
      .getAll()
      .filter(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"))
      .forEach(({ name }) => {
        request.cookies.delete(name);
        response.cookies.delete(name);
      });

    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
