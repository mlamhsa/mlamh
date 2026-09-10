"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PublisherContext = {
  userId: string;
  publisherId: number;
  publisherType: string;
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
    .select("id, publisher_type, company_name, contact_name, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) throw new Error("Publisher not found.");
  if (["suspended", "blocked", "banned", "disabled"].includes(String(publisher.status))) {
    throw new Error("Publisher account is not active.");
  }

  return {
    userId: user.id,
    publisherId: Number(publisher.id),
    publisherType: String(publisher.publisher_type ?? "individual"),
    companyName: publisher.company_name ?? null,
    contactName: publisher.contact_name ?? null,
  };
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: string, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function createCastingWorkspaceProjectAction(formData: FormData) {
  const actor = await requirePublisher();
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const projectTitle = text(formData, "projectTitle");
  const roleName = text(formData, "roleName");
  const talentType = text(formData, "talentType");
  const city = text(formData, "city");
  const requiredCount = positiveInt(text(formData, "requiredCount"), 1);

  if (!projectTitle) throw new Error("Project title is required.");
  if (!roleName) throw new Error("Role name is required.");
  if (!["actor", "model"].includes(talentType)) throw new Error("Invalid talent type.");

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const clientName = actor.companyName || actor.contactName || "Publisher";

  const { data: project, error: projectError } = await admin
    .from("casting_projects")
    .insert({
      publisher_id: actor.publisherId,
      project_title: projectTitle,
      client_name: clientName,
      source: "publisher_workspace",
      status: "active",
      service_mode: "self_serve",
      public_summary: text(formData, "summary") || null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (projectError || !project) {
    throw new Error(projectError?.message ?? "Could not create casting project.");
  }

  const budgetMinText = text(formData, "budgetMin");
  const budgetMaxText = text(formData, "budgetMax");
  const budgetMin = budgetMinText ? Number(budgetMinText) : null;
  const budgetMax = budgetMaxText ? Number(budgetMaxText) : null;

  const { error: roleError } = await admin
    .from("casting_roles")
    .insert({
      casting_project_id: project.id,
      role_name: roleName,
      talent_type: talentType,
      gender: text(formData, "gender") || null,
      age_min: text(formData, "ageMin") ? Number(text(formData, "ageMin")) : null,
      age_max: text(formData, "ageMax") ? Number(text(formData, "ageMax")) : null,
      city: city || null,
      traits: text(formData, "traits") || null,
      notes: text(formData, "notes") || null,
      budget_min: Number.isFinite(budgetMin) ? budgetMin : null,
      budget_max: Number.isFinite(budgetMax) ? budgetMax : null,
      currency: (text(formData, "currency") || "SAR").toUpperCase(),
      required_count: Math.min(requiredCount, 1000),
      status: "open",
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
  const projectId = text(formData, "projectId");
  const roleName = text(formData, "roleName");
  const talentType = text(formData, "talentType");

  if (!projectId || !roleName || !["actor", "model"].includes(talentType)) {
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

  const { error } = await admin.from("casting_roles").insert({
    casting_project_id: project.id,
    role_name: roleName,
    talent_type: talentType,
    gender: text(formData, "gender") || null,
    age_min: text(formData, "ageMin") ? Number(text(formData, "ageMin")) : null,
    age_max: text(formData, "ageMax") ? Number(text(formData, "ageMax")) : null,
    city: text(formData, "city") || null,
    required_count: Math.min(positiveInt(text(formData, "requiredCount"), 1), 1000),
    budget_min: text(formData, "budgetMin") ? Number(text(formData, "budgetMin")) : null,
    budget_max: text(formData, "budgetMax") ? Number(text(formData, "budgetMax")) : null,
    currency: (text(formData, "currency") || "SAR").toUpperCase(),
    notes: text(formData, "notes") || null,
    status: "open",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/${locale}/publisher-dashboard/workspace/${project.id}`);
}

export async function addTalentToCastingShortlistAction(formData: FormData) {
  const actor = await requirePublisher();
  const locale = text(formData, "locale") === "en" ? "en" : "ar";
  const projectId = text(formData, "projectId");
  const roleId = text(formData, "roleId");
  const talentId = Number(text(formData, "talentId"));
  if (!projectId || !roleId || !Number.isInteger(talentId) || talentId <= 0) {
    throw new Error("Invalid shortlist request.");
  }

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("casting_projects")
    .select("id")
    .eq("id", projectId)
    .eq("publisher_id", actor.publisherId)
    .maybeSingle();
  if (!project) throw new Error("Project not found.");

  const { data: role } = await admin
    .from("casting_roles")
    .select("id")
    .eq("id", roleId)
    .eq("casting_project_id", project.id)
    .maybeSingle();
  if (!role) throw new Error("Casting role not found.");

  const { data: talent } = await admin
    .from("talents")
    .select("id, user_id, status")
    .eq("id", talentId)
    .maybeSingle();
  if (!talent || !talent.user_id || ["rejected", "suspended", "blocked", "disabled"].includes(String(talent.status))) {
    throw new Error("Talent is not available.");
  }

  const { error } = await admin
    .from("casting_shortlist")
    .upsert({
      casting_project_id: project.id,
      casting_role_id: role.id,
      talent_id: talent.id,
      source: "publisher_workspace",
      internal_status: "shortlisted",
      publisher_status: "shortlisted",
      updated_at: new Date().toISOString(),
    }, { onConflict: "casting_role_id,talent_id", ignoreDuplicates: true });

  if (error) throw new Error(error.message);
  revalidatePath(`/${locale}/publisher-dashboard/workspace/${project.id}`);
}
