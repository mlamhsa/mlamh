import { BaseService } from "@/lib/services/base/BaseService";
import { ClaimRepository } from "@/lib/repositories/claims/ClaimRepository";

export class ClaimService extends BaseService {
  static async getAll() {
    return ClaimRepository.getAll();
  }
}