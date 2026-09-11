import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeEmail(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") || "").trim();
  const locale = String(formData.get("locale") || "") === "en" ? "en" : "ar";
  const origin = new URL(request.url).origin;

  if (!token || token.length > 100) {
    return NextResponse.redirect(`${origin}/${locale}/casting?claim=invalid`, 303);
  }

  const admin = createAdminClient();
  const { data: project, error } = await admin
    .from("casting_projects")
    .select("id,service_mode,contact_email,client_user_id,client_access_token")
    .eq("client_access_token", token)
    .eq("service_mode", "managed")
    .maybeSingle();

  if (error || !project) {
    console.error("[managed casting claim] project lookup", error);
    return NextResponse.redirect(`${origin}/${locale}/casting/status/${encodeURIComponent(token)}?claim=invalid`, 303);
  }

  if (project.client_user_id) {
    return NextResponse.redirect(`${origin}/${locale}/casting/status/${encodeURIComponent(token)}?claim=already`, 303);
  }

  const email = normalizeEmail(project.contact_email);
  if (!email) {
    return NextResponse.redirect(`${origin}/${locale}/casting/status/${encodeURIComponent(token)}?claim=no_email`, 303);
  }

  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("locale", locale);
  callback.searchParams.set("mode", "casting_claim");
  callback.searchParams.set("token", token);

  const supabase = await createServerSupabaseClient();
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callback.toString(),
      shouldCreateUser: true,
    },
  });

  if (otpError) {
    console.error("[managed casting claim] magic link", otpError);
    return NextResponse.redirect(`${origin}/${locale}/casting/status/${encodeURIComponent(token)}?claim=error`, 303);
  }

  return NextResponse.redirect(`${origin}/${locale}/casting/status/${encodeURIComponent(token)}?claim=sent`, 303);
}
