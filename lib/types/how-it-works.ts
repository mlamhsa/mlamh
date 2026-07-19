export type HomepageHowItWorksStepIcon =
  | "user"
  | "search"
  | "briefcase"
  | "check";

export type HomepageHowItWorksStep = {
  id: number;

  icon_key: HomepageHowItWorksStepIcon;

  title_ar: string;
  title_en: string;

  description_ar: string;
  description_en: string;

  sort_order: number;

  is_active: boolean;

  created_at: string;
  updated_at: string;
};

export type PublicHomepageHowItWorksStep = {
  id: number;

  iconKey: HomepageHowItWorksStepIcon;

  title: string;

  description: string;
};

export type HomepageHowItWorksLocale =
  | "ar"
  | "en";

export type UpdateHomepageHowItWorksInput = {
  icon_key?: HomepageHowItWorksStepIcon;

  title_ar?: string;
  title_en?: string;

  description_ar?: string;
  description_en?: string;

  sort_order?: number;

  is_active?: boolean;
};