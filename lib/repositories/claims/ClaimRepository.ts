import { BaseRepository } from "@/lib/repositories/base/BaseRepository";

export class ClaimRepository extends BaseRepository {
  static async getAll() {
    const { data, error } = await this.client()
      .from("talent_claim_requests")
      .select(
        `
        id,
        talent_id,
        user_id,
        status,
        created_at,
        talents (
          id,
          name_en,
          name_ar,
          image_url
        )
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }
}