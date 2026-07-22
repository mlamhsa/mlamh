"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireTalent(locale: string) {
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

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, user_id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[requireTalent:profile]", profileError);
    redirect(`/${safeLocale}/login`);
  }

  if (profile?.account_type === "publisher") {
    redirect(`/${safeLocale}/publisher-dashboard`);
  }

  if (profile?.account_type === "admin") {
    redirect("/admin");
  }

  if (
    profile?.account_type &&
    profile.account_type !== "talent"
  ) {
    console.error(
      "[requireTalent:account-type]",
      profile.account_type
    );

    redirect(`/${safeLocale}/login`);
  }

  if (!profile) {
    console.error(
      "[requireTalent:profile] Profile not found for user:",
      user.id
    );
  }

  const { data: talent, error: talentError } = await adminClient
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

      gender,
      status,
      availability_status,

      published,
      verified,
      featured,

      bio_ar,
      bio_en,

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

      experience_years,
      ready_to_travel,
      has_passport,
      has_car,
      work_outside_city,
      work_outside_country,

      video_intro,
      showreel_url
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    console.error("[requireTalent:talent]", talentError);
  }

  return {
    user,
    profile: profile ?? null,
    talent: talent ?? null,
  };
}