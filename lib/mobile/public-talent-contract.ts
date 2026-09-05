import type { Talent } from "@/lib/types/talent";

export type MobilePublicTalent = {
  id: number;
  slug: string;
  name: string;
  role: "actor" | "model" | null;
  city: string | null;
  countryCode: string | null;
  imageUrl: string | null;
  featured: boolean;
  verified: boolean;
  gender: string | null;
  nationality: string | null;
  age: number | null;
  heightCm: number | null;
  bio: string | null;
  languages: string[];
  dialects: string[];
  skills: string[];
  experienceYears: number | null;
  availabilityStatus: string | null;
  readyToTravel: boolean | null;
};

function ageFromDob(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 ? age : null;
}

function roleFromTalent(talent: Talent): MobilePublicTalent["role"] {
  const value = String(talent.category_slug ?? "").toLowerCase();
  if (value === "actor") return "actor";
  if (value === "model") return "model";
  return null;
}

export function toMobilePublicTalent(talent: Talent, locale: "ar" | "en"): MobilePublicTalent {
  const name = locale === "ar"
    ? talent.display_name_ar || talent.name_ar || talent.display_name_en || talent.name_en
    : talent.display_name_en || talent.name_en || talent.display_name_ar || talent.name_ar;
  const city = locale === "ar" ? talent.city_ar || talent.city_en : talent.city_en || talent.city_ar;
  const bio = locale === "ar" ? talent.bio_ar || talent.bio_en : talent.bio_en || talent.bio_ar;

  return {
    id: Number(talent.id),
    slug: String(talent.slug ?? ""),
    name: String(name ?? "").trim() || "MLAMH Talent",
    role: roleFromTalent(talent),
    city: city ?? null,
    countryCode: talent.base_country_code ?? null,
    imageUrl: talent.image_url || null,
    featured: Boolean(talent.featured),
    verified: Boolean(talent.verified || talent.is_verified),
    gender: talent.gender ?? null,
    nationality: talent.nationality ?? talent.nationality_slug ?? null,
    age: typeof talent.age === "number" ? talent.age : ageFromDob(talent.date_of_birth),
    heightCm: typeof talent.height_cm === "number" ? talent.height_cm : null,
    bio: bio ?? null,
    languages: Array.isArray(talent.languages) ? talent.languages.filter(Boolean) : [],
    dialects: Array.isArray(talent.dialects) ? talent.dialects.filter(Boolean) : [],
    skills: Array.isArray(talent.skills) ? talent.skills.filter(Boolean) : [],
    experienceYears: typeof talent.experience_years === "number" ? talent.experience_years : null,
    availabilityStatus: talent.availability_status ?? null,
    readyToTravel: typeof talent.ready_to_travel === "boolean" ? talent.ready_to_travel : null,
  };
}
