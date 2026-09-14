import type { ScenePublicArticle } from "@/lib/types/scene";

const SITE_URL = "https://mlamh.net";

export function getSceneCoverUrl(article: Pick<ScenePublicArticle, "coverImageUrl" | "slug" | "audience" | "contentType">) {
  if (article.coverImageUrl) return article.coverImageUrl;

  if (article.slug === "how-to-start-modeling-saudi-arabia") {
    return `${SITE_URL}/images/home/hero-model.webp`;
  }

  if ([
    "how-to-start-acting-saudi-arabia",
    "casting-auditions-saudi-arabia",
    "what-is-showreel-actors",
    "first-audition-preparation",
    "what-is-self-tape",
  ].includes(article.slug)) {
    return `${SITE_URL}/images/home/hero-actor.webp`;
  }

  if (article.audience === "talent") return `${SITE_URL}/images/hero-talent.jpg`;
  if (article.audience === "publisher" || article.contentType === "industry") {
    return `${SITE_URL}/images/home/production-set.webp`;
  }

  return `${SITE_URL}/images/home/55.jpg`;
}
