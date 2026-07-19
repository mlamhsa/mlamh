export type HomepageValuePropIcon =
  | "shield"
  | "globe"
  | "zap"
  | "building"
  | "clipboard"
  | "badge"
  | "sparkles";

export type HomepageValueProp = {
  id: number;

  icon_key: HomepageValuePropIcon;

  title_ar: string;
  title_en: string;

  description_ar: string;
  description_en: string;

  sort_order: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;
};

export type PublicHomepageValueProp = {
  id: number;
  iconKey: HomepageValuePropIcon;
  title: string;
  description: string;
};

export type HomepageValuePropsLocale =
  | "ar"
  | "en";

export type UpdateHomepageValuePropInput = {
  icon_key?: HomepageValuePropIcon;

  title_ar?: string;
  title_en?: string;

  description_ar?: string;
  description_en?: string;

  sort_order?: number;
  is_active?: boolean;
};