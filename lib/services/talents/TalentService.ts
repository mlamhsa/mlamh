import { BaseService } from "@/lib/services/base/BaseService";

import {
  TalentRepository,
  type AdminTalentFilter,
} from "@/lib/repositories/talents/TalentRepository";

export class TalentService extends BaseService {
  static async getAdminTalents({
    page,
    pageSize,
    status,
    search,
    approvalStatus,
  }: {
    page: number;
    pageSize: number;
    status?: AdminTalentFilter;
    search?: string;
    approvalStatus?: string;
  }) {
    this.assert(
      page > 0,
      "Invalid page number",
    );

    this.assert(
      pageSize > 0,
      "Invalid page size",
    );

    return TalentRepository.getAdminTalents({
      page,
      pageSize,
      status,
      search,
      approvalStatus,
    });
  }

  static async getAdminTalentById(
    id: number,
  ) {
    this.assert(
      id > 0,
      "Invalid talent id",
    );

    return TalentRepository.getAdminTalentById(
      id,
    );
  }

  static async getAdminStats() {
    return TalentRepository.getAdminStats();
  }

  static async getTopViewed(
    limit = 5,
  ) {
    this.assert(
      limit > 0,
      "Invalid limit",
    );

    return TalentRepository.getTopViewed(
      limit,
    );
  }
}