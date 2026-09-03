import { createAdminClient } from "@/lib/supabase/admin";
import { signTalentMediaReference, signTalentMediaReferences } from "@/lib/talents/talent-media-signing";

export type MobileTalentProfile = {
  id: number;
  slug: string | null;
  displayName: string;
  category: string;
  city: string | null;
  imageUrl: string | null;
  gallery: string[];
  bio: string | null;
  skills: string[];
  languages: string[];
  baseCountryCode: string | null;
  profileCompletion: number;
  availabilityStatus: string | null;
  verified: boolean;
  approvalStatus: string | null;
  profileStatus: string | null;
  published: boolean;
};

function compactStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

export async function getMobileTalentProfile({ userId, locale }: { userId: string; locale: "ar" | "en" }) {
  const supabase = createAdminClient();
  const [{ data: profile, error: profileError }, { data: talent, error: talentError }] = await Promise.all([
    supabase.from("profiles").select("account_type,approval_status,status").eq("user_id", userId).maybeSingle(),
    supabase.from("talents").select("id,slug,name_ar,name_en,display_name_ar,display_name_en,category_ar,category_en,image_url,gallery_images,photos,full_body_photos,bio_ar,bio_en,skills,languages,base_country_code,profile_completion,availability_status,verified,is_verified,status,published,city_ar,city_en").eq("user_id", userId).maybeSingle(),
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

  const item: MobileTalentProfile = {
    id: Number(talent.id),
    slug: talent.slug ?? null,
    displayName: displayName || "MLAMH Talent",
    category: category || "Talent",
    city: locale === "ar" ? talent.city_ar || talent.city_en || null : talent.city_en || talent.city_ar || null,
    imageUrl: signedPrimary || signedGallery[0] || null,
    gallery: signedGallery,
    bio: bio || null,
    skills: compactStrings(talent.skills).slice(0, 12),
    languages: compactStrings(talent.languages).slice(0, 8),
    baseCountryCode: talent.base_country_code ?? null,
    profileCompletion: Math.max(0, Math.min(100, Number(talent.profile_completion ?? 0))),
    availabilityStatus: talent.availability_status ?? null,
    verified: Boolean(talent.verified || talent.is_verified),
    approvalStatus: profile.approval_status ?? null,
    profileStatus: talent.status ?? profile.status ?? null,
    published: Boolean(talent.published),
  };

  return { ok: true as const, item };
}
