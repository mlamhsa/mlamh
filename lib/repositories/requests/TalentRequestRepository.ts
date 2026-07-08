import { BaseRepository } from "@/lib/repositories/base/BaseRepository";

export type AdminTalentRequest = {
  id: number;
  talent_id: number;
  full_name: string;
  company: string | null;
  email: string;
  phone: string | null;
  project_type: string | null;
  project_details: string | null;
  budget: string | null;
  project_date: string | null;
  status: string;
  created_at: string;
  talents:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }[]
    | null;
};

export class TalentRequestRepository extends BaseRepository {
  static async getAll(): Promise<AdminTalentRequest[]> {
    const { data, error } = await this.client()
      .from("talent_requests")
      .select(
        `
        *,
        talents (
          id,
          name_en,
          name_ar,
          slug
        )
        `
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as unknown as AdminTalentRequest[];
  }
}