"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_AVAILABILITY = new Set([
  "available_now",
  "available_this_week",
  "available_next_month",
  "unavailable",
]);

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : null;
}

function availabilityValue(formData: FormData) {
  const value = stringValue(formData, "availability_status");
  return ALLOWED_AVAILABILITY.has(value) ? value : "available_now";
}

export async function updateOwnTalentProfileAction(formData: FormData) {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    throw new Error("No linked talent profile found.");
  }

  const payload = {
    city_en: nullableStringValue(formData, "city_en"),
    city_ar: nullableStringValue(formData, "city_ar"),
    bio_en: nullableStringValue(formData, "bio_en"),
    bio_ar: nullableStringValue(formData, "bio_ar"),
    instagram: nullableStringValue(formData, "instagram"),
    tiktok: nullableStringValue(formData, "tiktok"),
    snapchat: nullableStringValue(formData, "snapchat"),
    portfolio_url: nullableStringValue(formData, "portfolio_url"),
    availability_status: availabilityValue(formData),
  };

  const { error: updateError } = await adminClient
    .from("talents")
    .update(payload)
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`[updateOwnTalentProfileAction] ${updateError.message}`);
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/profile");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/talent-dashboard/profile?updated=1");
}