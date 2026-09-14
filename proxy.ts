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

  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
