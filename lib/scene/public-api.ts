import { SceneCMS } from "@/lib/cms/SceneCMS";
import type {
  SceneLocale,
  ScenePublicArticle,
  ScenePublicCategory,
} from "@/lib/types/scene";

export type SceneFeedResponse = {
  locale: SceneLocale;
  categories: ScenePublicCategory[];
  lead: ScenePublicArticle | null;
  latest: ScenePublicArticle[];
  reports: ScenePublicArticle[];
  stories: ScenePublicArticle[];
};

export type SceneCategoryResponse = {
  locale: SceneLocale;
  category: ScenePublicCategory;
  articles: ScenePublicArticle[];
};

export type SceneSearchResponse = {
  locale: SceneLocale;
  query: string;
  items: ScenePublicArticle[];
};

function isSceneStorageUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return (
    message.includes("scene_categories") ||
    message.includes("scene_articles") ||
    message.includes("schema cache")
  );
}

export function normalizeSceneSearch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/كاست(?:ينغ|ينج|نج)/g, "كاستنج")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesArticle(article: ScenePublicArticle, query: string) {
  const haystack = normalizeSceneSearch(
    [article.title, article.excerpt, article.content, article.tags.join(" ")].join(" "),
  );
  return haystack.includes(query);
}

export async function getSceneFeed(locale: SceneLocale): Promise<SceneFeedResponse> {
  try {
    const [categories, articles] = await Promise.all([
      SceneCMS.getPublicCategories(locale),
      SceneCMS.getPublicArticles({ locale, limit: 30 }),
    ]);

    const featured = articles.filter((article) => article.isFeatured);
    const lead = featured[0] ?? articles[0] ?? null;
    const latest = articles.filter((article) => article.id !== lead?.id).slice(0, 6);
    const reportCategory = categories.find((category) => category.slug === "reports");
    const storyCategory = categories.find((category) => category.slug === "stories");
    const reports = reportCategory
      ? articles.filter((article) => article.categoryId === reportCategory.id).slice(0, 3)
      : [];
    const stories = storyCategory
      ? articles.filter((article) => article.categoryId === storyCategory.id).slice(0, 3)
      : [];

    return { locale, categories, lead, latest, reports, stories };
  } catch (error) {
    if (isSceneStorageUnavailable(error)) {
      return { locale, categories: [], lead: null, latest: [], reports: [], stories: [] };
    }
    throw error;
  }
}

export async function getSceneArticle(locale: SceneLocale, slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;
  try {
    return await SceneCMS.getPublicArticleBySlug({ slug: normalizedSlug, locale });
  } catch (error) {
    if (isSceneStorageUnavailable(error)) return null;
    throw error;
  }
}

export async function getSceneCategory(
  locale: SceneLocale,
  slug: string,
): Promise<SceneCategoryResponse | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  try {
    const category = await SceneCMS.getPublicCategoryBySlug({
      slug: normalizedSlug,
      locale,
    });
    if (!category) return null;

    const articles = await SceneCMS.getPublicArticles({
      locale,
      categoryId: category.id,
      limit: 100,
    });
    return { locale, category, articles };
  } catch (error) {
    if (isSceneStorageUnavailable(error)) return null;
    throw error;
  }
}

export async function searchScene(
  locale: SceneLocale,
  rawQuery: string,
): Promise<SceneSearchResponse> {
  const query = rawQuery.trim().slice(0, 80);
  const normalizedQuery = normalizeSceneSearch(query);
  if (normalizedQuery.length < 2) return { locale, query, items: [] };

  try {
    const articles = await SceneCMS.getPublicArticles({ locale, limit: 100 });
    return {
      locale,
      query,
      items: articles.filter((article) => matchesArticle(article, normalizedQuery)),
    };
  } catch (error) {
    if (isSceneStorageUnavailable(error)) return { locale, query, items: [] };
    throw error;
  }
}