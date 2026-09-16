export type SceneAudience = "all" | "talent" | "publisher";
export type SceneContentType = "guide" | "help" | "industry" | "story" | "report" | "qa";

export type SceneCategory = {
  id: number;
  slug: string;
  name: string;
  description: string;
  audience: SceneAudience;
  sortOrder: number;
};

export type SceneArticle = {
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

export type SceneFeedResponse = {
  locale: "ar" | "en";
  categories: SceneCategory[];
  lead: SceneArticle | null;
  latest: SceneArticle[];
  reports: SceneArticle[];
  stories: SceneArticle[];
};

export type SceneCategoryResponse = {
  locale: "ar" | "en";
  category: SceneCategory;
  articles: SceneArticle[];
};

export type SceneSearchResponse = {
  locale: "ar" | "en";
  query: string;
  items: SceneArticle[];
};
