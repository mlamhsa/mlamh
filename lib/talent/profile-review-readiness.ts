import { TALENT_CATEGORIES, type TalentCategorySlug } from "@/lib/data/talent-categories";

export type TalentProfileReadinessData = {
  name_ar?: unknown;
  name_en?: unknown;
  phone?: unknown;
  image_url?: unknown;
  primary_role?: unknown;
  category_slug?: unknown;
  category_en?: unknown;
  category_ar?: unknown;
  base_country_code?: unknown;
  city_slug?: unknown;
  gender?: unknown;
  nationality?: unknown;
  nationality_slug?: unknown;
  date_of_birth?: unknown;
  profile_visibility?: unknown;
  data_accuracy_contact_consent?: unknown;
  bio_ar?: unknown;
  bio_en?: unknown;
  height_cm?: unknown;
  acting_age_min?: unknown;
  acting_age_max?: unknown;
  modeling_types?: unknown;
};

export type ProfileReadinessRequirement = {
  key: string;
  ar: string;
  en: string;
  completed: boolean;
};

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function hasValidVisibility(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return normalized === "public" || normalized === "private";
}

function normalizeTalentCategory(value: unknown): TalentCategorySlug | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();

  const direct = TALENT_CATEGORIES.find((category) => category.slug === normalized);
  if (direct) return direct.slug;

  // Legacy aliases kept for existing Actor/Model accounts and imported records.
  if (["acting", "ممثل", "تمثيل"].includes(normalized)) return "actor";
  if (["modeling", "modelling", "مودل", "عارض", "عارضة"].includes(normalized)) return "model";

  return null;
}

export function getCanonicalTalentRole(talent: TalentProfileReadinessData): TalentCategorySlug | null {
  return normalizeTalentCategory(talent.primary_role) ?? normalizeTalentCategory(talent.category_slug);
}

function getSharedRequirements(talent: TalentProfileReadinessData): ProfileReadinessRequirement[] {
  return [
    { key: "name", ar: "الاسم", en: "Name", completed: hasValue(talent.name_ar) || hasValue(talent.name_en) },
    { key: "phone", ar: "رقم الجوال", en: "Phone number", completed: hasValue(talent.phone) },
    { key: "profile_image", ar: "الصورة الشخصية", en: "Profile photo", completed: hasValue(talent.image_url) },
    { key: "primary_role", ar: "نوع الموهبة", en: "Talent type", completed: getCanonicalTalentRole(talent) !== null },
    { key: "country", ar: "بلد الإقامة", en: "Country of residence", completed: hasValue(talent.base_country_code) },
    { key: "city", ar: "المدينة", en: "City", completed: hasValue(talent.city_slug) },
    { key: "gender", ar: "الجنس", en: "Gender", completed: hasValue(talent.gender) },
    { key: "nationality", ar: "الجنسية", en: "Nationality", completed: hasValue(talent.nationality_slug) || hasValue(talent.nationality) },
    { key: "date_of_birth", ar: "تاريخ الميلاد", en: "Date of birth", completed: hasValue(talent.date_of_birth) },
    { key: "profile_visibility", ar: "طريقة ظهور الملف", en: "Profile visibility", completed: hasValidVisibility(talent.profile_visibility) },
    { key: "data_accuracy_contact_consent", ar: "الموافقة على دقة البيانات والتواصل", en: "Data accuracy and contact consent", completed: talent.data_accuracy_contact_consent === true },
    { key: "bio", ar: "النبذة التعريفية", en: "Profile bio", completed: hasValue(talent.bio_ar) || hasValue(talent.bio_en) },
    { key: "height", ar: "الطول", en: "Height", completed: hasValue(talent.height_cm) },
  ];
}

export function getTalentProfileReadiness(talent: TalentProfileReadinessData) {
  // Only true approval requirements belong here. Bio, languages, skills, experience,
  // measurements and extra portfolio material can improve profile strength/ranking but
  // do not block submission for review.
  const requiredKeys = new Set([
    "name",
    "phone",
    "profile_image",
    "primary_role",
    "country",
    "city",
    "gender",
    "date_of_birth",
    "nationality",
    "profile_visibility",
    "data_accuracy_contact_consent",
  ]);

  const requirements = getSharedRequirements(talent).filter((requirement) =>
    requiredKeys.has(requirement.key),
  );
  const missingRequirements = requirements.filter((requirement) => !requirement.completed);

  return {
    isReady: missingRequirements.length === 0,
    requirements,
    missingRequirements,
    completedRequirements: requirements.length - missingRequirements.length,
    totalRequirements: requirements.length,
  };
}

export function getTalentProfileReviewReadiness(talent: TalentProfileReadinessData) {
  const readiness = getTalentProfileReadiness(talent);
  return { ...readiness, canSubmitForReview: readiness.isReady };
}
