import { BaseService } from "@/lib/services/base/BaseService";
import { TalentRepository } from "@/lib/repositories/talents/TalentRepository";

export class TalentService extends BaseService {
  static async getAdminTalents({
    page,
    pageSize,
    status,
    search,
  }: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
  }) {
    this.assert(page > 0, "Invalid page number");
    this.assert(pageSize > 0, "Invalid page size");

    return TalentRepository.getAdminTalents({
      page,
      pageSize,
      status,
      search,
    });
  }

  static async getAdminStats() {
    return TalentRepository.getAdminStats();
  }

  static async getTopViewed(limit = 5) {
    return TalentRepository.getTopViewed(limit);
  }
}