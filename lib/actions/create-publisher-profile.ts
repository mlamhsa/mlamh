"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_PUBLISHER_TYPES = new Set([
  "individual",
  "salon",
  "store",
  "agency",
  "production_company",
  "brand",
  "photographer",
  "marketer",
  "other",
]);

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requiredStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

export async function createPublisherProfileAction(formData: FormData) {
  const authClient = await createServerSupabaseClient();

  // Email + Password registration
  const email = requiredStringValue(formData, "email");
  const password = requiredStringValue(formData, "password");

  const { data: authData, error: authError } = await authClient.auth.signUp({
    email,
    password,
  });

  if (authError) throw new Error(`[createPublisherProfileAction.auth] ${authError.message}`);
  const userId = authData.user?.id;
  if (!userId) throw new Error("[createPublisherProfileAction.auth] No user ID returned");

  const adminClient = createAdminClient();

  const contactName = requiredStringValue(formData, "contact_name");
  const publisherType = requiredStringValue(formData, "publisher_type");
  if (!ALLOWED_PUBLISHER_TYPES.has(publisherType)) throw new Error("Invalid publisher type.");

  const publisherTypeOther = stringValue(formData, "publisher_type_other");
  if (publisherType === "other" && !publisherTypeOther) throw new Error("Please describe your publisher type.");

  const companyName = stringValue(formData, "company_name");
  const phone = stringValue(formData, "phone");

  const displayName = companyName || contactName;

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingProfile) {
    redirect(
      existingProfile.account_type === "publisher"
        ? "/publisher-dashboard"
        : "/talent-dashboard"
    );
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .insert({
      user_id: userId,
      account_type: "publisher",
      display_name: displayName,
      phone: phone || null,
    })
    .select("id")
    .single();

  if (profileError || !profile) throw new Error(`[createPublisherProfileAction.profile] ${profileError?.message || "Failed to create profile."}`);

  const { error: publisherError } = await adminClient
  .from("publishers")
  .insert({
    profile_id: profile.id,
    publisher_type: publisherType,
    publisher_type_other: publisherType === "other" ? publisherTypeOther : null,
    company_name: companyName || null,
    contact_name: contactName,
    city: stringValue(formData, "city") || null,
    website: stringValue(formData, "website") || null,
    instagram: stringValue(formData, "instagram") || null,
  });

  if (publisherError) throw new Error(`[createPublisherProfileAction.publisher] ${publisherError.message}`);

  redirect("/publisher-dashboard");
}