import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  TALENT_SIGNUP_COUNTRIES,
} from "@/lib/data/talent-signup";
import { createAdminClient } from "@/lib/supabase/admin";

function createTalentSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "");
  return `${base || "talent"}-${userId.slice(0, 8)}`;
}

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
  profileVisibility: "public" | "private";
  consent: boolean;
  consentAt: string | null;
};

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
  const profileVisibility = rawVisibility === "private" ? "private" : rawVisibility === "public" ? "public" : null;
  const consent = metadata.data_accuracy_contact_consent === true;
  const consentAt = stringValue(metadata, "data_accuracy_contact_consent_at") || null;

  const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
  const nationalityOption = NATIONALITY_OPTIONS.find((item) => item.value === nationality);
  const genderOption = GENDER_OPTIONS.find((item) => item.value === gender);
  const country = TALENT_SIGNUP_COUNTRIES.find((item) => item.code === residenceCountryCode);
  const city = country?.cities.find((item) => item.value === citySlug);
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
    nationality: nationalityOption.value,
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
  const city = country.cities.find((item) => item.value === data.citySlug)!;
  const now = new Date().toISOString();

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
    onboarding_step: "dashboard",
    data_accuracy_contact_consent: true,
    data_accuracy_contact_consent_at: data.consentAt ?? now,
    updated_at: now,
  };

  if (profile) {
    const { error } = await admin.from("profiles").update(profilePayload).eq("id", profile.id).eq("user_id", userId);
    if (error) throw new Error(`[ensureTalentAccount.profileUpdate] ${error.message}`);
  } else {
    const { error } = await admin.from("profiles").insert({
      user_id: userId,
      ...profilePayload,
      approval_status: "not_submitted",
    });
    if (error) throw new Error(`[ensureTalentAccount.profileInsert] ${error.message}`);
  }

  const { data: existingTalent, error: talentLookupError } = await admin
    .from("talents")
    .select("id,status,published")
    .eq("user_id", userId)
    .maybeSingle();
  if (talentLookupError) throw new Error(`[ensureTalentAccount.talentLookup] ${talentLookupError.message}`);

  const talentPayload = {
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
    nationality_slug: data.nationality,
    nationality: data.nationality,
    gender: data.gender,
    profile_visibility: data.profileVisibility,
  };

  if (existingTalent) {
    const { error } = await admin
      .from("talents")
      .update(talentPayload)
      .eq("id", existingTalent.id)
      .eq("user_id", userId);
    if (error) throw new Error(`[ensureTalentAccount.talentUpdate] ${error.message}`);
  } else {
    const { error } = await admin.from("talents").insert({
      user_id: userId,
      ...talentPayload,
      image_url: null,
      slug: createTalentSlug(data.displayName, userId),
      status: "draft",
      published: false,
      verified: false,
      featured: false,
      profile_completion: 0,
    });
    if (error) throw new Error(`[ensureTalentAccount.talentInsert] ${error.message}`);
  }

  return { ok: true as const };
}
