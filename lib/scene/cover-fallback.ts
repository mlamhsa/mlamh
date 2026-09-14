import type { ScenePublicArticle } from "@/lib/types/scene";

const SITE_URL = "https://mlamh.net";

export function getSceneCoverUrl(article: Pick<ScenePublicArticle, "coverImageUrl" | "slug" | "audience" | "contentType">) {
  if (article.coverImageUrl) return article.coverImageUrl;

  if ([
    "how-to-start-modeling-saudi-arabia",
    "casting-profile-photo-guide",
    "talent-portfolio-gallery-guide",
    "actor-vs-model-casting",
  ].includes(article.slug)) {
    return `${SITE_URL}/images/home/hero-model.webp`;
  }

  if ([
    "how-to-start-acting-saudi-arabia",
    "casting-auditions-saudi-arabia",
    "what-is-showreel-actors",
    "first-audition-preparation",
    "casting-call-vs-audition",
  ].includes(article.slug)) {
    return `${SITE_URL}/images/home/hero-actor.webp`;
  }

  if ([
    "what-is-self-tape",
    "quick-requests-on-mlamh",
    "mlamh-chat-after-preliminary-selection",
  ].includes(article.slug)) {
    return `${SITE_URL}/images/home/55.jpg`;
  }

  if (article.audience === "talent") return `${SITE_URL}/images/hero-talent.jpg`;
  if (article.audience === "publisher" || article.contentType === "industry") {
    return `${SITE_URL}/images/home/production-set.webp`;
  }

  return `${SITE_URL}/images/home/55.jpg`;
}
