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
  voice_actor: {
    slug: "voice_actor",
    icon: "🎙️",
    ar: "تعليق صوتي",
    en: "Voice Over",
    descriptionAr: "أداء صوتي، إعلانات ومحتوى",
    descriptionEn: "Voice performance, ads and content",
    showPhysicalDetails: false,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: false,
    showVideoIntro: true,
  },
  presenter: {
    slug: "presenter",
    icon: "🎤",
    ar: "مقدم / مقدمة",
    en: "Presenter / Host",
    descriptionAr: "تقديم، فعاليات ومحتوى مرئي",
    descriptionEn: "Presenting, events and video content",
    showPhysicalDetails: false,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: true,
    showVideoIntro: true,
  },
  content_creator: {
    slug: "content_creator",
    icon: "📱",
    ar: "صانع محتوى",
    en: "Content Creator",
    descriptionAr: "محتوى رقمي وحملات العلامات التجارية",
    descriptionEn: "Digital content and brand campaigns",
    showPhysicalDetails: false,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: true,
    showVideoIntro: true,
  },
  dancer: {
    slug: "dancer",
    icon: "✦",
    ar: "راقص / راقصة",
    en: "Dancer",
    descriptionAr: "أداء حركي وعروض وإنتاجات",
    descriptionEn: "Dance performance, shows and productions",
    showPhysicalDetails: true,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: true,
    showVideoIntro: true,
  },
  singer: {
    slug: "singer",
    icon: "♪",
    ar: "مغني / مغنية",
    en: "Singer",
    descriptionAr: "غناء، عروض وتسجيلات",
    descriptionEn: "Singing, performances and recordings",
    showPhysicalDetails: false,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: true,
    showVideoIntro: true,
  },
  musician: {
    slug: "musician",
    icon: "♫",
    ar: "موسيقي",
    en: "Musician",
    descriptionAr: "عزف، تسجيلات وعروض",
    descriptionEn: "Music, recordings and performances",
    showPhysicalDetails: false,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: true,
    showVideoIntro: true,
  },
  extra: {
    slug: "extra",
    icon: "◎",
    ar: "كومبارس",
    en: "Extra",
    descriptionAr: "أدوار مساندة وإنتاجات تصويرية",
    descriptionEn: "Background roles and productions",
    showPhysicalDetails: true,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: false,
    showVideoIntro: true,
  },
  influencer: {
    slug: "influencer",
    icon: "★",
    ar: "مؤثر / مؤثرة",
    en: "Influencer",
    descriptionAr: "حملات، محتوى وتعاونات تجارية",
    descriptionEn: "Campaigns, content and brand collaborations",
    showPhysicalDetails: false,
    showModelMeasurements: false,
    showActingAgeRange: false,
    showShowreel: true,
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
