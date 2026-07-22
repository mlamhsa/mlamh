import {
  OpportunityRepository,
  type CreateOpportunityData,
  type OpportunityStatus,
} from "@/lib/repositories/opportunities/OpportunityRepository";

export class OpportunityService {
  static getAll(filters?: {
    status?: string;
    search?: string;
  }) {
    return OpportunityRepository.getAll(filters ?? {});
  }

  static getStatusSnapshot(id: number) {
    return OpportunityRepository.getStatusSnapshot(id);
  }

  static updateStatus({
    id,
    status,
    published,
  }: {
    id: number;
    status: OpportunityStatus;
    published: boolean;
  }) {
    return OpportunityRepository.updateStatus({
      id,
      status,
      published,
    });
  }

  static create(data: CreateOpportunityData) {
    return OpportunityRepository.create(data);
  }
}