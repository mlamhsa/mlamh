import { BaseRepository } from "../base/BaseRepository";

export class OpportunityRepository extends BaseRepository {
  static async getAll({
    status,
    search,
  }: {
    status?: string;
    search?: string;
  }) {
    let query = this.client()
      .from("opportunities")
      .select(`
        id,
        title,
        slug,
        description,
        opportunity_type,
        city_ar,
        city_en,
        required_gender,
        min_age,
        max_age,
        budget,
        company_name,
        contact_name,
        contact_phone,
        contact_email,
        status,
        published,
        expires_at,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (status === "pending")
      query = query.eq("status", "pending_review");

    if (status === "published")
      query = query.eq("status", "published");

    if (status === "needs_changes")
      query = query.eq("status", "needs_changes");

    if (status === "rejected")
      query = query.eq("status", "rejected");

    if (status === "closed")
      query = query.eq("status", "closed");

    if (status === "archived")
      query = query.eq("status", "archived");

    if (search?.trim()) {
      query = query.or(
        `title.ilike.%${search}%,company_name.ilike.%${search}%,city_ar.ilike.%${search}%,city_en.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  static async getStatusSnapshot(id: number) {
    const { data, error } = await this.client()
      .from("opportunities")
      .select("id, title, publisher_id, status, published")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
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
    const { error } = await this.client()
      .from("opportunities")
      .update({
        status,
        published,
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  // 🔥 NEW: create opportunity (needed for action layer)
  static async create(data: {
    publisher_id: number;
    title: string;
    description: string;
    slug: string;
    opportunity_type: string;
    city_ar: string;
    city_en: string;
    required_gender: string | null;
    min_age: number | null;
    max_age: number | null;
    budget: string | null;
    company_name: string;
  }) {
    const { error } = await this.client()
      .from("opportunities")
      .insert({
        ...data,
        status: "pending_review",
        published: false,
      });

    if (error) {
      throw new Error(error.message);
    }
  }
}