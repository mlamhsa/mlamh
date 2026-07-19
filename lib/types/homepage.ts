import type { Locale } from "@/lib/i18n";

export type HomepageHero = {
  id: number;

  eyebrow_ar: string | null;
  eyebrow_en: string | null;

  title_line_1_ar: string | null;
  title_line_1_en: string | null;

  title_line_2_ar: string | null;
  title_line_2_en: string | null;

  description_ar: string | null;
  description_en: string | null;

  primary_cta_label_ar: string | null;
  primary_cta_label_en: string | null;
  primary_cta_href: string;

  secondary_cta_label_ar: string | null;
  secondary_cta_label_en: string | null;
  secondary_cta_href: string;

  stat_1_value: string | null;
  stat_1_label_ar: string | null;
  stat_1_label_en: string | null;

  stat_2_value: string | null;
  stat_2_label_ar: string | null;
  stat_2_label_en: string | null;

  stat_3_value: string | null;
  stat_3_label_ar: string | null;
  stat_3_label_en: string | null;

  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

export type HomepageHeroCardIcon =
  | "users"
  | "building"
  | "sparkles";

export type HomepageHeroCard = {
  id: number;
  icon_key: HomepageHeroCardIcon;

  title_ar: string;
  title_en: string;

  description_ar: string;
  description_en: string;

  sort_order: number;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

export type PublicHomepageHeroCard = {
  id: number;
  iconKey: HomepageHeroCardIcon;
  title: string;
  description: string;
  sortOrder: number;
};

export type PublicHomepageHeroStat = {
  value: string;
  label: string;
};

export type PublicHomepageHero = {
  eyebrow: string;

  titleLine1: string;
  titleLine2: string;

  description: string;

  primaryCtaLabel: string;
  primaryCtaHref: string;

  secondaryCtaLabel: string;
  secondaryCtaHref: string;

  cards: PublicHomepageHeroCard[];

  stats: [
    PublicHomepageHeroStat,
    PublicHomepageHeroStat,
    PublicHomepageHeroStat,
  ];
};

export type HomepageCMSLocale = Locale;