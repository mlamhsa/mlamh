import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");

  const locale =
  requestUrl.searchParams.get("locale") === "en"
    ? "en"
    : "ar";

const mode =
  requestUrl.searchParams.get("mode");

const accountType =
  requestUrl.searchParams.get("type");

const isSignup =
  mode === "signup";

const isValidAccountType =
  accountType === "talent" ||
  accountType === "publisher";

const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=oauth_callback`,
    );
  }

  const supabase =
    await createServerSupabaseClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      "[OAuthCallback.exchangeCodeForSession]",
      exchangeError,
    );

    return NextResponse.redirect(
      `${origin}/${locale}/login?error=oauth_callback`,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "[OAuthCallback.getUser]",
      userError,
    );

    return NextResponse.redirect(
      `${origin}/${locale}/login?error=oauth_user`,
    );
  }

  const adminClient = createAdminClient();

  const {
    data: profile,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[OAuthCallback.profile]",
      profileError,
    );

    return NextResponse.redirect(
      `${origin}/${locale}/login?error=oauth_profile`,
    );
  }

  /*
   * مستخدم Google جديد.
   *
   * لا ننشئ profile تلقائياً هنا لأننا لا نعرف
   * هل المستخدم موهبة أم ناشر.
   *
   * نرسله لمسار الانضمام الحالي لاختيار نوع الحساب
   * واستكمال بياناته بشكل صحيح.
   */
  if (!profile || !profile.account_type) {
    if (isSignup && isValidAccountType) {
      const displayName =
        String(
          user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "MLAMH User",
        ).trim() || "MLAMH User";
  
      const {
        error: profileInsertError,
      } = await adminClient
        .from("profiles")
        .insert({
          user_id: user.id,
          account_type: accountType,
          display_name: displayName,
          status: "active",
          onboarding_status: "account_created",
          onboarding_step:
            accountType === "talent"
              ? "talent_profile"
              : "publisher_profile",
          approval_status: "not_submitted",
        });
  
      if (profileInsertError) {
        console.error(
          "[OAuthCallback.profileInsert]",
          profileInsertError,
        );
  
        return NextResponse.redirect(
          `${origin}/${locale}/login?error=oauth_profile`,
        );
      }
  
      return NextResponse.redirect(
        accountType === "talent"
          ? `${origin}/${locale}/join/talent`
          : `${origin}/${locale}/join/publisher`,
      );
    }
  
    return NextResponse.redirect(
      `${origin}/${locale}/join/account-type?oauth=google`,
    );
  }

  /*
   * مستخدم موجود مسبقاً ولديه نوع حساب.
   * dashboard-router يتولى توجيهه للوحة الصحيحة.
   */
  return NextResponse.redirect(
    `${origin}/${locale}/dashboard-router`,
  );
}