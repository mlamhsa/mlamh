import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ensureTalentAccountFromSignupData,
  talentSignupDataFromMetadata,
} from "@/lib/talent/ensure-talent-account";

function completeAccountUrl(
  origin: string,
  locale: "ar" | "en",
  params: { type?: string | null; intent?: string | null; provider?: string | null },
) {
  const url = new URL(`/${locale}/join/complete-account`, origin);
  if (params.type === "talent" || params.type === "publisher") url.searchParams.set("type", params.type);
  if (params.intent === "actor" || params.intent === "model" || params.intent === "publisher") url.searchParams.set("intent", params.intent);
  if (params.provider === "google" || params.provider === "apple" || params.provider === "email") url.searchParams.set("provider", params.provider);
  return url.toString();
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const locale = requestUrl.searchParams.get("locale") === "en" ? "en" : "ar";
  const mode = requestUrl.searchParams.get("mode");
  const accountType = requestUrl.searchParams.get("type");
  const intent = requestUrl.searchParams.get("intent");
  const provider = requestUrl.searchParams.get("provider");
  const isSignup = mode === "signup";
  const isRecovery = mode === "recovery";
  const isValidAccountType = accountType === "talent" || accountType === "publisher";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      isRecovery
        ? `${origin}/${locale}/forgot-password?error=invalid_link`
        : `${origin}/${locale}/login?error=oauth_callback`,
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[OAuthCallback.exchangeCodeForSession]", exchangeError);
    return NextResponse.redirect(
      isRecovery
        ? `${origin}/${locale}/forgot-password?error=expired_link`
        : `${origin}/${locale}/login?error=oauth_callback`,
    );
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[OAuthCallback.getUser]", userError);
    return NextResponse.redirect(
      isRecovery
        ? `${origin}/${locale}/forgot-password?error=recovery_user`
        : `${origin}/${locale}/login?error=oauth_user`,
    );
  }

  if (isRecovery) {
    return NextResponse.redirect(`${origin}/${locale}/reset-password`);
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,account_type,phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[OAuthCallback.profile]", profileError);
    return NextResponse.redirect(`${origin}/${locale}/login?error=oauth_profile`);
  }

  if (profile?.account_type && profile.phone?.trim()) {
    return NextResponse.redirect(`${origin}/${locale}/dashboard-router`);
  }

  if (isSignup && accountType === "talent" && provider === "email") {
    const signupData = talentSignupDataFromMetadata(user.user_metadata ?? {});

    if (signupData) {
      try {
        await ensureTalentAccountFromSignupData(user.id, signupData);

        const { error: metadataError } = await adminClient.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata ?? {}),
            account_type: "talent",
            onboarding_status: "profile_in_progress",
            onboarding_step: "dashboard",
            email_verified: true,
          },
        });

        if (metadataError) {
          console.error("[OAuthCallback.emailTalent.metadata]", metadataError);
        }

        return NextResponse.redirect(`${origin}/${locale}/talent-dashboard`);
      } catch (error) {
        console.error("[OAuthCallback.emailTalent.finalize]", error);
        return NextResponse.redirect(
          completeAccountUrl(origin, locale, { type: "talent", provider: "email" }),
        );
      }
    }
  }

  if (isSignup && isValidAccountType) {
    return NextResponse.redirect(
      completeAccountUrl(origin, locale, { type: accountType, intent, provider }),
    );
  }

  if (profile?.account_type === "talent" || profile?.account_type === "publisher") {
    return NextResponse.redirect(
      completeAccountUrl(origin, locale, { type: profile.account_type, intent, provider }),
    );
  }

  return NextResponse.redirect(`${origin}/${locale}/join`);
}
