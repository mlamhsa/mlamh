"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePublisher(locale: string) {
  const safeLocale = locale === "en" ? "en" : "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError) {
    console.error("[requirePublisher:auth]", userError);
  }

  if (!user) {
    redirect(`/${safeLocale}/publisher-login`);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[requirePublisher:profile]", profileError);
    redirect(`/${safeLocale}/publisher-login`);
  }

  if (!profile) {
    console.error(
      "[requirePublisher:profile] Profile not found for user:",
      user.id
    );

    redirect(`/${safeLocale}/publisher-login`);
  }

  if (profile.account_type === "talent") {
    redirect(`/${safeLocale}/talent-dashboard`);
  }

  if (profile.account_type === "admin") {
    redirect("/admin");
  }

  if (profile.account_type !== "publisher") {
    console.error(
      "[requirePublisher:account-type]",
      profile.account_type
    );

    redirect(`/${safeLocale}/publisher-login`);
  }

  const { data: publisher, error: publisherError } =
    await adminClient
      .from("publishers")
      .select(`
        id,
        profile_id,
        company_name,
        contact_name,
        publisher_type,
        city,
        company_size,
        founded_year,
        description,
        profile_image_url,
        cover_image_url,
        phone,
        email,
        website,
        address,
        instagram,
        tiktok_url,
        snapchat_url,
        linkedin_url,
        verified,
        status
      `)
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (publisherError) {
    console.error(
      "[requirePublisher:publisher]",
      publisherError
    );

    redirect(`/${safeLocale}/publisher-login`);
  }

  if (!publisher) {
    redirect(`/${safeLocale}/register-publisher`);
  }

  return {
    user,
    profile,
    publisher,
  };
}