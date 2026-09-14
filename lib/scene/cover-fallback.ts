import type { ScenePublicArticle } from "@/lib/types/scene";

const SITE_URL = "https://mlamh.net";

const REUSED_SITE_ASSETS = [
  "/images/home/hero-model.webp",
  "/images/home/hero-actor.webp",
  "/images/home/55.jpg",
  "/images/hero-talent.jpg",
  "/images/home/production-set.webp",
];

type SceneCoverArticle = Pick<
  ScenePublicArticle,
  "coverImageUrl" | "slug" | "title" | "audience" | "contentType"
>;

function isReusedSiteAsset(url: string | null) {
  if (!url) return false;
  return REUSED_SITE_ASSETS.some((path) => url === path || url === `${SITE_URL}${path}`);
}

function getGeneratedSceneCoverUrl(article: SceneCoverArticle) {
  const params = new URLSearchParams({
    slug: article.slug,
    title: article.title,
    audience: article.audience,
    type: article.contentType,
  });
  return `${SITE_URL}/api/scene/cover?${params.toString()}`;
}

export function getSceneCoverUrl(article: SceneCoverArticle) {
  if (article.coverImageUrl && !isReusedSiteAsset(article.coverImageUrl)) {
    return article.coverImageUrl;
  }

  return getGeneratedSceneCoverUrl(article);
}
