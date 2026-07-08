import { OpportunityRepository } from "@/lib/repositories/opportunities/OpportunityRepository";

export class OpportunityService {
  static getAll(filters?: {
    status?: string;
    search?: string;
  }) {
    return OpportunityRepository.getAll(filters ?? {});
  }

  static async getStatusSnapshot(id: number) {
    return OpportunityRepository.getStatusSnapshot(id);
  }

  static async updateStatus({
    id,
    status,
    published,
  }: {
    id: number;
    status: string;
    published: boolean;
  }) {
    return OpportunityRepository.updateStatus({
      id,
      status,
      published,
    });
  }

  // ✅ ADD THIS
  static async create(data: any) {
    return OpportunityRepository.create(data);
  }
}