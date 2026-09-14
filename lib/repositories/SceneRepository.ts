import { BaseRepository } from "./base/BaseRepository";

import type { SceneArticleStatus, SceneAudience } from "@/lib/types/scene";

export class SceneRepository extends BaseRepository {
  static getPublicCategories() {
    return this.client()
      .from("scene_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
  }

  static getPublicCategoryBySlug(slug: string) {
    return this.client()
      .from("scene_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
  }

  static getCategoriesForAdmin() {
    return this.client()
      .from("scene_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
  }

  static getPublicArticles({
    audience,
    categoryId,
    featured,
    limit = 30,
  }: {
    audience?: SceneAudience;
    categoryId?: number;
    featured?: boolean;
    limit?: number;
  } = {}) {
    const now = new Date().toISOString();
    let query = this.client()
      .from("scene_articles")
      .select("*")
      .eq("status", "published")
      .lte("published_at", now)
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 100)));

    if (audience && audience !== "all") query = query.in("audience", ["all", audience]);
    if (typeof categoryId === "number") query = query.eq("category_id", categoryId);
    if (typeof featured === "boolean") query = query.eq("is_featured", featured);

    return query;
  }

  static getPublicArticleBySlug(slug: string) {
    return this.client()
      .from("scene_articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
  }

  static getArticlesForAdmin({ status, limit = 100 }: { status?: SceneArticleStatus; limit?: number } = {}) {
    let query = this.client()
      .from("scene_articles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(Math.max(1, Math.min(limit, 200)));

    if (status) query = query.eq("status", status);
    return query;
  }

  static getArticleForAdminById(id: number) {
    return this.client().from("scene_articles").select("*").eq("id", id).maybeSingle();
  }

  static createArticle(values: Record<string, unknown>) {
    return this.client().from("scene_articles").insert(values).select().single();
  }

  static updateArticle(id: number, values: Record<string, unknown>) {
    return this.client().from("scene_articles").update(values).eq("id", id).select().single();
  }

  static updateCategory(id: number, values: Record<string, unknown>) {
    return this.client().from("scene_categories").update(values).eq("id", id).select().single();
  }
}
