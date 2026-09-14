import { SceneService } from "@/lib/services/SceneService";

import type {
  SceneArticle,
  SceneAudience,
  SceneCategory,
  SceneLocale,
  ScenePublicArticle,
  ScenePublicCategory,
} from "@/lib/types/scene";

export class SceneCMS {
  static async getPublicCategories(
    locale: SceneLocale,
  ): Promise<ScenePublicCategory[]> {
    const result = await SceneService.getPublicCategories();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return ((result.data ?? []) as SceneCategory[]).map((category) =>
      this.mapCategory(category, locale),
    );
  }

  static async getPublicArticles({
    locale,
    audience,
    categoryId,
    featured,
    limit,
  }: {
    locale: SceneLocale;
    audience?: SceneAudience;
    categoryId?: number;
    featured?: boolean;
    limit?: number;
  }): Promise<ScenePublicArticle[]> {
    const result = await SceneService.getPublicArticles({
      audience,
      categoryId,
      featured,
      limit,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return ((result.data ?? []) as SceneArticle[]).map((article) =>
      this.mapArticle(article, locale),
    );
  }

  static async getPublicArticleBySlug({
    slug,
    locale,
  }: {
    slug: string;
    locale: SceneLocale;
  }): Promise<ScenePublicArticle | null> {
    const result = await SceneService.getPublicArticleBySlug(slug);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) return null;

    return this.mapArticle(result.data as SceneArticle, locale);
  }

  private static mapCategory(
    category: SceneCategory,
    locale: SceneLocale,
  ): ScenePublicCategory {
    const isArabic = locale === "ar";

    return {
      id: category.id,
      slug: category.slug,
      name: isArabic ? category.name_ar : category.name_en,
      description:
        (isArabic ? category.description_ar : category.description_en) ?? "",
      audience: category.audience,
      sortOrder: category.sort_order,
    };
  }

  private static mapArticle(
    article: SceneArticle,
    locale: SceneLocale,
  ): ScenePublicArticle {
    const isArabic = locale === "ar";
    const title =
      (isArabic ? article.title_ar : article.title_en) || article.title_ar;
    const excerpt =
      (isArabic ? article.excerpt_ar : article.excerpt_en) ||
      article.excerpt_ar ||
      "";
    const content =
      (isArabic ? article.content_ar : article.content_en) || article.content_ar;
    const coverImageAlt =
      (isArabic ? article.cover_image_alt_ar : article.cover_image_alt_en) ||
      title;
    const authorName =
      (isArabic ? article.author_name_ar : article.author_name_en) || "MLAMH";
    const seoTitle =
      (isArabic ? article.seo_title_ar : article.seo_title_en) || title;
    const seoDescription =
      (isArabic
        ? article.seo_description_ar
        : article.seo_description_en) || excerpt;
    const ctaLabel =
      (isArabic ? article.cta_label_ar : article.cta_label_en) || "";

    if (!article.published_at) {
      throw new Error(`Published Scene article ${article.id} has no published_at.`);
    }

    return {
      id: article.id,
      slug: article.slug,
      categoryId: article.category_id,
      contentType: article.content_type,
      audience: article.audience,
      title,
      excerpt,
      content,
      coverImageUrl: article.cover_image_url,
      coverImageAlt,
      authorName,
      readTimeMinutes: article.read_time_minutes,
      tags: article.tags ?? [],
      seoTitle,
      seoDescription,
      ctaLabel,
      ctaHref: this.localizeHref(article.cta_href, locale),
      isFeatured: article.is_featured,
      publishedAt: article.published_at,
    };
  }

  private static localizeHref(href: string | null, locale: SceneLocale) {
    if (!href) return null;

    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#")
    ) {
      return href;
    }

    if (
      href === "/ar" ||
      href === "/en" ||
      href.startsWith("/ar/") ||
      href.startsWith("/en/")
    ) {
      return href;
    }

    const normalizedHref = href === "/" ? "" : href.startsWith("/") ? href : `/${href}`;
    return `/${locale}${normalizedHref}`;
  }
}
