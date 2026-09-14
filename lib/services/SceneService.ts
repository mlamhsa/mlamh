import { SceneRepository } from "@/lib/repositories/SceneRepository";

import type { SceneArticleStatus, SceneAudience } from "@/lib/types/scene";

export class SceneService {
  static getPublicCategories() {
    return SceneRepository.getPublicCategories();
  }

  static getCategoriesForAdmin() {
    return SceneRepository.getCategoriesForAdmin();
  }

  static getPublicArticles(options?: {
    audience?: SceneAudience;
    categoryId?: number;
    featured?: boolean;
    limit?: number;
  }) {
    return SceneRepository.getPublicArticles(options);
  }

  static getPublicArticleBySlug(slug: string) {
    return SceneRepository.getPublicArticleBySlug(slug);
  }

  static getArticlesForAdmin(options?: {
    status?: SceneArticleStatus;
    limit?: number;
  }) {
    return SceneRepository.getArticlesForAdmin(options);
  }

  static createArticle(data: Record<string, unknown>) {
    return SceneRepository.createArticle(data);
  }

  static updateArticle({
    id,
    data,
  }: {
    id: number;
    data: Record<string, unknown>;
  }) {
    return SceneRepository.updateArticle(id, data);
  }

  static updateCategory({
    id,
    data,
  }: {
    id: number;
    data: Record<string, unknown>;
  }) {
    return SceneRepository.updateCategory(id, data);
  }
}
