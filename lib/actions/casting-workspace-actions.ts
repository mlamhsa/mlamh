"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

  if (profileError || !profile || profile.account_type !== "publisher") {
    throw new Error("Publisher access required.");
  }
  if (profile.approval_status !== "approved") throw new Error("Publisher account is not approved.");
  if (["suspended", "blocked", "banned", "disabled"].includes(String(profile.status))) {
    throw new Error("Publisher account is not active.");
  }

  const { data: publisher, error: publisherError } = await admin
    .from("publishers")
    .select("id, company_name, contact_name, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) throw new Error("Publisher not found.");
  if (["suspended", "blocked", "banned", "disabled"].includes(String(publisher.status))) {
    throw new Error("Publisher account is not active.");
  }

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
      service_mode: "self_serve",
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

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Could not create casting project.");
  }

  const { error: roleError } = await admin.from("casting_roles").insert({
    casting_project_id: project.id,
    title: roleName,
    talent_type: talentType,
    required_count: requiredCount,
    description: summary || null,
    requirements,
    status: "open",
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

  if (!Number.isInteger(projectId) || projectId <= 0 || !roleName || !["actor", "model"].includes(talentType)) {
    throw new Error("Invalid role data.");
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("casting_projects")
    .select("id")
    .eq("id", projectId)
    .eq("publisher_id", actor.publisherId)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");

  const { count } = await admin
    .from("casting_roles")
    .select("id", { count: "exact", head: true })
    .eq("casting_project_id", project.id);

  const requirements = roleRequirements(formData);
  const { error } = await admin.from("casting_roles").insert({
    casting_project_id: project.id,
    title: roleName,
    talent_type: talentType,
    required_count: Math.min(positiveInt(text(formData, "requiredCount"), 1), 1000),
    description: text(formData, "summary") || null,
    requirements,
    status: "open",
    sort_order: count ?? 0,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/${locale}/publisher-dashboard/workspace/${project.id}`);
}
