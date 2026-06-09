"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requirePublisher(locale: string) {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  console.log("AUTH USER:", user?.email);
  console.log("AUTH USER ID:", user?.id);

  if (!user) {
    redirect(`/${locale}/publisher-login`);
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("PROFILE:", profile);

  if (!profile) {
    redirect(`/${locale}/publisher-login`);
  }

  // إذا كان الحساب موهبة نحوله مباشرة للوحة الموهبة
  if (profile.account_type === "talent") {
    redirect(`/${locale}/talent-dashboard`);
  }

  // إذا لم يكن ناشراً
  if (profile.account_type !== "publisher") {
    redirect(`/${locale}/publisher-login`);
  }

  const { data: publisher } = await adminClient
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

  console.log("PUBLISHER:", publisher);

  if (!publisher) {
    redirect(`/${locale}/publisher-login`);
  }

  return {
    user,
    profile,
    publisher,
  };
}