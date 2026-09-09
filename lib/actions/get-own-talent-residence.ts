"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type OwnTalentResidence = {
  countryCode: string;
  citySlug: string;
  cityAr: string;
  cityEn: string;
};

export async function getOwnTalentResidenceAction(): Promise<OwnTalentResidence | null> {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("talents")
    .select("base_country_code, city_slug, city_ar, city_en")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getOwnTalentResidenceAction]", error);
    return null;
  }

  if (!data) return null;

  return {
    countryCode: String(data.base_country_code ?? "").trim().toUpperCase(),
    citySlug: String(data.city_slug ?? "").trim(),
    cityAr: String(data.city_ar ?? "").trim(),
    cityEn: String(data.city_en ?? "").trim(),
  };
}
