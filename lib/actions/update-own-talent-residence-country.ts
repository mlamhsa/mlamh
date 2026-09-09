"use server";

import { revalidatePath } from "next/cache";

import { TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type UpdateTalentResidenceCountryResult =
  | { success: true; countryCode: string }
  | { success: false; error: string };

export async function updateOwnTalentResidenceCountryAction(
  countryCode: string,
): Promise<UpdateTalentResidenceCountryResult> {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const normalizedCountryCode = countryCode.trim().toUpperCase();
  const country = TALENT_SIGNUP_COUNTRIES.find(
    (item) => item.code === normalizedCountryCode,
  );

  if (!country) {
    return { success: false, error: "Invalid residence country." };
  }

  const admin = createAdminClient();
  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id, slug, city_slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    return {
      success: false,
      error: talentError?.message ?? "No linked talent profile found.",
    };
  }

  const currentCitySlug = String(talent.city_slug ?? "").trim();
  const matchingCity = country.cities.find(
    (city) => city.value === currentCitySlug,
  );

  const residencePayload = matchingCity
    ? {
        base_country_code: normalizedCountryCode,
        city_slug: matchingCity.value,
        city_ar: matchingCity.ar,
        city_en: matchingCity.en,
      }
    : {
        base_country_code: normalizedCountryCode,
        city_slug: null,
        city_ar: null,
        city_en: null,
      };

  const { error: updateError } = await admin
    .from("talents")
    .update(residencePayload)
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/admin/talents");
  revalidatePath("/ar/talent-dashboard");
  revalidatePath("/en/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/profile");
  revalidatePath("/en/talent-dashboard/profile");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  return { success: true, countryCode: normalizedCountryCode };
}
