import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/security/request-guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_LOGIN_BODY_BYTES = 8 * 1024;
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function escapeIlikeLiteral(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function publicOrigin(request: Request) {
  return process.env.VERCEL_ENV === "production"
    ? "https://mlamh.net"
    : new URL(request.url).origin;
}

function loginRedirect(origin: string, locale: "ar" | "en") {
  const url = new URL(`/${locale}/casting/client/login`, origin);
  url.searchParams.set("sent", "1");
  return url;
}

export async function POST(request: Request) {
  const origin = publicOrigin(request);
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/x-www-form-urlencoded") {
    return NextResponse.json({ ok: false, error: "unsupported_media_type" }, { status: 415 });
  }

  let rawBody: string;
  try {
    rawBody = await readTextBodyWithLimit(request, MAX_LOGIN_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
    }
    return NextResponse.json({ ok: false, error: "invalid_request_body" }, { status: 400 });
  }

  const form = new URLSearchParams(rawBody);
  const locale: "ar" | "en" = form.get("locale") === "en" ? "en" : "ar";
  const email = normalizeEmail(form.get("email") || "");
  const loginUrl = loginRedirect(origin, locale);

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 320) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const admin = createAdminClient();
  const rateKey = createHash("sha256")
    .update(`casting-client-login:${email}`)
    .digest("hex");
  const { data: rateRows, error: rateError } = await admin.rpc(
    "consume_support_rate_limit",
    {
      p_key_hash: rateKey,
      p_limit: LOGIN_LIMIT,
      p_window_seconds: LOGIN_WINDOW_SECONDS,
    },
  );

  if (rateError) {
    console.error("[managed casting client login] rate limit", rateError);
    return NextResponse.redirect(loginUrl, 303);
  }

  const rate = Array.isArray(rateRows) ? rateRows[0] : rateRows;
  if (rate && rate.allowed === false) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const { data: claimedProject, error } = await admin
    .from("casting_projects")
    .select("id,client_user_id")
    .eq("service_mode", "managed")
    .ilike("contact_email", escapeIlikeLiteral(email))
    .not("client_user_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) console.error("[managed casting client login] lookup", error);

  // Keep every browser-visible response identical whether an account exists or not.
  if (claimedProject?.client_user_id) {
    const { data: boundUserData, error: boundUserError } =
      await admin.auth.admin.getUserById(String(claimedProject.client_user_id));
    if (boundUserError) {
      console.error("[managed casting client login] bound user lookup", boundUserError);
    }

    const boundEmail = normalizeEmail(boundUserData?.user?.email || "");
    if (boundEmail === email) {
      const callback = new URL("/auth/callback", origin);
      callback.searchParams.set("locale", locale);
      callback.searchParams.set("mode", "casting_client_login");

      const supabase = await createServerSupabaseClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback.toString(), shouldCreateUser: false },
      });
      if (otpError) console.error("[managed casting client login] magic link", otpError);
    }
  }

  return NextResponse.redirect(loginUrl, 303);
}
