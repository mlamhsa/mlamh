import type { TalentCategorySlug } from "@/lib/data/talent-categories";

export type TalentProfileRoleConfig = {
  slug: TalentCategorySlug;
  icon: string;
  ar: string;
  en: string;
  descriptionAr: string;
  descriptionEn: string;
  showPhysicalDetails: boolean;
  showModelMeasurements: boolean;
  showActingAgeRange: boolean;
  showShowreel: boolean;
  showVideoIntro: boolean;
};

export const TALENT_PROFILE_ROLE_CONFIGS: Record<
  TalentCategorySlug,
  TalentProfileRoleConfig
> = {
  actor: {
    slug: "actor",
    icon: "🎭",
    ar: "ممثل / ممثلة",
    en: "Actor",
    descriptionAr: "تمثيل، إعلانات وأدوار",
    descriptionEn: "Acting, commercials and roles",
    showPhysicalDetails: true,
    showModelMeasurements: false,
    showActingAgeRange: true,
    showShowreel: true,
    showVideoIntro: true,
  },
  model: {
    slug: "model",
    icon: "◉",
    ar: "مودل",
    en: "Model",
    descriptionAr: "أزياء، إعلانات وتصوير",
    descriptionEn: "Fashion, commercial and shoots",
    showPhysicalDetails: true,
    showModelMeasurements: true,
    showActingAgeRange: false,
    showShowreel: false,
    showVideoIntro: true,
  },
};

export function getTalentProfileRoleConfig(
  role: string | null | undefined,
): TalentProfileRoleConfig | null {
  if (!role) return null;
  return TALENT_PROFILE_ROLE_CONFIGS[
    role as TalentCategorySlug
  ] ?? null;
}
