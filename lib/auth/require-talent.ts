"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireTalent(
  locale: string,
) {
  const safeLocale =
    locale === "en" ? "en" : "ar";

  const authClient =
    await createServerSupabaseClient();

  const adminClient =
    createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError) {
    console.error(
      "[requireTalent:auth]",
      userError,
    );
  }

  if (!user) {
    redirect(`/${safeLocale}/login`);
  }

  const {
    data: profile,
    error: profileError,
  } = await adminClient
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
      profile_completed_at
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error(
      "[requireTalent:profile]",
      profileError,
    );

    redirect(`/${safeLocale}/login`);
  }

  if (!profile) {
    console.error(
      "[requireTalent:profile] Profile not found:",
      user.id,
    );

    redirect(
      `/${safeLocale}/join?type=talent`,
    );
  }

  if (
    profile.account_type === "publisher"
  ) {
    redirect(
      `/${safeLocale}/publisher-dashboard`,
    );
  }

  if (profile.account_type === "admin") {
    redirect("/admin");
  }

  if (
    profile.account_type !== "talent"
  ) {
    console.error(
      "[requireTalent:account-type]",
      profile.account_type,
    );

    redirect(`/${safeLocale}/join`);
  }

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select(`
      id,
      slug,
      user_id,

      name_ar,
      name_en,
      image_url,

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
    .maybeSingle();

  if (talentError) {
    console.error(
      "[requireTalent:talent]",
      talentError,
    );
  }

  return {
    user,
    profile,
    talent: talent ?? null,

    onboardingStatus:
      profile.onboarding_status ??
      "account_created",

    onboardingStep:
      profile.onboarding_step ??
      "talent_profile",

    // توافق مؤقت مع الاستدعاءات القديمة.
    approvalStatus:
      profile.approval_status ??
      "not_submitted",

    isProfileCompleted:
      profile.onboarding_status ===
        "completed" ||
      Boolean(
        profile.profile_completed_at,
      ),

    hasTalentProfile:
      Boolean(talent),
  };
}
