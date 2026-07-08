import { BaseRepository } from "@/lib/repositories/base/BaseRepository";

export class PublisherRepository extends BaseRepository {
  static async getAll() {
    const adminClient = this.client();

    const { data, error } = await adminClient
      .from("publishers")
      .select(
        "id, profile_id, publisher_type, company_name, contact_name, city, website, instagram, verified, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  static async updateVerification(id: number, verified: boolean) {
    const adminClient = this.client();

    const { error } = await adminClient
      .from("publishers")
      .update({ verified })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }
}