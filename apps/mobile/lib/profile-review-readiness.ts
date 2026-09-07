import type { MobileTalentProfile } from "@/lib/api";

export type MobileReviewRequirementKey =
  | "name"
  | "profile_image"
  | "primary_role"
  | "city"
  | "gender"
  | "nationality"
  | "date_of_birth";

export type MobileReviewRequirement = {
  key: MobileReviewRequirementKey;
  ar: string;
  en: string;
  completed: boolean;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function getMobileTalentReviewReadiness(profile: MobileTalentProfile) {
  const requirements: MobileReviewRequirement[] = [
    { key: "name", ar: "الاسم", en: "Name", completed: hasText(profile.displayName) },
    { key: "profile_image", ar: "الصورة الشخصية", en: "Profile photo", completed: hasText(profile.imageUrl) },
    { key: "primary_role", ar: "نوع الموهبة", en: "Talent type", completed: profile.primaryRole === "actor" || profile.primaryRole === "model" },
    { key: "city", ar: "المدينة", en: "City", completed: hasText(profile.citySlug) },
    { key: "gender", ar: "الجنس", en: "Gender", completed: hasText(profile.gender) },
    { key: "nationality", ar: "الجنسية", en: "Nationality", completed: hasText(profile.nationalitySlug) || hasText(profile.nationality) },
    { key: "date_of_birth", ar: "تاريخ الميلاد", en: "Date of birth", completed: hasText(profile.dateOfBirth) },
  ];
  const missingRequirements = requirements.filter((requirement) => !requirement.completed);
  return {
    isReady: missingRequirements.length === 0,
    requirements,
    missingRequirements,
    completedRequirements: requirements.length - missingRequirements.length,
    totalRequirements: requirements.length,
  };
}
