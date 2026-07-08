import { BaseService } from "@/lib/services/base/BaseService";
import { TalentRequestRepository } from "@/lib/repositories/requests/TalentRequestRepository";

export class TalentRequestService extends BaseService {
  static async getAll() {
    return TalentRequestRepository.getAll();
  }
}