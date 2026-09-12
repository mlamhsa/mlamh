"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isTransientSupabaseError(error: { message?: string } | null | undefined) {
  const message = String(error?.message ?? "").toLowerCase();
  return message.includes("gateway timeout") || message.includes("timeout") || message.includes("fetch failed");
}

async function retryTransient<T extends { data: unknown; error: { message?: string } | null }>(
  operation: () => PromiseLike<T>,
): Promise<T> {
  let result = await operation();
  if (!result.error || !isTransientSupabaseError(result.error)) return result;

  await new Promise((resolve) => setTimeout(resolve, 120));
  result = await operation();
  return result;
}

export async function requireTalent(
  locale: string,
) {
  const safeLocale = locale === "en" ? "en" : "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError) {
    console.error("[requireTalent:auth]", userError);
  }

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const profileResult = await retryTransient(() =>
    adminClient
      .from("profiles")
      .select(`
        id,
        user_id,
        account_type,
        display_name,
        phone,
        status,
        onboarding_status,
        onboarding_step,
        approval_status,
        phone_verified_at,
        profile_completed_at,
        data_accuracy_contact_consent
      `)
      .eq("user_id", user.id)
      .maybeSingle(),
  );

  const profile = profileResult.data;
  const profileError = profileResult.error;

  if (profileError) {
    console.error("[requireTalent:profile]", profileError);
    // Authentication already succeeded. A database timeout is not a sign-out
    // condition, so never bounce an authenticated user to /login because the
    // profile query temporarily failed.
    throw new Error("TALENT_PROFILE_TEMPORARILY_UNAVAILABLE");
  }

  if (!profile) {
    redirect(`/${safeLocale}/join?type=talent`);
  }

  if (profile.account_type === "publisher") {
    redirect(`/${safeLocale}/publisher-dashboard`);
  }

  if (profile.account_type === "admin") {
    redirect("/admin");
  }

  if (profile.account_type !== "talent") {
    console.error("[requireTalent:account-type]", profile.account_type);
    redirect(`/${safeLocale}/join`);
  }

  const talentResult = await retryTransient(() =>
    adminClient
      .from("talents")
      .select(`
        id,
        slug,
        user_id,

        name_ar,
        name_en,
        image_url,

        base_country_code,
        city_ar,
        city_en,
        city_slug,

        category_ar,
        category_en,
        category_slug,
        primary_role,

        gender,
        nationality,
        nationality_slug,
        date_of_birth,
        profile_visibility,

        status,
        availability_status,

        published,
        verified,
        featured,

        bio_ar,
        bio_en,

        languages,
        dialects,
        skills,

        whatsapp,
        instagram,
        tiktok,
        snapchat,
        portfolio_url,

        height_cm,
        weight_kg,
        eye_color,
        hair_color,
        hair_type,
        skin_color,
        clothing_size,
        shoe_size,
        chest_size,
        waist_size,
        hip_size,

        acting_age_min,
        acting_age_max,
        modeling_types,

        experience_years,
        previous_work,
        ready_to_travel,
        has_passport,
        has_car,
        work_outside_city,
        work_outside_country,

        gallery_images,
        video_intro,
        showreel_url
      `)
      .eq("user_id", user.id)
      .maybeSingle(),
  );

  if (talentResult.error) {
    console.error("[requireTalent:talent]", talentResult.error);
    throw new Error("TALENT_RECORD_TEMPORARILY_UNAVAILABLE");
  }

  const talent = talentResult.data;

  // Recover legacy/incomplete talent accounts centrally so every dashboard page
  // behaves the same way instead of rendering a partial shell with no talent row.
  if (!talent) {
    redirect(`/${safeLocale}/join/talent?message=recovery`);
  }

  return {
    user,
    profile,
    talent,

    onboardingStatus: profile.onboarding_status ?? "account_created",
    onboardingStep: profile.onboarding_step ?? "talent_profile",

    // توافق مؤقت مع الاستدعاءات القديمة.
    approvalStatus: profile.approval_status ?? "not_submitted",

    isProfileCompleted:
      profile.onboarding_status === "completed" ||
      Boolean(profile.profile_completed_at),

    hasTalentProfile: true,
  };
}
