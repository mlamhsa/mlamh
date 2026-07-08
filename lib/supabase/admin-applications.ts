import { createAdminClient } from "@/lib/supabase/admin";

export type AdminApplicationStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "rejected";

export type AdminApplicationFilters = {
  status?: string;
  search?: string;
};

export async function getAdminApplications(filters: AdminApplicationFilters = {}) {
  const adminClient = createAdminClient();

  let query = adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunities (
        id,
        title,
        slug,
        city_ar,
        opportunity_type
      ),
      talents (
        id,
        name_en,
        name_ar,
        slug,
        image_url,
        city_ar,
        gender
      )
      `
    )
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`[getAdminApplications] ${error.message}`);
  }

  const applications = data ?? [];

  if (!filters.search) {
    return applications;
  }

  const search = filters.search.toLowerCase();

  return applications.filter((item: any) => {
    const opportunity = Array.isArray(item.opportunities)
      ? item.opportunities[0]
      : item.opportunities;

    const talent = Array.isArray(item.talents)
      ? item.talents[0]
      : item.talents;

    return (
      String(opportunity?.title ?? "").toLowerCase().includes(search) ||
      String(talent?.name_ar ?? "").toLowerCase().includes(search) ||
      String(talent?.name_en ?? "").toLowerCase().includes(search) ||
      String(talent?.city_ar ?? "").toLowerCase().includes(search)
    );
  });
}

export async function getAdminApplicationStats() {
  const applications = await getAdminApplications();

  return {
    total: applications.length,
    pending: applications.filter((item) => (item.status || "pending") === "pending").length,
    shortlisted: applications.filter((item) => item.status === "shortlisted").length,
    accepted: applications.filter((item) => item.status === "accepted").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
  };
}

export async function getAdminApplicationById(id: number) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunities (
        id,
        title,
        slug,
        description,
        company_name,
        city_ar,
        city_en,
        opportunity_type,
        budget,
        status
      ),
      talents (
        id,
        name_en,
        name_ar,
        slug,
        image_url,
        city_ar,
        gender,
        instagram,
        whatsapp
      )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`[getAdminApplicationById] ${error.message}`);
  }

  return data;
}

export async function updateAdminApplicationStatus({
  id,
  status,
}: {
  id: number;
  status: AdminApplicationStatus;
}) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("opportunity_applications")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(`[updateAdminApplicationStatus] ${error.message}`);
  }
}