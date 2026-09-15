import { mobileApiRequest } from "@/src/api/client";
import type { AppLocale } from "@/src/i18n/locale";
import type { SceneArticle, SceneCategoryResponse, SceneFeedResponse, SceneSearchResponse } from "@/src/domains/scene/types";

export function getSceneFeed(locale: AppLocale) {
  return mobileApiRequest<SceneFeedResponse>(`/api/scene/feed?locale=${locale}`, { authenticated: false });
}

export function getSceneCategory(slug: string, locale: AppLocale) {
  return mobileApiRequest<SceneCategoryResponse>(`/api/scene/category/${encodeURIComponent(slug)}?locale=${locale}`, { authenticated: false });
}

export function getSceneArticle(slug: string, locale: AppLocale) {
  return mobileApiRequest<SceneArticle>(`/api/scene/article/${encodeURIComponent(slug)}?locale=${locale}`, { authenticated: false });
}

export function searchScene(query: string, locale: AppLocale) {
  return mobileApiRequest<SceneSearchResponse>(`/api/scene/search?locale=${locale}&q=${encodeURIComponent(query)}`, { authenticated: false });
}
