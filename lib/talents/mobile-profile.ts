import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import { createAdminClient } from "@/lib/supabase/admin";
import { signTalentMediaReference, signTalentMediaReferences } from "@/lib/talents/talent-media-signing";

export type MobileTalentProfile = {
  id: number;
  slug: string | null;
  displayName: string;
  phone: string | null;
  category: string;
  primaryRole: "actor" | "model" | null;
  city: string | null;
  citySlug: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  nationalitySlug: string | null;
  profileVisibility: "public" | "verified_publishers" | "private" | null;
  dataAccuracyContactConsent: boolean;
  imageUrl: string | null;
  gallery: string[];
  bio: string | null;
  skills: string[];
  languages: string[];
  dialects: string[];
  baseCountryCode: string | null;
  profileCompletion: number;
  approvalReadiness: { ready: boolean; percent: number; missing: Array<{ key: string; label: string }> };
  availabilityStatus: string | null;
  heightCm: number | null;
  weightKg: number | null;
  eyeColor: string | null;
  hairColor: string | null;
  hairType: string | null;
  skinColor: string | null;
  clothingSize: string | null;
  shoeSize: number | null;
  chestSize: number | null;
  waistSize: number | null;
  hipSize: number | null;
  actingAgeMin: number | null;
  actingAgeMax: number | null;
  modelingTypes: string[];
  experienceYears: number | null;
  readyToTravel: boolean;
  hasPassport: boolean;
  hasCar: boolean;
  workOutsideCity: boolean;
  workOutsideCountry: boolean;
  verified: boolean;
  reviewReason: string | null;
  approvalStatus: string | null;
  profileStatus: string | null;
  published: boolean;
};

function compactStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function getMobileTalentProfile({ userId, locale }: { userId: string; locale: "ar" | "en" }) {
  const supabase = createAdminClient();
  const [{ data: profile, error: profileError }, { data: talent, error: talentError }] = await Promise.all([
    supabase.from("profiles").select("id,account_type,approval_status,status,phone,data_accuracy_contact_consent").eq("user_id", userId).maybeSingle(),
    supabase.from("talents").select("id,slug,name_ar,name_en,display_name_ar,display_name_en,category_ar,category_en,primary_role,city_slug,city_ar,city_en,gender,date_of_birth,nationality,nationality_slug,profile_visibility,image_url,gallery_images,photos,full_body_photos,bio_ar,bio_en,skills,languages,dialects,base_country_code,availability_status,height_cm,weight_kg,eye_color,hair_color,hair_type,skin_color,clothing_size,shoe_size,acting_age_min,acting_age_max,modeling_types,experience_years,ready_to_travel,has_passport,has_car,work_outside_city,work_outside_country,verified,is_verified,status,published,portfolio_url,showreel_url,chest_size,waist_size,hip_size,previous_work").eq("user_id", userId).maybeSingle(),
  ]);

  if (profileError || talentError) return { ok: false as const, code: "PROFILE_LOOKUP_FAILED" as const };
  if (!profile || profile.account_type !== "talent" || !talent) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };

  const displayName = locale === "ar"
    ? talent.display_name_ar || talent.name_ar || talent.display_name_en || talent.name_en
    : talent.display_name_en || talent.name_en || talent.display_name_ar || talent.name_ar;
  const category = locale === "ar" ? talent.category_ar || talent.category_en : talent.category_en || talent.category_ar;
  const bio = locale === "ar" ? talent.bio_ar || talent.bio_en : talent.bio_en || talent.bio_ar;
  const galleryRefs = [...new Set([...compactStrings(talent.gallery_images), ...compactStrings(talent.photos), ...compactStrings(talent.full_body_photos)])].slice(0, 12);
  const [signedPrimary, signedGallery] = await Promise.all([
    signTalentMediaReference(talent.image_url, supabase),
    signTalentMediaReferences(galleryRefs, supabase),
  ]);
  const role = talent.primary_role === "actor" || talent.primary_role === "model" ? talent.primary_role : null;
  const profileCompletion = TalentProfileService.calculateCompletion({
    ...talent,
    gallery_images: galleryRefs,
  });
  const readiness = getTalentProfileReadiness({
    ...talent,
    phone: profile.phone,
    data_accuracy_contact_consent: profile.data_accuracy_contact_consent,
  });
  const readinessPercent = Math.round(
    (readiness.completedRequirements / Math.max(readiness.totalRequirements, 1)) * 100,
  );

  let reviewReason: string | null = null;
  if (String(profile.approval_status ?? "").trim().toLowerCase() === "changes_requested") {
    const { data: latestReview } = await supabase
      .from("profile_review_history")
      .select("reason")
      .eq("profile_id", profile.id)
      .eq("account_type", "talent")
      .eq("decision", "changes_requested")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    reviewReason = String(latestReview?.reason ?? "").trim() || null;
  }

  const item: MobileTalentProfile = {
    id: Number(talent.id),
    slug: talent.slug ?? null,
    displayName: displayName || "MLAMH Talent",
    phone: profile.phone ?? null,
    category: category || "Talent",
    primaryRole: role,
    city: locale === "ar" ? talent.city_ar || talent.city_en || null : talent.city_en || talent.city_ar || null,
    citySlug: talent.city_slug ?? null,
    gender: talent.gender ?? null,
    dateOfBirth: talent.date_of_birth ?? null,
    nationality: talent.nationality ?? null,
    nationalitySlug: talent.nationality_slug ?? null,
    profileVisibility:
      talent.profile_visibility === "public" || talent.profile_visibility === "verified_publishers" || talent.profile_visibility === "private"
        ? talent.profile_visibility
        : null,
    dataAccuracyContactConsent: profile.data_accuracy_contact_consent === true,
    imageUrl: signedPrimary || signedGallery[0] || null,
    gallery: signedGallery,
    bio: bio || null,
    skills: compactStrings(talent.skills).slice(0, 12),
    languages: compactStrings(talent.languages).slice(0, 8),
    dialects: compactStrings(talent.dialects).slice(0, 8),
    baseCountryCode: talent.base_country_code ?? null,
    profileCompletion: Math.max(0, Math.min(100, profileCompletion)),
    approvalReadiness: {
      ready: readiness.isReady,
      percent: Math.max(0, Math.min(100, readinessPercent)),
      missing: readiness.missingRequirements.map((requirement) => ({
        key: requirement.key,
        label: locale === "ar" ? requirement.ar : requirement.en,
      })),
    },
    availabilityStatus: talent.availability_status ?? null,
    heightCm: nullableNumber(talent.height_cm),
    weightKg: nullableNumber(talent.weight_kg),
    eyeColor: talent.eye_color ?? null,
    hairColor: talent.hair_color ?? null,
    hairType: talent.hair_type ?? null,
    skinColor: talent.skin_color ?? null,
    clothingSize: talent.clothing_size ?? null,
    shoeSize: nullableNumber(talent.shoe_size),
    chestSize: nullableNumber(talent.chest_size),
    waistSize: nullableNumber(talent.waist_size),
    hipSize: nullableNumber(talent.hip_size),
    actingAgeMin: nullableNumber(talent.acting_age_min),
    actingAgeMax: nullableNumber(talent.acting_age_max),
    modelingTypes: compactStrings(talent.modeling_types),
    experienceYears: nullableNumber(talent.experience_years),
    readyToTravel: Boolean(talent.ready_to_travel),
    hasPassport: Boolean(talent.has_passport),
    hasCar: Boolean(talent.has_car),
    workOutsideCity: Boolean(talent.work_outside_city),
    workOutsideCountry: Boolean(talent.work_outside_country),
    verified: Boolean(talent.verified || talent.is_verified),
    reviewReason,
    approvalStatus: profile.approval_status ?? null,
    profileStatus: talent.status ?? profile.status ?? null,
    published: Boolean(talent.published),
  };

  return { ok: true as const, item };
}