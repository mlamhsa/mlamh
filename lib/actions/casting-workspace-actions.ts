"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createOpportunityAction } from "@/lib/actions/create-opportunity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PublisherContext = {
  userId: string;
  publisherId: number;
  companyName: string | null;
  contactName: string | null;
};

async function requirePublisher(): Promise<PublisherContext> {
  const auth = await createServerSupabaseClient();
  const admin = createAdminClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, account_type, approval_status, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== "publisher") throw new Error("Publisher access required.");
  if (profile.approval_status !== "approved") throw new Error("Publisher account is not approved.");
  if (["suspended", "blocked", "banned", "disabled"].includes(String(profile.status))) throw new Error("Publisher account is not active.");

  const { data: publisher, error: publisherError } = await admin
    .from("publishers")
    .select("id, company_name, contact_name, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) throw new Error("Publisher not found.");
  if (["suspended", "blocked", "banned", "disabled"].includes(String(publisher.status))) throw new Error("Publisher account is not active.");

  return {
    userId: user.id,
    publisherId: Number(publisher.id),
    companyName: publisher.company_name ?? null,
    contactName: publisher.contact_name ?? null,
  };
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInt(value: string, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function roleRequirements(formData: FormData) {
  return {
    gender: text(formData, "gender") || null,
    age_min: optionalNumber(text(formData, "ageMin")),
    age_max: optionalNumber(text(formData, "ageMax")),
    city: text(formData, "city") || null,
    traits: text(formData, "traits") || null,
    notes: text(formData, "notes") || null,
    budget_min: optionalNumber(text(formData, "budgetMin")),
    budget_max: optionalNumber(text(formData, "budgetMax")),
    currency: (text(formData, "currency") || "SAR").toUpperCase(),
  };
}

export async function createCastingWorkspaceProjectAction(formData: FormData) {
  const actor = await requirePublisher();
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const projectTitle = text(formData, "projectTitle");
  const roleName = text(formData, "roleName");
  const talentType = text(formData, "talentType");
  const city = text(formData, "city");
  const requiredCount = Math.min(positiveInt(text(formData, "requiredCount"), 1), 1000);
  const summary = text(formData, "summary");

  if (!projectTitle) throw new Error("Project title is required.");
  if (!roleName) throw new Error("Role name is required.");
  if (!["actor", "model"].includes(talentType)) throw new Error("Invalid talent type.");

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const clientName = actor.companyName || actor.contactName || "Publisher";
  const requirements = roleRequirements(formData);

  const { data: project, error: projectError } = await admin
    .from("casting_projects")
    .insert({
      publisher_id: actor.publisherId,
      service_mode: "self_service",
      status: "active",
      client_name: clientName,
      company_name: actor.companyName,
      project_title: projectTitle,
      talent_type: talentType,
      city: city || null,
      required_count: requiredCount,
      work_date: text(formData, "workDate") || null,
      budget: [requirements.budget_min, requirements.budget_max].filter((value) => value !== null).join(" - ") || null,
      brief: summary || roleName,
      requirements,
      source: "publisher_workspace",
      currency: requirements.currency,
      country_code: "SA",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (projectError || !project) throw new Error(projectError?.message ?? "Could not create casting project.");

  const { error: roleError } = await admin.from("casting_roles").insert({
    casting_project_id: project.id,
    title: roleName,
    talent_type: talentType,
    required_count: requiredCount,
    description: summary || null,
    requirements,
    status: "active",
    sort_order: 0,
    created_at: now,
    updated_at: now,
  });

  if (roleError) {
    await admin.from("casting_projects").delete().eq("id", project.id).eq("publisher_id", actor.publisherId);
    throw new Error(roleError.message);
  }

  revalidatePath(`/${locale}/publisher-dashboard/workspace`);
  redirect(`/${locale}/publisher-dashboard/workspace/${project.id}`);
}

export async function addCastingRoleAction(formData: FormData) {
  const actor = await requirePublisher();
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const projectId = Number(text(formData, "projectId"));
  const roleName = text(formData, "roleName");
  const talentType = text(formData, "talentType");

  if (!Number.isInteger(projectId) || projectId <= 0 || !roleName || !["actor", "model"].includes(talentType)) throw new Error("Invalid role data.");

  const admin = createAdminClient();
  const { data: project } = await admin.from("casting_projects").select("id").eq("id", projectId).eq("publisher_id", actor.publisherId).maybeSingle();
  if (!project) throw new Error("Project not found.");

  const { count } = await admin.from("casting_roles").select("id", { count: "exact", head: true }).eq("casting_project_id", project.id);
  const requirements = roleRequirements(formData);
  const { error } = await admin.from("casting_roles").insert({
    casting_project_id: project.id,
    title: roleName,
    talent_type: talentType,
    required_count: Math.min(positiveInt(text(formData, "requiredCount"), 1), 1000),
    description: text(formData, "summary") || null,
    requirements,
    status: "active",
    sort_order: count ?? 0,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/${locale}/publisher-dashboard/workspace/${project.id}`);
}

export async function publishCastingRoleAsOpportunityAction(formData: FormData) {
  const actor = await requirePublisher();
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const projectId = Number(text(formData, "projectId"));
  const roleId = Number(text(formData, "roleId"));
  if (!Number.isInteger(projectId) || !Number.isInteger(roleId)) throw new Error("Invalid casting role.");

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("casting_projects")
    .select("id, publisher_id, project_title, brief, city, work_date, currency, opportunity_id")
    .eq("id", projectId)
    .eq("publisher_id", actor.publisherId)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");

  const { data: role } = await admin
    .from("casting_roles")
    .select("id, opportunity_id, title, talent_type, required_count, description, requirements")
    .eq("id", roleId)
    .eq("casting_project_id", project.id)
    .maybeSingle();
  if (!role) throw new Error("Role not found.");
  if (role.opportunity_id) return;

  const requirements = (role.requirements ?? {}) as Record<string, unknown>;
  const budgetMin = optionalNumber(String(requirements.budget_min ?? ""));
  const budgetMax = optionalNumber(String(requirements.budget_max ?? ""));
  const fixedBudget = budgetMax ?? budgetMin;
  const city = String(requirements.city || project.city || "").trim();
  if (!city) throw new Error(locale === "ar" ? "حدد مدينة الدور قبل نشره كفرصة." : "Set the role city before publishing it as an opportunity.");

  const result = await createOpportunityAction({
    locale,
    posting_mode: "project",
    title: `${project.project_title} — ${role.title}`,
    description: role.description || project.brief || role.title,
    city,
    required_gender: String(requirements.gender || "any"),
    min_age: optionalNumber(String(requirements.age_min ?? "")),
    max_age: optionalNumber(String(requirements.age_max ?? "")),
    compensation_type: fixedBudget !== null ? "fixed" : "negotiable",
    budget: fixedBudget,
    opportunity_type: role.talent_type,
    application_days: 30,
    required_count: role.required_count,
    work_date: project.work_date,
    role_requirements: {
      workspace_project_id: project.id,
      workspace_role_id: role.id,
      traits: requirements.traits ?? null,
      notes: requirements.notes ?? null,
    },
  });

  await admin
    .from("casting_roles")
    .update({ opportunity_id: result.opportunityId, updated_at: new Date().toISOString() })
    .eq("id", role.id)
    .eq("casting_project_id", project.id)
    .is("opportunity_id", null);

  if (!project.opportunity_id) {
    await admin.from("casting_projects").update({ opportunity_id: result.opportunityId, updated_at: new Date().toISOString() }).eq("id", project.id).eq("publisher_id", actor.publisherId).is("opportunity_id", null);
  }

  revalidatePath(`/${locale}/publisher-dashboard/workspace/${project.id}`);
  revalidatePath(`/${locale}/publisher-dashboard/opportunities`);
}

export async function shortlistCastingApplicationAction(formData: FormData) {
  const actor = await requirePublisher();
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const projectId = Number(text(formData, "projectId"));
  const roleId = Number(text(formData, "roleId"));
  const applicationId = Number(text(formData, "applicationId"));
  if (![projectId, roleId, applicationId].every((value) => Number.isInteger(value) && value > 0)) throw new Error("Invalid shortlist request.");

  const admin = createAdminClient();
  const { data: project } = await admin.from("casting_projects").select("id").eq("id", projectId).eq("publisher_id", actor.publisherId).maybeSingle();
  if (!project) throw new Error("Project not found.");

  const { data: role } = await admin.from("casting_roles").select("id, opportunity_id").eq("id", roleId).eq("casting_project_id", project.id).maybeSingle();
  if (!role?.opportunity_id) throw new Error("Role is not linked to an opportunity.");

  const { data: application } = await admin
    .from("opportunity_applications")
    .select("id, opportunity_id, status")
    .eq("id", applicationId)
    .eq("opportunity_id", role.opportunity_id)
    .maybeSingle();
  if (!application || !["pending", "reviewing", "shortlisted"].includes(String(application.status))) throw new Error("Application is not eligible for shortlisting.");

  const now = new Date().toISOString();
  const { data: existing } = await admin
    .from("casting_shortlist")
    .select("id")
    .eq("casting_project_id", project.id)
    .eq("application_id", application.id)
    .maybeSingle();

  if (!existing) {
    const { count } = await admin.from("casting_shortlist").select("id", { count: "exact", head: true }).eq("casting_project_id", project.id);
    const { error: shortlistError } = await admin.from("casting_shortlist").insert({
      casting_project_id: project.id,
      casting_role_id: role.id,
      application_id: application.id,
      status: "shortlisted",
      rank: (count ?? 0) + 1,
      updated_at: now,
    });
    if (shortlistError) throw new Error(shortlistError.message);
  }

  if (application.status !== "shortlisted") {
    const { error: updateError } = await admin.from("opportunity_applications").update({ status: "shortlisted", updated_at: now }).eq("id", application.id).eq("status", application.status);
    if (updateError) throw new Error(updateError.message);
    await admin.from("application_status_logs").insert({ application_id: application.id, old_status: application.status, new_status: "shortlisted", changed_by: actor.userId, created_at: now });
  }

  revalidatePath(`/${locale}/publisher-dashboard/workspace/${project.id}`);
  revalidatePath(`/${locale}/publisher-dashboard/applicants`);
  revalidatePath(`/${locale}/talent-dashboard/applications`);
}
