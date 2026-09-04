export type TalentProfileReadinessData = {
  name_ar?: unknown;
  name_en?: unknown;
  phone?: unknown;
  image_url?: unknown;
  primary_role?: unknown;
  category_slug?: unknown;
  category_en?: unknown;
  category_ar?: unknown;
  city_slug?: unknown;
  gender?: unknown;
  nationality?: unknown;
  nationality_slug?: unknown;
  date_of_birth?: unknown;
  bio_ar?: unknown;
  bio_en?: unknown;
  height_cm?: unknown;
  acting_age_min?: unknown;
  acting_age_max?: unknown;
  modeling_types?: unknown;
};

export type ProfileReadinessRequirement = { key: string; ar: string; en: string; completed: boolean };

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function normalizeRoleValue(value: unknown): "actor" | "model" | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["actor", "acting", "ممثل", "تمثيل"].includes(normalized)) return "actor";
  if (["model", "modeling", "modelling", "مودل", "عارض", "عارضة"].includes(normalized)) return "model";
  return null;
}

export function getCanonicalTalentRole(talent: TalentProfileReadinessData): "actor" | "model" | null {
  return (
    normalizeRoleValue(talent.primary_role) ??
    normalizeRoleValue(talent.category_slug) ??
    normalizeRoleValue(talent.category_en) ??
    normalizeRoleValue(talent.category_ar)
  );
}

function getSharedRequirements(talent: TalentProfileReadinessData): ProfileReadinessRequirement[] {
  return [
    { key: "name", ar: "الاسم", en: "Name", completed: hasValue(talent.name_ar) || hasValue(talent.name_en) },
    { key: "phone", ar: "رقم الجوال", en: "Phone number", completed: hasValue(talent.phone) },
    { key: "profile_image", ar: "الصورة الشخصية", en: "Profile photo", completed: hasValue(talent.image_url) },
    { key: "primary_role", ar: "نوع الموهبة", en: "Talent type", completed: getCanonicalTalentRole(talent) !== null },
    { key: "city", ar: "المدينة", en: "City", completed: hasValue(talent.city_slug) },
    { key: "gender", ar: "الجنس", en: "Gender", completed: hasValue(talent.gender) },
    { key: "nationality", ar: "الجنسية", en: "Nationality", completed: hasValue(talent.nationality_slug) || hasValue(talent.nationality) },
    { key: "date_of_birth", ar: "تاريخ الميلاد", en: "Date of birth", completed: hasValue(talent.date_of_birth) },
    { key: "bio", ar: "النبذة التعريفية", en: "Profile bio", completed: hasValue(talent.bio_ar) || hasValue(talent.bio_en) },
    { key: "height", ar: "الطول", en: "Height", completed: hasValue(talent.height_cm) },
  ];
}

export function getTalentProfileReadiness(talent: TalentProfileReadinessData) {
  const requiredKeys = new Set(["name", "profile_image", "primary_role", "city", "gender", "date_of_birth", "nationality"]);
  const requirements = getSharedRequirements(talent).filter((requirement) => requiredKeys.has(requirement.key));
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
