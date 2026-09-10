import { BaseService } from "@/lib/services/base/BaseService";

import {
  TalentRepository,
  type AdminTalentFilter,
  type AdminTalentOperationalFilter,
  type AdminTalentVisibilityFilter,
} from "@/lib/repositories/talents/TalentRepository";

export class TalentService extends BaseService {
  static async getAdminTalents({
    page,
    pageSize,
    status,
    search,
    approvalStatus,
    operationalFilter,
    visibility,
  }: {
    page: number;
    pageSize: number;
    status?: AdminTalentFilter;
    search?: string;
    approvalStatus?: string;
    operationalFilter?: AdminTalentOperationalFilter;
    visibility?: AdminTalentVisibilityFilter;
  }) {
    this.assert(page > 0, "Invalid page number");
    this.assert(pageSize > 0, "Invalid page size");

    return TalentRepository.getAdminTalents({
      page,
      pageSize,
      status,
      search,
      approvalStatus,
      operationalFilter,
      visibility,
    });
  }

  static async getAdminTalentById(id: number) {
    this.assert(id > 0, "Invalid talent id");

    return TalentRepository.getAdminTalentById(id);
  }

  static async getAdminStats() {
    // Keep the admin dashboard on the repository's stable public API.
    // This deliberately avoids relying on private static helpers at runtime,
    // which can be lost by server bundling/tree-shaking even though TypeScript
    // resolves the call correctly during build.
    const [
      totalResult,
      publishedResult,
      unpublishedResult,
      activeResult,
      suspendedResult,
      publicResult,
      privateResult,
    ] = await Promise.all([
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1 }),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, status: "published" }),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, status: "unpublished" }),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, status: "active" }),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, status: "suspended" }),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, visibility: "public" }),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, visibility: "private" }),
    ]);

    return {
      total: totalResult.total,
      published: publishedResult.total,
      unpublished: unpublishedResult.total,
      active: activeResult.total,
      suspended: suspendedResult.total,
      publicProfiles: publicResult.total,
      privateProfiles: privateResult.total,
    };
  }

  static async getAdminOperationalStats() {
    return TalentRepository.getAdminOperationalStats();
  }

  static async getTopViewed(limit = 5) {
    this.assert(limit > 0, "Invalid limit");

    return TalentRepository.getTopViewed(limit);
  }
}
