"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

const allowedStatuses = new Set([
  "new",
  "qualified",
  "proposal",
  "awaiting_client",
  "active",
  "screening",
  "shortlist_ready",
  "client_review",
  "completed",
  "cancelled",
]);

const allowedPackages = new Set(["starter", "pro", "custom"]);

function toPositiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function revalidateCasting(projectId: number) {
  revalidatePath("/admin/casting");
  revalidatePath(`/admin/casting/${projectId}`);
}

export async function updateCastingProjectAction(formData: FormData) {
  const projectId = toPositiveInt(formData.get("project_id"));
  if (!projectId) return;

  const status = String(formData.get("status") ?? "").trim();
  const packageCode = String(formData.get("package_code") ?? "").trim();
  const quotedAmountRaw = String(formData.get("quoted_amount") ?? "").trim();
  const internalNotes = String(formData.get("internal_notes") ?? "").trim().slice(0, 10000);

  if (!allowedStatuses.has(status)) return;
  if (packageCode && !allowedPackages.has(packageCode)) return;

  const quotedAmount = quotedAmountRaw ? Number(quotedAmountRaw) : null;
  if (quotedAmount !== null && (!Number.isFinite(quotedAmount) || quotedAmount < 0)) return;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("casting_projects")
    .update({
      status,
      package_code: packageCode || null,
      quoted_amount: quotedAmount,
      internal_notes: internalNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    console.error("[updateCastingProjectAction]", error);
    return;
  }

  revalidateCasting(projectId);
}

export async function linkCastingOpportunityAction(formData: FormData) {
  const projectId = toPositiveInt(formData.get("project_id"));
  const opportunityId = toPositiveInt(formData.get("opportunity_id"));
  if (!projectId || !opportunityId) return;

  const adminClient = createAdminClient();

  const [{ data: project, error: projectError }, { data: opportunity, error: opportunityError }] = await Promise.all([
    adminClient.from("casting_projects").select("id, opportunity_id").eq("id", projectId).maybeSingle(),
    adminClient.from("opportunities").select("id").eq("id", opportunityId).maybeSingle(),
  ]);

  if (projectError || opportunityError || !project || !opportunity) {
    console.error("[linkCastingOpportunityAction] lookup failed", projectError ?? opportunityError);
    return;
  }

  const previousOpportunityId = project.opportunity_id ? Number(project.opportunity_id) : null;

  const { error: projectUpdateError } = await adminClient
    .from("casting_projects")
    .update({ opportunity_id: opportunityId, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (projectUpdateError) {
    console.error("[linkCastingOpportunityAction] project update", projectUpdateError);
    return;
  }

  const { error: flagError } = await adminClient
    .from("opportunities")
    .update({ managed_by_mlamh: true, updated_at: new Date().toISOString() })
    .eq("id", opportunityId);

  if (flagError) {
    console.error("[linkCastingOpportunityAction] managed flag", flagError);
  }

  if (previousOpportunityId && previousOpportunityId !== opportunityId) {
    const { count } = await adminClient
      .from("casting_projects")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", previousOpportunityId);

    if ((count ?? 0) === 0) {
      await adminClient
        .from("opportunities")
        .update({ managed_by_mlamh: false, updated_at: new Date().toISOString() })
        .eq("id", previousOpportunityId);
    }
  }

  revalidateCasting(projectId);
  revalidatePath(`/admin/opportunities/${opportunityId}`);
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
}

export async function addCastingShortlistAction(formData: FormData) {
  const projectId = toPositiveInt(formData.get("project_id"));
  const applicationId = toPositiveInt(formData.get("application_id"));
  if (!projectId || !applicationId) return;

  const adminClient = createAdminClient();
  const { data: project } = await adminClient
    .from("casting_projects")
    .select("opportunity_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project?.opportunity_id) return;

  const { data: application } = await adminClient
    .from("opportunity_applications")
    .select("id, opportunity_id")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || Number(application.opportunity_id) !== Number(project.opportunity_id)) return;

  const { error } = await adminClient.from("casting_shortlist").upsert(
    {
      casting_project_id: projectId,
      application_id: applicationId,
      status: "shortlisted",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "casting_project_id,application_id" },
  );

  if (error) {
    console.error("[addCastingShortlistAction]", error);
    return;
  }

  revalidateCasting(projectId);
}

export async function updateCastingShortlistStatusAction(formData: FormData) {
  const projectId = toPositiveInt(formData.get("project_id"));
  const shortlistId = toPositiveInt(formData.get("shortlist_id"));
  const status = String(formData.get("status") ?? "").trim();
  if (!projectId || !shortlistId) return;

  if (!["shortlisted", "presented", "selected", "declined", "withdrawn"].includes(status)) return;

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("casting_shortlist")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", shortlistId)
    .eq("casting_project_id", projectId);

  if (error) {
    console.error("[updateCastingShortlistStatusAction]", error);
    return;
  }

  revalidateCasting(projectId);
}
