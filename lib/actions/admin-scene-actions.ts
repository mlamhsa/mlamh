"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SceneService } from "@/lib/services/SceneService";
import type {
  SceneArticleStatus,
  SceneAudience,
  SceneContentType,
} from "@/lib/types/scene";

const CONTENT_TYPES = new Set<SceneContentType>([
  "guide",
  "help",
  "industry",
  "story",
  "report",
  "qa",
]);
const AUDIENCES = new Set<SceneAudience>(["all", "talent", "publisher"]);
const STATUSES = new Set<SceneArticleStatus>(["draft", "published", "archived"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullable(formData: FormData, key: string) {
  const normalized = value(formData, key);
  return normalized || null;
}

function sceneAdminUrl(
  locale: "ar" | "en",
  params: Record<string, string> = {},
) {
  const query = new URLSearchParams({ lang: locale, ...params }).toString();
  return `/admin/scene${query ? `?${query}` : ""}`;
}

function sceneEditUrl(
  id: number,
  locale: "ar" | "en",
  params: Record<string, string> = {},
) {
  const query = new URLSearchParams({ lang: locale, ...params }).toString();
  return `/admin/scene/${id}${query ? `?${query}` : ""}`;
}

function parsePublishedAt(raw: string, status: SceneArticleStatus) {
  if (status !== "published") return null;
  if (!raw) return new Date().toISOString();

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildArticleValues(formData: FormData) {
  const slug = value(formData, "slug").toLowerCase();
  const titleAr = value(formData, "title_ar");
  const contentAr = value(formData, "content_ar");
  const categoryId = Number(value(formData, "category_id"));
  const contentType = value(formData, "content_type") as SceneContentType;
  const audience = value(formData, "audience") as SceneAudience;
  const status = value(formData, "status") as SceneArticleStatus;
  const readTimeRaw = value(formData, "read_time_minutes");
  const readTime = readTimeRaw ? Number(readTimeRaw) : null;
  const publishedAt = parsePublishedAt(value(formData, "published_at"), status);

  if (!SLUG_PATTERN.test(slug)) return { error: "invalid_slug" as const };
  if (!titleAr || titleAr.length > 180) return { error: "invalid_title" as const };
  if (!contentAr || contentAr.length < 20) return { error: "invalid_content" as const };
  if (!Number.isInteger(categoryId) || categoryId <= 0) return { error: "invalid_category" as const };
  if (!CONTENT_TYPES.has(contentType)) return { error: "invalid_type" as const };
  if (!AUDIENCES.has(audience)) return { error: "invalid_audience" as const };
  if (!STATUSES.has(status)) return { error: "invalid_status" as const };
  if (readTime !== null && (!Number.isInteger(readTime) || readTime <= 0 || readTime > 180)) {
    return { error: "invalid_read_time" as const };
  }
  if (status === "published" && !publishedAt) return { error: "invalid_publish_date" as const };

  const tags = value(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);

  return {
    data: {
      slug,
      category_id: categoryId,
      content_type: contentType,
      audience,
      status,
      title_ar: titleAr,
      title_en: nullable(formData, "title_en"),
      excerpt_ar: nullable(formData, "excerpt_ar"),
      excerpt_en: nullable(formData, "excerpt_en"),
      content_ar: contentAr,
      content_en: nullable(formData, "content_en"),
      cover_image_url: nullable(formData, "cover_image_url"),
      cover_image_alt_ar: nullable(formData, "cover_image_alt_ar"),
      cover_image_alt_en: nullable(formData, "cover_image_alt_en"),
      author_name_ar: nullable(formData, "author_name_ar") || "ملامح",
      author_name_en: nullable(formData, "author_name_en") || "MLAMH",
      read_time_minutes: readTime,
      tags,
      seo_title_ar: nullable(formData, "seo_title_ar"),
      seo_title_en: nullable(formData, "seo_title_en"),
      seo_description_ar: nullable(formData, "seo_description_ar"),
      seo_description_en: nullable(formData, "seo_description_en"),
      cta_label_ar: nullable(formData, "cta_label_ar"),
      cta_label_en: nullable(formData, "cta_label_en"),
      cta_href: nullable(formData, "cta_href"),
      is_featured: formData.get("is_featured") === "on",
      published_at: publishedAt,
    },
  };
}

function revalidateScene(slug?: string) {
  revalidatePath("/admin/scene");
  revalidatePath("/ar/scene");
  revalidatePath("/en/scene");

  if (slug) {
    revalidatePath(`/ar/scene/${slug}`);
    revalidatePath(`/en/scene/${slug}`);
  }
}

export async function createSceneArticleAction(formData: FormData) {
  await requireAdminAccess();
  const locale: "ar" | "en" = formData.get("locale") === "en" ? "en" : "ar";
  const parsed = buildArticleValues(formData);

  if ("error" in parsed) {
    redirect(sceneAdminUrl(locale, { error: parsed.error }));
  }

  const result = await SceneService.createArticle(parsed.data);

  if (result.error || !result.data) {
    console.error("[createSceneArticleAction]", result.error);
    const code = result.error?.code === "23505" ? "duplicate_slug" : "create_failed";
    redirect(sceneAdminUrl(locale, { error: code }));
  }

  revalidateScene(parsed.data.slug);
  redirect(sceneEditUrl(Number(result.data.id), locale, { saved: "1" }));
}

export async function updateSceneArticleAction(formData: FormData) {
  await requireAdminAccess();
  const locale: "ar" | "en" = formData.get("locale") === "en" ? "en" : "ar";
  const id = Number(formData.get("article_id"));

  if (!Number.isInteger(id) || id <= 0) {
    redirect(sceneAdminUrl(locale, { error: "invalid_article" }));
  }

  const existing = await SceneService.getArticleForAdminById(id);
  if (existing.error || !existing.data) {
    console.error("[updateSceneArticleAction existing]", existing.error);
    redirect(sceneAdminUrl(locale, { error: "article_not_found" }));
  }

  const parsed = buildArticleValues(formData);
  if ("error" in parsed) {
    redirect(sceneEditUrl(id, locale, { error: parsed.error }));
  }

  const result = await SceneService.updateArticle({ id, data: parsed.data });
  if (result.error) {
    console.error("[updateSceneArticleAction]", result.error);
    const code = result.error.code === "23505" ? "duplicate_slug" : "update_failed";
    redirect(sceneEditUrl(id, locale, { error: code }));
  }

  revalidateScene(String(existing.data.slug));
  revalidateScene(parsed.data.slug);
  redirect(sceneEditUrl(id, locale, { saved: "1" }));
}
