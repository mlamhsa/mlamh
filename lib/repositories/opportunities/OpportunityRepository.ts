import { BaseRepository } from "../base/BaseRepository";

export const opportunityStatuses = [
  "draft",
  "pending_review",
  "needs_changes",
  "rejected",
  "published",
  "closed",
  "archived",
] as const;

export type OpportunityStatus =
  (typeof opportunityStatuses)[number];

export type CreateOpportunityData = {
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
};

type OpportunityFilters = {
  status?: string;
  search?: string;
};

type UpdateOpportunityStatusPayload = {
  id: number;
  status: OpportunityStatus;
  published: boolean;
};

function normalizeSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export class OpportunityRepository extends BaseRepository {
  static async getAll({
    status,
    search,
  }: OpportunityFilters) {
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

    const statusMap: Record<string, OpportunityStatus> = {
      pending: "pending_review",
      pending_review: "pending_review",
      published: "published",
      needs_changes: "needs_changes",
      rejected: "rejected",
      closed: "closed",
      archived: "archived",
      draft: "draft",
    };

    const normalizedStatus = status
      ? statusMap[status]
      : undefined;

    if (normalizedStatus) {
      query = query.eq("status", normalizedStatus);
    }

    if (search?.trim()) {
      const normalizedSearch = normalizeSearchTerm(search);

      if (normalizedSearch) {
        query = query.or(
          [
            `title.ilike.%${normalizedSearch}%`,
            `company_name.ilike.%${normalizedSearch}%`,
            `city_ar.ilike.%${normalizedSearch}%`,
            `city_en.ilike.%${normalizedSearch}%`,
          ].join(","),
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to retrieve opportunities:", error);
      throw new Error("Unable to retrieve opportunities.");
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
      console.error(
        "Failed to retrieve opportunity status:",
        error,
      );
      throw new Error(
        "Unable to retrieve the opportunity status.",
      );
    }

    return data;
  }

  static async updateStatus({
    id,
    status,
    published,
  }: UpdateOpportunityStatusPayload) {
    const { data, error } = await this.client()
      .from("opportunities")
      .update({
        status,
        published,
      })
      .eq("id", id)
      .select("id, status, published")
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to update opportunity status:",
        error,
      );
      throw new Error(
        "Unable to update the opportunity status.",
      );
    }

    if (!data) {
      throw new Error("Opportunity not found.");
    }

    return data;
  }

  static async create(data: CreateOpportunityData) {
    const { data: opportunity, error } = await this.client()
      .from("opportunities")
      .insert({
        ...data,
        status: "pending_review",
        published: false,
      })
      .select("id, status, published")
      .single();

    if (error) {
      console.error("Failed to create opportunity:", error);

      if (error.code === "23505") {
        throw new Error(
          "An opportunity with the same identifier already exists.",
        );
      }

      throw new Error("Unable to create the opportunity.");
    }

    return opportunity;
  }
}