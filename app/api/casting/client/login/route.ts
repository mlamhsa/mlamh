import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get("locale") || "") === "en" ? "en" : "ar";
  const email = normalizeEmail(String(formData.get("email") || ""));
  const origin = new URL(request.url).origin;
  const loginUrl = new URL(`/${locale}/casting/client/login`, origin);
  loginUrl.searchParams.set("sent", "1");

  if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 320) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const admin = createAdminClient();
  const { data: claimedProject, error } = await admin
    .from("casting_projects")
    .select("id")
    .eq("service_mode", "managed")
    .ilike("contact_email", email)
    .not("client_user_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) console.error("[managed casting client login] lookup", error);

  // Keep the response identical whether an account exists or not to avoid email enumeration.
  if (claimedProject) {
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

  return NextResponse.redirect(loginUrl, 303);
}
