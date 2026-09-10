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

function existingAccountLoginUrl(
  origin: string,
  locale: "ar" | "en",
  email: string | null | undefined,
) {
  const url = new URL(`/${locale}/login`, origin);
  url.searchParams.set("error", "account_exists");
  if (email) url.searchParams.set("email", email.trim().toLowerCase());
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

  const existingAccountType =
    profile?.account_type === "talent" || profile?.account_type === "publisher"
      ? profile.account_type
      : null;

  // The profile already attached to this Supabase user is authoritative.
  // OAuth must never restart onboarding or change its account type.
  if (existingAccountType) {
    if (profile?.phone?.trim()) {
      return NextResponse.redirect(`${origin}/${locale}/dashboard-router`);
    }

    return NextResponse.redirect(
      completeAccountUrl(origin, locale, {
        type: existingAccountType,
        intent: existingAccountType === "publisher" ? "publisher" : null,
        provider,
      }),
    );
  }

  // Some OAuth configurations can create a distinct Auth user even when the
  // same normalized email already owns an MLAMH profile. Detect that case
  // before onboarding. We intentionally do NOT merge identities by heuristic.
  // The newly-created orphan Auth user has no profile, so remove it and send
  // the person to the existing-account login path instead.
  if (user.email) {
    const { data: otherAccountRows, error: otherAccountError } = await adminClient.rpc(
      "lookup_other_mlamh_account_by_email",
      {
        p_email: user.email,
        p_exclude_user_id: user.id,
      },
    );

    if (otherAccountError) {
      console.error("[OAuthCallback.otherAccountLookup]", otherAccountError.message);
    } else {
      const otherAccount = Array.isArray(otherAccountRows) ? otherAccountRows[0] : null;

      if (otherAccount?.account_exists) {
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error("[OAuthCallback.duplicateOAuthCleanup]", deleteError.message);
        }

        await supabase.auth.signOut();
        return NextResponse.redirect(existingAccountLoginUrl(origin, locale, user.email));
      }
    }
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

  return NextResponse.redirect(`${origin}/${locale}/join`);
}
