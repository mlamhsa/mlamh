import type { ScenePublicArticle } from "@/lib/types/scene";

const SITE_URL = "https://mlamh.net";
const GENERATED_COVER_VERSION = "4";

type SceneCoverArticle = Pick<
  ScenePublicArticle,
  "coverImageUrl" | "slug" | "title" | "audience" | "contentType"
>;

function getGeneratedSceneCoverUrl(article: SceneCoverArticle) {
  const params = new URLSearchParams({
    slug: article.slug,
    title: article.title,
    audience: article.audience,
    type: article.contentType,
    v: GENERATED_COVER_VERSION,
  });
  return `${SITE_URL}/api/scene/cover?${params.toString()}`;
}

export function getSceneCoverUrl(article: SceneCoverArticle) {
  return getGeneratedSceneCoverUrl(article);
}
