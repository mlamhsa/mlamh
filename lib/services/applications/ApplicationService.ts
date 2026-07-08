import { ApplicationRepository } from "@/lib/repositories/applications/ApplicationRepository";

export class ApplicationService {
  static getAdminApplications(filters?: {
    status?: string;
    search?: string;
  }) {
    return ApplicationRepository.getAdminApplications(filters ?? {});
  }
}