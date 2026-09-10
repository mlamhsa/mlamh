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
    // Use only the repository's stable public API here. Visibility is a newer
    // dimension and some deployed database views may not expose it yet, so a
    // visibility-stat failure must never take the entire admin dashboard down.
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
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, visibility: "public" }).catch(
        (error) => {
          console.error("[TalentService.getAdminStats.publicVisibility]", error);
          return null;
        },
      ),
      TalentRepository.getAdminTalents({ page: 1, pageSize: 1, visibility: "private" }).catch(
        (error) => {
          console.error("[TalentService.getAdminStats.privateVisibility]", error);
          return null;
        },
      ),
    ]);

    return {
      total: totalResult.total,
      published: publishedResult.total,
      unpublished: unpublishedResult.total,
      active: activeResult.total,
      suspended: suspendedResult.total,
      publicProfiles: publicResult?.total ?? 0,
      privateProfiles: privateResult?.total ?? 0,
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
