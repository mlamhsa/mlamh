export type SceneLocale = "ar" | "en";

export type SceneAudience = "all" | "talent" | "publisher";

export type SceneContentType =
  | "guide"
  | "help"
  | "industry"
  | "story"
  | "report"
  | "qa";

export type SceneArticleStatus = "draft" | "published" | "archived";

export type SceneCategory = {
  id: number;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  audience: SceneAudience;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SceneArticle = {
  id: number;
  slug: string;
  category_id: number | null;
  content_type: SceneContentType;
  audience: SceneAudience;
  status: SceneArticleStatus;
  title_ar: string;
  title_en: string | null;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  content_ar: string;
  content_en: string | null;
  cover_image_url: string | null;
  cover_image_alt_ar: string | null;
  cover_image_alt_en: string | null;
  author_name_ar: string | null;
  author_name_en: string | null;
  read_time_minutes: number | null;
  tags: string[];
  seo_title_ar: string | null;
  seo_title_en: string | null;
  seo_description_ar: string | null;
  seo_description_en: string | null;
  cta_label_ar: string | null;
  cta_label_en: string | null;
  cta_href: string | null;
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ScenePublicCategory = {
  id: number;
  slug: string;
  name: string;
  description: string;
  audience: SceneAudience;
  sortOrder: number;
};

export type ScenePublicArticle = {
  id: number;
  slug: string;
  categoryId: number | null;
  contentType: SceneContentType;
  audience: SceneAudience;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  authorName: string;
  readTimeMinutes: number | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  ctaLabel: string;
  ctaHref: string | null;
  isFeatured: boolean;
  publishedAt: string;
};
