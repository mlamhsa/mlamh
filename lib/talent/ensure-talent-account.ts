import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { GENDER_OPTIONS, PROFILE_VISIBILITY_OPTIONS, TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";
import { resolveNationality } from "@/lib/data/nationality-normalization";
import { getSaudiCityBySlug } from "@/lib/data/saudi-cities";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStableTalentSlug } from "@/lib/talent/talent-slug";

function stringValue(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value.trim() : "";
}

export type TalentSignupData = {
  displayName: string;
  phone: string;
  talentType: string;
  nationality: string;
  gender: string;
  residenceCountryCode: string;
  citySlug: string;
  profileVisibility: "public" | "verified_publishers" | "private";
  consent: boolean;
  consentAt: string | null;
};

function resolveSignupCity(countryCode: string, citySlug: string) {
  if (countryCode === "SA") {
    const city = getSaudiCityBySlug(citySlug);
    if (!city) return null;
    return { value: city.slug, ar: city.ar, en: city.en };
  }

  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode);
  return country?.cities.find((item) => item.value === citySlug) ?? null;
}

export function talentSignupDataFromMetadata(
  metadata: Record<string, unknown>,
  fallback: { displayName?: string | null; phone?: string | null } = {},
): TalentSignupData | null {
  const displayName = stringValue(metadata, "full_name") || stringValue(metadata, "display_name") || String(fallback.displayName ?? "").trim();
  const phone = stringValue(metadata, "phone") || String(fallback.phone ?? "").trim();
  const talentType = stringValue(metadata, "talent_type") || stringValue(metadata, "primary_role") || stringValue(metadata, "signup_intent");
  const nationality = stringValue(metadata, "nationality_slug") || stringValue(metadata, "nationality");
  const gender = stringValue(metadata, "gender");
  const residenceCountryCode = stringValue(metadata, "residence_country_code") || stringValue(metadata, "base_country_code");
  const citySlug = stringValue(metadata, "city_slug");
  const rawVisibility = stringValue(metadata, "profile_visibility");
  const profileVisibility = rawVisibility === "private" || rawVisibility === "verified_publishers" || rawVisibility === "public" ? rawVisibility : null;
  const consent = metadata.data_accuracy_contact_consent === true;
  const consentAt = stringValue(metadata, "data_accuracy_contact_consent_at") || null;

  const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
  const nationalityOption = resolveNationality(nationality);
  const genderOption = GENDER_OPTIONS.find((item) => item.value === gender);
  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === residenceCountryCode);
  const city = resolveSignupCity(residenceCountryCode, citySlug);
  const visibility = PROFILE_VISIBILITY_OPTIONS.find((item) => item.value === profileVisibility);

  if (
    displayName.length < 2 ||
    !/^\+[1-9]\d{7,14}$/.test(phone) ||
    !category ||
    !nationalityOption ||
    !genderOption ||
    !country ||
    !city ||
    !visibility ||
    !consent
  ) {
    return null;
  }

  return {
    displayName,
    phone,
    talentType: category.slug,
    nationality: nationalityOption.slug,
    gender: genderOption.value,
    residenceCountryCode: country.code,
    citySlug: city.value,
    profileVisibility: visibility.value,
    consent,
    consentAt,
  };
}

export async function ensureTalentAccountFromSignupData(
  userId: string,
  data: TalentSignupData,
) {
  const admin = createAdminClient();
  const category = TALENT_CATEGORIES.find((item) => item.slug === data.talentType)!;
  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === data.residenceCountryCode)!;
  const city = resolveSignupCity(country.code, data.citySlug);
  const nationality = resolveNationality(data.nationality);
  if (!city || !nationality) throw new Error("INVALID_CANONICAL_SIGNUP_DATA");
  const now = new Date().toISOString();

  const { data: existingTalent, error: talentLookupError } = await admin
    .from("talents")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (talentLookupError) throw new Error(`[ensureTalentAccount.talentLookup] ${talentLookupError.message}`);

  const { data: profile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id,account_type,approval_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileLookupError) throw new Error(`[ensureTalentAccount.profileLookup] ${profileLookupError.message}`);
  if (profile?.account_type && profile.account_type !== "talent") throw new Error("ACCOUNT_TYPE_CONFLICT");

  const profilePayload = {
    account_type: "talent",
    display_name: data.displayName,
    phone: data.phone,
    status: "active",
    onboarding_status: "profile_in_progress",
    onboarding_step: "talent_profile",
    data_accuracy_contact_consent: true,
    data_accuracy_contact_consent_at: data.consentAt ?? now,
    updated_at: now,
  };

  if (existingTalent) {
    if (!profile) {
      const { data: repairedProfile, error: profileInsertError } = await admin
        .from("profiles")
        .insert({
          user_id: userId,
          ...profilePayload,
          approval_status: "not_submitted",
        })
        .select("id")
        .single();
      if (profileInsertError || !repairedProfile) {
        throw new Error(
          `[ensureTalentAccount.profileRepair] ${profileInsertError?.message ?? "No profile returned"}`,
        );
      }
    }

    return {
      ok: true as const,
      created: false as const,
      preservedExistingTalent: true as const,
      talentId: existingTalent.id,
    };
  }

  const { data: createdTalent, error: insertError } = await admin
    .from("talents")
    .insert({
      user_id: userId,
      name_en: data.displayName,
      name_ar: data.displayName,
      category_slug: category.slug,
      category_en: category.en,
      category_ar: category.ar,
      primary_role: category.slug,
      base_country_code: country.code,
      city_slug: city.value,
      city_en: city.en,
      city_ar: city.ar,
      nationality_slug: nationality.slug,
      nationality: nationality.en,
      gender: data.gender,
      profile_visibility: data.profileVisibility,
      image_url: null,
      slug: createStableTalentSlug(data.displayName, userId),
      status: "draft",
      published: false,
      verified: false,
      featured: false,
      profile_completion: 0,
    })
    .select("id")
    .single();

  if (insertError || !createdTalent) throw new Error(`[ensureTalentAccount.talentInsert] ${insertError?.message ?? "No talent returned"}`);

  let profileWriteError: { message?: string } | null = null;
  let persistedProfileId: number | string | null = null;
  if (profile) {
    const { data: persistedProfile, error } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", profile.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    profileWriteError = error;
    persistedProfileId = persistedProfile?.id ?? null;
  } else {
    const { data: persistedProfile, error } = await admin
      .from("profiles")
      .insert({
        user_id: userId,
        ...profilePayload,
        approval_status: "not_submitted",
      })
      .select("id")
      .single();
    profileWriteError = error;
    persistedProfileId = persistedProfile?.id ?? null;
  }

  if (profileWriteError || persistedProfileId === null) {
    const { error: rollbackError } = await admin
      .from("talents")
      .delete()
      .eq("id", createdTalent.id)
      .eq("user_id", userId)
      .eq("status", "draft")
      .eq("published", false);
    if (rollbackError) {
      console.error("[ensureTalentAccount.rollbackTalent]", rollbackError.message);
    }
    throw new Error(
      `[ensureTalentAccount.profileWrite] ${profileWriteError?.message ?? "No profile row persisted"}`,
    );
  }

  return {
    ok: true as const,
    created: true as const,
    preservedExistingTalent: false as const,
    talentId: createdTalent.id,
  };
}
