import { BaseRepository } from "@/lib/repositories/base/BaseRepository";

export class ApplicationRepository extends BaseRepository {
  static async getAdminApplications({
    status,
    search,
  }: {
    status?: string;
    search?: string;
  }) {
    let query = this.client()
      .from("opportunity_applications")
      .select(`
        *,
        opportunities(*),
        talents(*)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (search?.trim()) {
      query = query.or(
        `talents.name_ar.ilike.%${search}%,talents.name_en.ilike.%${search}%,opportunities.title.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}