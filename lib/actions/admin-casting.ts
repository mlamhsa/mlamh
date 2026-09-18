"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminOpportunityAction } from "@/lib/actions/create-admin-opportunity";
import { translateOpportunityContent } from "@/lib/ai/translate-opportunity";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
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
const allowedRoleStatuses = new Set([
  "draft",
  "active",
  "screening",
  "shortlist_ready",
  "client_review",
  "completed",
  "cancelled",
]);
const allowedShortlistStatuses = new Set([
  "shortlisted",
  "presented",
  "reserved",
  "selected",
  "declined",
  "withdrawn",
]);

function toPositiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: FormDataEntryValue | null) {
  const raw = stringValue(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateCasting(projectId: number) {
  revalidatePath("/admin/casting");
  revalidatePath(`/admin/casting/${projectId}`);
  revalidatePath(`/admin/casting/${projectId}/applications`);
  revalidatePath("/admin/casting/analytics");
  revalidatePath("/admin/casting/commercial");
}

export async function updateCastingProjectAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));

  if (!projectId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_project",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: "invalid-input",
      reason: "invalid_casting_project_id",
    });

    return;
  }

  const status = stringValue(formData.get("status"));
  const packageCode = stringValue(formData.get("package_code"));
  const quotedAmountRaw = stringValue(formData.get("quoted_amount"));
  const internalNotes = stringValue(formData.get("internal_notes")).slice(0, 10000);
  const clientStatusNote = stringValue(formData.get("client_status_note")).slice(0, 5000);

  if (!allowedStatuses.has(status) || (packageCode && !allowedPackages.has(packageCode))) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_project",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "invalid_casting_project_fields",
      metadata: {
        requested_status:
          status || null,
        package_code:
          packageCode || null,
      },
    });

    return;
  }

  const quotedAmount = quotedAmountRaw ? Number(quotedAmountRaw) : null;
  if (quotedAmount !== null && (!Number.isFinite(quotedAmount) || quotedAmount < 0)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_project",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "invalid_quoted_amount",
      metadata: {
        quoted_amount:
          quotedAmountRaw || null,
      },
    });

    return;
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("casting_projects")
    .update({
      status,
      package_code: packageCode || null,
      quoted_amount: quotedAmount,
      internal_notes: internalNotes || null,
      client_status_note: clientStatusNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    console.error("[updateCastingProjectAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_project",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_project_update_failed",
      metadata: {
        requested_status:
          status,
        package_code:
          packageCode || null,
        quoted_amount:
          quotedAmount,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "update_casting_project",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_PROJECT,
    targetId: projectId,
    metadata: {
      new_status:
        status,
      package_code:
        packageCode || null,
      quoted_amount:
        quotedAmount,
      internal_notes_present:
        Boolean(internalNotes),
      client_status_note_present:
        Boolean(clientStatusNote),
    },
  });

  revalidateCasting(projectId);
}

export async function createCastingRoleAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));

  if (!projectId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "invalid-input",
      reason: "invalid_casting_project_id",
    });

    return;
  }

  const title = stringValue(formData.get("title")).slice(0, 160);
  const description = stringValue(formData.get("description")).slice(0, 5000);
  const talentType = formData.get("talent_type") === "model" ? "model" : "actor";
  const requiredCount = Math.min(1000, Math.max(1, toPositiveInt(formData.get("required_count")) ?? 1));

  if (!title) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "invalid-input",
      reason: "casting_role_title_required",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    return;
  }

  const sourceLanguage: "ar" | "en" = /[\u0600-\u06FF]/.test(`${title} ${description}`) ? "ar" : "en";
  let translated: Awaited<
    ReturnType<
      typeof translateOpportunityContent
    >
  >;

  try {
    translated =
      await translateOpportunityContent({
        sourceLanguage,
        title,
        description:
          description || title,
      });
  } catch (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "translation-failed",
      reason: "casting_role_translation_failed",
      metadata: {
        casting_project_id:
          projectId,
        source_language:
          sourceLanguage,
        title,
      },
    });

    throw error;
  }

  const titlePrimary = sourceLanguage === "ar" ? title : translated.title.trim();
  const titleEn = sourceLanguage === "en" ? title : translated.title.trim();
  const descriptionPrimary = description
    ? sourceLanguage === "ar"
      ? description
      : translated.description.trim()
    : null;
  const descriptionEn = description
    ? sourceLanguage === "en"
      ? description
      : translated.description.trim()
    : null;

  if (!titlePrimary || !titleEn) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "translation-failed",
      reason: "casting_role_translation_empty",
      metadata: {
        casting_project_id:
          projectId,
        source_language:
          sourceLanguage,
      },
    });

    return;
  }

  const genderRaw = stringValue(formData.get("gender"));
  const gender = genderRaw === "male" || genderRaw === "female" ? genderRaw : "any";
  const minAge = optionalNumber(formData.get("min_age"));
  const maxAge = optionalNumber(formData.get("max_age"));
  if (
    (minAge !== null &&
      (minAge < 1 || minAge > 120)) ||
    (maxAge !== null &&
      (maxAge < 1 || maxAge > 120)) ||
    (minAge !== null &&
      maxAge !== null &&
      minAge > maxAge)
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "invalid-input",
      reason: "invalid_casting_role_age_range",
      metadata: {
        casting_project_id:
          projectId,
        min_age:
          minAge,
        max_age:
          maxAge,
      },
    });

    return;
  }

  const adminClient = createAdminClient();
  const { data: project } = await adminClient
    .from("casting_projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "project-not-found",
      reason: "casting_project_not_found",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    return;
  }

  const { data: lastRole } = await adminClient
    .from("casting_roles")
    .select("sort_order")
    .eq("casting_project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const requestedSort = optionalNumber(formData.get("sort_order"));
  const sortOrder = requestedSort !== null && requestedSort >= 0
    ? Math.floor(requestedSort)
    : Number(lastRole?.sort_order ?? -1) + 1;

  const {
    data: createdRole,
    error,
  } = await adminClient
    .from("casting_roles")
    .insert({
      casting_project_id: projectId,
      title: titlePrimary,
      title_en: titleEn,
      description: descriptionPrimary,
      description_en: descriptionEn,
      talent_type: talentType,
      required_count: requiredCount,
      status: "draft",
      sort_order: sortOrder,
      requirements: {
        gender,
        min_age: minAge,
        max_age: maxAge,
        city: stringValue(formData.get("city")) || null,
      },
    })
    .select("id")
    .single();

  if (error || !createdRole) {
    console.error("[createCastingRoleAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: "creation-failed",
      reason: "casting_role_insert_failed",
      metadata: {
        casting_project_id:
          projectId,
        talent_type:
          talentType,
        required_count:
          requiredCount,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "create_casting_role",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_ROLE,
    targetId: createdRole.id,
    metadata: {
      casting_project_id:
        projectId,
      talent_type:
        talentType,
      required_count:
        requiredCount,
      status: "draft",
      source_language:
        sourceLanguage,
      gender,
      min_age:
        minAge,
      max_age:
        maxAge,
    },
  });

  revalidateCasting(projectId);
}

export async function updateCastingRoleAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));
  const roleId = toPositiveInt(formData.get("role_id"));

  if (!projectId || !roleId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_role",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId:
        roleId ?? "invalid-input",
      reason: "invalid_casting_role_input",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    return;
  }

  const status = stringValue(formData.get("status"));

  if (!allowedRoleStatuses.has(status)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_role",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "invalid_casting_role_status",
      metadata: {
        casting_project_id:
          projectId,
        requested_status:
          status || null,
      },
    });

    return;
  }
  const requiredCount = Math.min(1000, Math.max(1, toPositiveInt(formData.get("required_count")) ?? 1));

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("casting_roles")
    .update({ status, required_count: requiredCount, updated_at: new Date().toISOString() })
    .eq("id", roleId)
    .eq("casting_project_id", projectId);

  if (error) {
    console.error("[updateCastingRoleAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_role",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "casting_role_update_failed",
      metadata: {
        casting_project_id:
          projectId,
        requested_status:
          status,
        required_count:
          requiredCount,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "update_casting_role",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_ROLE,
    targetId: roleId,
    metadata: {
      casting_project_id:
        projectId,
      new_status:
        status,
      required_count:
        requiredCount,
    },
  });

  revalidateCasting(projectId);
}

export async function createCastingRoleOpportunityAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));
  const roleId = toPositiveInt(formData.get("role_id"));

  if (!projectId || !roleId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role_opportunity",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId:
        roleId ?? "invalid-input",
      reason: "invalid_casting_role_input",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    throw new Error("Invalid casting role.");
  }

  const adminClient = createAdminClient();
  const [{ data: project }, { data: role }] = await Promise.all([
    adminClient.from("casting_projects").select("*").eq("id", projectId).maybeSingle(),
    adminClient.from("casting_roles").select("*").eq("id", roleId).eq("casting_project_id", projectId).maybeSingle(),
  ]);
  if (!project || !role) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "casting_project_or_role_not_found",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    throw new Error("Casting project or role not found.");
  }

  if (role.opportunity_id) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role_opportunity",
      outcome: "noop",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "role_opportunity_already_exists",
      metadata: {
        casting_project_id:
          projectId,
        opportunity_id:
          role.opportunity_id,
      },
    });

    revalidateCasting(projectId);
    return;
  }

  const requirements = (role.requirements ?? {}) as Record<string, unknown>;
  const gender = requirements.gender === "male" || requirements.gender === "female" ? requirements.gender : "any";
  const minAge = typeof requirements.min_age === "number" ? requirements.min_age : null;
  const maxAge = typeof requirements.max_age === "number" ? requirements.max_age : null;
  const roleCity = typeof requirements.city === "string" ? requirements.city.trim() : "";
  const matchedCity = SAUDI_CITIES.find(
    (item) => item.ar === roleCity || item.en === roleCity || item.slug === roleCity,
  ) ?? null;
  const cityFallback = roleCity || project.city || null;
  const titleAr = String(role.title || "").trim();
  const titleEn = String(role.title_en || role.title || "").trim();
  const descriptionAr = String(role.description || project.brief || titleAr).trim();
  const descriptionEn = String(role.description_en || role.description || project.brief || titleEn).trim();

  const result = await createAdminOpportunityAction({
    sourceType: "client",
    companyName: project.company_name || "من عملاء ملامح",
    contactName: project.client_name,
    contactPhone: project.contact_phone,
    contactEmail: project.contact_email,
    postingMode: "project",
    title: titleAr,
    description: descriptionAr,
    opportunityType: role.talent_type === "model" ? "model" : "actor",
    citySlug: matchedCity?.slug ?? null,
    cityAr: matchedCity?.ar ?? cityFallback,
    cityEn: matchedCity?.en ?? cityFallback,
    requiredGender: gender,
    minAge,
    maxAge,
    requiredCount: Number(role.required_count) || 1,
    compensationType: "negotiable",
    workDate: project.work_date || null,
    roleRequirements: {
      managed_by: "mlamh",
      casting_project_id: projectId,
      casting_role_id: roleId,
      role_title_ar: titleAr,
      role_title_en: titleEn,
    },
    publishNow: false,
  });

  const opportunityId = Number(result?.opportunity?.id);
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "opportunity_creation_failed",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    throw new Error("Unable to create role opportunity.");
  }

  const now = new Date().toISOString();
  const { error: opportunityError } = await adminClient
    .from("opportunities")
    .update({ title_en: titleEn, description_en: descriptionEn, managed_by_mlamh: true, updated_at: now })
    .eq("id", opportunityId);

  if (opportunityError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "opportunity_localization_link_failed",
      metadata: {
        casting_project_id:
          projectId,
        opportunity_id:
          opportunityId,
      },
    });

    throw new Error(opportunityError.message);
  }

  const { error: roleError } = await adminClient
    .from("casting_roles")
    .update({ opportunity_id: opportunityId, status: "active", updated_at: now })
    .eq("id", roleId)
    .eq("casting_project_id", projectId);

  if (roleError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_role_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_ROLE,
      targetId: roleId,
      reason: "casting_role_opportunity_link_failed",
      metadata: {
        casting_project_id:
          projectId,
        opportunity_id:
          opportunityId,
        orphan_draft_opportunity:
          true,
      },
    });

    throw new Error(roleError.message);
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "create_casting_role_opportunity",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_ROLE,
    targetId: roleId,
    metadata: {
      casting_project_id:
        projectId,
      opportunity_id:
        opportunityId,
      new_role_status:
        "active",
      talent_type:
        role.talent_type,
    },
  });

  revalidateCasting(projectId);
  revalidatePath("/admin/opportunities");
}

export async function ensureCastingClientAccessAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));

  if (!projectId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "ensure_casting_client_access",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: "invalid-input",
      reason: "invalid_casting_project_id",
    });

    return;
  }

  const adminClient = createAdminClient();
  const { data: project, error: lookupError } = await adminClient
    .from("casting_projects")
    .select("id,client_access_token")
    .eq("id", projectId)
    .maybeSingle();
  if (lookupError || !project) {
    console.error("[ensureCastingClientAccessAction lookup]", lookupError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "ensure_casting_client_access",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_project_lookup_failed",
    });

    return;
  }

  if (project.client_access_token) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "ensure_casting_client_access",
      outcome: "noop",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "client_access_already_exists",
      metadata: {
        client_access_token_present:
          true,
      },
    });

    revalidateCasting(projectId);
    return;
  }

  const { error } = await adminClient
    .from("casting_projects")
    .update({
      client_access_token: crypto.randomUUID(),
      client_shared_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    console.error("[ensureCastingClientAccessAction update]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "ensure_casting_client_access",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "client_access_creation_failed",
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "ensure_casting_client_access",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_PROJECT,
    targetId: projectId,
    metadata: {
      client_access_created:
        true,
    },
  });

  revalidateCasting(projectId);
}

export async function linkCastingOpportunityAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));
  const opportunityId = toPositiveInt(formData.get("opportunity_id"));

  if (!projectId || !opportunityId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "link_casting_opportunity",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId:
        projectId ?? "invalid-input",
      reason: "invalid_casting_opportunity_link",
      metadata: {
        opportunity_id:
          opportunityId,
      },
    });

    return;
  }

  const adminClient = createAdminClient();
  const [{ data: project, error: projectError }, { data: opportunity, error: opportunityError }] = await Promise.all([
    adminClient.from("casting_projects").select("id,opportunity_id").eq("id", projectId).maybeSingle(),
    adminClient.from("opportunities").select("id").eq("id", opportunityId).maybeSingle(),
  ]);
  if (projectError || opportunityError || !project || !opportunity) {
    console.error("[linkCastingOpportunityAction] lookup failed", projectError ?? opportunityError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "link_casting_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_or_opportunity_lookup_failed",
      metadata: {
        opportunity_id:
          opportunityId,
      },
    });

    return;
  }

  if (
    Number(project.opportunity_id) ===
    opportunityId
  ) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "link_casting_opportunity",
      outcome: "noop",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "opportunity_already_linked",
      metadata: {
        opportunity_id:
          opportunityId,
      },
    });

    return;
  }

  const previousOpportunityId = project.opportunity_id ? Number(project.opportunity_id) : null;
  const { error: projectUpdateError } = await adminClient
    .from("casting_projects")
    .update({ opportunity_id: opportunityId, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (projectUpdateError) {
    console.error("[linkCastingOpportunityAction] project update", projectUpdateError);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "link_casting_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_project_link_update_failed",
      metadata: {
        previous_opportunity_id:
          previousOpportunityId,
        requested_opportunity_id:
          opportunityId,
      },
    });

    return;
  }

  const {
    error: opportunityManagedError,
  } = await adminClient
    .from("opportunities")
    .update({
      managed_by_mlamh: true,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", opportunityId);

  if (opportunityManagedError) {
    const {
      error: rollbackError,
    } = await adminClient
      .from("casting_projects")
      .update({
        opportunity_id:
          previousOpportunityId,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", projectId);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "link_casting_opportunity",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "managed_opportunity_flag_update_failed",
      metadata: {
        previous_opportunity_id:
          previousOpportunityId,
        requested_opportunity_id:
          opportunityId,
        rollback_succeeded:
          !rollbackError,
      },
    });

    return;
  }

  let previousCleanupSucceeded = true;

  if (previousOpportunityId && previousOpportunityId !== opportunityId) {
    const [{ count: projectCount }, { count: roleCount }] = await Promise.all([
      adminClient.from("casting_projects").select("id", { count: "exact", head: true }).eq("opportunity_id", previousOpportunityId),
      adminClient.from("casting_roles").select("id", { count: "exact", head: true }).eq("opportunity_id", previousOpportunityId),
    ]);

    if ((projectCount ?? 0) === 0 && (roleCount ?? 0) === 0) {
      const {
        error: cleanupError,
      } = await adminClient
        .from("opportunities")
        .update({
          managed_by_mlamh: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", previousOpportunityId);

      if (cleanupError) {
        previousCleanupSucceeded = false;
        console.error(
          "[linkCastingOpportunityAction previous cleanup]",
          cleanupError,
        );
      }
    }
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "link_casting_opportunity",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_PROJECT,
    targetId: projectId,
    metadata: {
      previous_opportunity_id:
        previousOpportunityId,
      new_opportunity_id:
        opportunityId,
      previous_cleanup_succeeded:
        previousCleanupSucceeded,
    },
  });

  revalidateCasting(projectId);
  revalidatePath(`/admin/opportunities/${opportunityId}`);
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
}

export async function createCastingOpportunityFromBriefAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));

  if (!projectId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: "invalid-input",
      reason: "invalid_casting_project_id",
    });

    throw new Error("Invalid casting project.");
  }

  const adminClient = createAdminClient();
  const { data: project, error: projectError } = await adminClient
    .from("casting_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_project_not_found",
    });

    throw new Error(projectError?.message || "Casting project not found.");
  }

  if (project.opportunity_id) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "noop",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_opportunity_already_exists",
      metadata: {
        opportunity_id:
          project.opportunity_id,
      },
    });

    redirect(`/admin/casting/${projectId}?lang=ar`);
  }

  const rawTitle = stringValue(formData.get("title"));
  const rawDescription = stringValue(formData.get("description"));
  if (!rawTitle || !rawDescription) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "title_and_description_required",
    });

    throw new Error("Title and description are required.");
  }

  const opportunityType = formData.get("opportunity_type") === "model" ? "model" : "actor";
  const citySlug = stringValue(formData.get("city_slug"));
  const city = SAUDI_CITIES.find((item) => item.slug === citySlug) ?? null;
  const sourceLanguage: "ar" | "en" = /[\u0600-\u06FF]/.test(`${rawTitle} ${rawDescription}`) ? "ar" : "en";
  let translated: Awaited<
    ReturnType<
      typeof translateOpportunityContent
    >
  >;

  try {
    translated =
      await translateOpportunityContent({
        sourceLanguage,
        title: rawTitle,
        description:
          rawDescription,
      });
  } catch (error) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "automatic_translation_failed",
      metadata: {
        source_language:
          sourceLanguage,
      },
    });

    throw error;
  }
  const titleAr = sourceLanguage === "ar" ? rawTitle : translated.title.trim();
  const descriptionAr = sourceLanguage === "ar" ? rawDescription : translated.description.trim();
  const titleEn = sourceLanguage === "en" ? rawTitle : translated.title.trim();
  const descriptionEn = sourceLanguage === "en" ? rawDescription : translated.description.trim();
  if (!titleAr || !descriptionAr || !titleEn || !descriptionEn) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "automatic_translation_empty",
      metadata: {
        source_language:
          sourceLanguage,
      },
    });

    throw new Error("Automatic bilingual content generation failed.");
  }

  const compensationRaw = stringValue(formData.get("compensation_type"));
  const compensationType: "fixed" | "negotiable" | "unpaid" =
    compensationRaw === "fixed" || compensationRaw === "unpaid" ? compensationRaw : "negotiable";
  const budget = compensationType === "fixed" ? stringValue(formData.get("budget")) || null : null;
  if (compensationType === "fixed" && !budget) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "fixed_budget_required",
    });

    throw new Error("Budget is required for fixed compensation.");
  }

  const publicCompanyName = stringValue(formData.get("public_company_name")) || project.company_name || "من عملاء ملامح";
  const result = await createAdminOpportunityAction({
    sourceType: "client",
    companyName: publicCompanyName,
    contactName: project.client_name,
    contactPhone: project.contact_phone,
    contactEmail: project.contact_email,
    postingMode: "project",
    title: titleAr,
    description: descriptionAr,
    opportunityType,
    citySlug: city?.slug ?? null,
    cityAr: city?.ar ?? project.city ?? null,
    cityEn: city?.en ?? project.city ?? null,
    requiredGender:
      formData.get("required_gender") === "male"
        ? "male"
        : formData.get("required_gender") === "female"
          ? "female"
          : "any",
    minAge: optionalNumber(formData.get("min_age")),
    maxAge: optionalNumber(formData.get("max_age")),
    requiredCount: optionalNumber(formData.get("required_count")) ?? project.required_count,
    compensationType,
    budget,
    applicationDays: optionalNumber(formData.get("application_days")) ?? 14,
    workDate: stringValue(formData.get("work_date")) || project.work_date || null,
    roleRequirements: {
      managed_by: "mlamh",
      casting_project_id: projectId,
      source_type: "client",
      content_source_language: sourceLanguage,
      translation_mode: "automatic",
    },
    publishNow: false,
  });

  const opportunityId = Number(result?.opportunity?.id);
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "opportunity_creation_failed",
    });

    throw new Error("Unable to create opportunity from casting brief.");
  }

  const now = new Date().toISOString();
  const { error: opportunityError } = await adminClient
    .from("opportunities")
    .update({ title_en: titleEn, description_en: descriptionEn, managed_by_mlamh: true, updated_at: now })
    .eq("id", opportunityId);

  if (opportunityError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "opportunity_localization_update_failed",
      metadata: {
        opportunity_id:
          opportunityId,
      },
    });

    throw new Error(opportunityError.message);
  }

  const { error: castingError } = await adminClient
    .from("casting_projects")
    .update({
      opportunity_id: opportunityId,
      client_status_note:
        project.client_status_note ||
        "تم تجهيز مسودة فرصة المشروع، وستتم مراجعتها قبل النشر واستقبال طلبات المواهب.",
      updated_at: now,
    })
    .eq("id", projectId);
  if (castingError) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "create_casting_opportunity_from_brief",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_PROJECT,
      targetId: projectId,
      reason: "casting_project_opportunity_link_failed",
      metadata: {
        opportunity_id:
          opportunityId,
        orphan_draft_opportunity:
          true,
      },
    });

    throw new Error(castingError.message);
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "create_casting_opportunity_from_brief",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_PROJECT,
    targetId: projectId,
    metadata: {
      opportunity_id:
        opportunityId,
      source_language:
        sourceLanguage,
      status: "draft",
      managed_by_mlamh:
        true,
    },
  });

  revalidateCasting(projectId);
  revalidatePath("/admin/opportunities");
  redirect(`/admin/casting/${projectId}?lang=ar&opportunity_created=1`);
}

export async function addCastingShortlistAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));
  const applicationId = toPositiveInt(formData.get("application_id"));
  const roleId = toPositiveInt(formData.get("casting_role_id"));

  if (!projectId || !applicationId) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "add_casting_shortlist",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: "invalid-input",
      reason: "invalid_shortlist_input",
      metadata: {
        casting_project_id:
          projectId,
        application_id:
          applicationId,
        casting_role_id:
          roleId,
      },
    });

    return;
  }

  const adminClient = createAdminClient();
  const { data: application } = await adminClient
    .from("opportunity_applications")
    .select("id,opportunity_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "add_casting_shortlist",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: "application-not-found",
      reason: "application_not_found",
      metadata: {
        casting_project_id:
          projectId,
        application_id:
          applicationId,
      },
    });

    return;
  }

  const { data: project } = await adminClient
    .from("casting_projects")
    .select("opportunity_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "add_casting_shortlist",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: "project-not-found",
      reason: "casting_project_not_found",
      metadata: {
        casting_project_id:
          projectId,
        application_id:
          applicationId,
      },
    });

    return;
  }

  let validOpportunity = Boolean(
    project.opportunity_id && Number(application.opportunity_id) === Number(project.opportunity_id),
  );

  if (roleId) {
    const { data: role } = await adminClient
      .from("casting_roles")
      .select("id,opportunity_id,status")
      .eq("id", roleId)
      .eq("casting_project_id", projectId)
      .maybeSingle();
    if (!role || role.status === "cancelled") {
      await recordAdminAction({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        action: "add_casting_shortlist",
        outcome: "blocked",
        target: EVENT_TARGETS.CASTING_SHORTLIST,
        targetId: "role-unavailable",
        reason: "casting_role_unavailable",
        metadata: {
          casting_project_id:
            projectId,
          application_id:
            applicationId,
          casting_role_id:
            roleId,
        },
      });

      return;
    }
    validOpportunity = Boolean(
      role.opportunity_id && Number(application.opportunity_id) === Number(role.opportunity_id),
    );
  }

  if (!validOpportunity) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "add_casting_shortlist",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: "opportunity-mismatch",
      reason: "application_opportunity_mismatch",
      metadata: {
        casting_project_id:
          projectId,
        application_id:
          applicationId,
        casting_role_id:
          roleId,
        application_opportunity_id:
          application.opportunity_id,
      },
    });

    return;
  }

  const { error } = await adminClient.from("casting_shortlist").upsert(
    {
      casting_project_id: projectId,
      application_id: applicationId,
      casting_role_id: roleId,
      status: "shortlisted",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "casting_project_id,application_id" },
  );

  if (error) {
    console.error("[addCastingShortlistAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "add_casting_shortlist",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: "upsert-failed",
      reason: "shortlist_upsert_failed",
      metadata: {
        casting_project_id:
          projectId,
        application_id:
          applicationId,
        casting_role_id:
          roleId,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "add_casting_shortlist",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_SHORTLIST,
    targetId: applicationId,
    metadata: {
      casting_project_id:
        projectId,
      application_id:
        applicationId,
      casting_role_id:
        roleId,
      new_status:
        "shortlisted",
    },
  });

  revalidateCasting(projectId);
}

export async function updateCastingShortlistStatusAction(formData: FormData) {
  const adminUser =
    await requireAdminAccess();
  const projectId = toPositiveInt(formData.get("project_id"));
  const shortlistId = toPositiveInt(formData.get("shortlist_id"));
  const status = stringValue(formData.get("status"));
  if (!projectId || !shortlistId || !allowedShortlistStatuses.has(status)) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_shortlist_status",
      outcome: "blocked",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId:
        shortlistId ?? "invalid-input",
      reason: "invalid_shortlist_status_input",
      metadata: {
        casting_project_id:
          projectId,
        requested_status:
          status || null,
      },
    });

    return;
  }

  const adminClient = createAdminClient();
  const {
    data: existingShortlist,
    error: lookupError,
  } = await adminClient
    .from("casting_shortlist")
    .select("id,status,application_id,casting_role_id")
    .eq("id", shortlistId)
    .eq("casting_project_id", projectId)
    .maybeSingle();

  if (lookupError || !existingShortlist) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_shortlist_status",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: shortlistId,
      reason: "shortlist_not_found",
      metadata: {
        casting_project_id:
          projectId,
      },
    });

    return;
  }

  if (existingShortlist.status === status) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_shortlist_status",
      outcome: "noop",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: shortlistId,
      reason: "shortlist_status_already_set",
      metadata: {
        casting_project_id:
          projectId,
        current_status:
          existingShortlist.status,
      },
    });

    return;
  }

  const { error } = await adminClient
    .from("casting_shortlist")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", shortlistId)
    .eq("casting_project_id", projectId);

  if (error) {
    console.error("[updateCastingShortlistStatusAction]", error);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "update_casting_shortlist_status",
      outcome: "failed",
      target: EVENT_TARGETS.CASTING_SHORTLIST,
      targetId: shortlistId,
      reason: "shortlist_status_update_failed",
      metadata: {
        casting_project_id:
          projectId,
        previous_status:
          existingShortlist.status,
        requested_status:
          status,
      },
    });

    return;
  }

  await recordAdminAction({
    actorId: adminUser.id,
    actorEmail: adminUser.email,
    action: "update_casting_shortlist_status",
    outcome: "success",
    target: EVENT_TARGETS.CASTING_SHORTLIST,
    targetId: shortlistId,
    metadata: {
      casting_project_id:
        projectId,
      application_id:
        existingShortlist.application_id,
      casting_role_id:
        existingShortlist.casting_role_id,
      previous_status:
        existingShortlist.status,
      new_status:
        status,
    },
  });

  revalidateCasting(projectId);
}
