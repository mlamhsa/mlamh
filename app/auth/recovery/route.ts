import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const locale = requestUrl.searchParams.get("locale") === "en" ? "en" : "ar";
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/${locale}/forgot-password?error=invalid_link`,
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (exchangeError) {
    console.error("[AuthRecovery.exchangeCodeForSession]", exchangeError);
    return NextResponse.redirect(
      `${origin}/${locale}/forgot-password?error=expired_link`,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[AuthRecovery.getUser]", userError);
    return NextResponse.redirect(
      `${origin}/${locale}/forgot-password?error=recovery_user`,
    );
  }

  return NextResponse.redirect(`${origin}/${locale}/reset-password`);
}
