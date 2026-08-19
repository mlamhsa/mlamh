"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePublisher(locale: string) {
  const safeLocale = locale === "en" ? "en" : "ar";
  const loginPath = `/${safeLocale}/login`;

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(loginPath);
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select(
        `
          id,
          account_type,
          approval_status,
          onboarding_status,
          onboarding_step
        `,
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    console.warn(
      "[requirePublisher:profile]",
      profileError,
    );

    redirect(loginPath);
  }

  if (!profile) {
    console.warn(
      "[requirePublisher:profile] Profile not found for user:",
      user.id,
    );

    redirect(loginPath);
  }

  if (profile.account_type === "talent") {
    redirect(`/${safeLocale}/talent-dashboard`);
  }

  if (profile.account_type === "admin") {
    redirect("/admin");
  }

  if (profile.account_type !== "publisher") {
    console.warn(
      "[requirePublisher:account-type]",
      profile.account_type,
    );

    redirect(loginPath);
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
    console.warn(
      "[requirePublisher:publisher]",
      publisherError,
    );

    redirect(loginPath);
  }

  if (!publisher) {
    redirect(`/${safeLocale}/join/publisher`);
  }

  return {
    user,
    profile,
    publisher,
  };
}