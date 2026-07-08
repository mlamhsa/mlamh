"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePublisher(locale: string) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect(`/${locale}/login`);
  }

  if (profile.account_type === "talent") {
    redirect(`/${locale}/talent-dashboard`);
  }

  if (profile.account_type === "admin") {
    redirect("/admin");
  }

  if (profile.account_type !== "publisher") {
    redirect(`/${locale}/login`);
  }

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select(`
      id,
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
      linkedin_url
    `)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError) {
    redirect(`/${locale}/login`);
  }

  if (!publisher) {
    redirect(`/${locale}/register-publisher`);
  }

  return {
    user,
    profile,
    publisher,
  };
}