"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function positiveInt(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Invalid id.");
  return parsed;
}

function cleanMessage(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

async function createTalentNotification({
  admin,
  adminUserId,
  talentId,
  invitationId,
  projectId,
  roleId,
  opportunityId,
  roleTitle,
}: {
  admin: ReturnType<typeof createAdminClient>;
  adminUserId: string;
  talentId: number;
  invitationId: number;
  projectId: number;
  roleId: number;
  opportunityId: number;
  roleTitle: string;
}) {
  const { data: event, error: eventError } = await admin.from("events").insert({
    event_type: "managed_casting_invitation",
    target_type: "managed_casting_invitation",
    target_id: String(invitationId),
    actor_id: adminUserId,
    metadata: { invitationId, projectId, roleId, opportunityId, managed_by: "mlamh" },
  }).select("id").single();
  if (eventError || !event) {
    console.error("[managed casting invitation event]", eventError);
    return;
  }

  const { error } = await admin.from("notifications").insert({
    event_id: event.id,
    recipient_type: "talent",
    recipient_id: String(talentId),
    title: "دعوة لمشروع كاستينغ من ملامح",
    body: `ملامح ترى أن ملفك مناسب لدور «${roleTitle}». راجع الفرصة وقدّم إذا كنت مهتمًا ومتاحًا.`,
    is_read: false,
  });
  if (error) console.error("[managed casting invitation notification]", error);
}

export async function inviteManagedCastingTalentAction(formData: FormData) {
  const adminUser = await requireAdminAccess();
  const projectId = positiveInt(formData.get("project_id"));
  const roleId = positiveInt(formData.get("role_id"));
  const talentId = positiveInt(formData.get("talent_id"));
  const message = cleanMessage(formData.get("message"));
  const admin = createAdminClient();

  const [{ data: project }, { data: role }, { data: talent }] = await Promise.all([
    admin.from("casting_projects").select("id,service_mode,status").eq("id", projectId).maybeSingle(),
    admin.from("casting_roles").select("id,casting_project_id,opportunity_id,title,title_en,status").eq("id", roleId).eq("casting_project_id", projectId).maybeSingle(),
    admin.from("talents").select("id,user_id,status").eq("id", talentId).maybeSingle(),
  ]);

  if (!project || project.service_mode !== "managed" || project.status === "cancelled") throw new Error("Managed casting project not found.");
  if (!role || role.status === "cancelled" || !role.opportunity_id) throw new Error("Publish the role opportunity before inviting talent.");
  if (!talent?.user_id || ["suspended", "blocked", "banned", "disabled", "rejected"].includes(String(talent.status))) {
    throw new Error("Talent account is not available for invitation.");
  }

  const { data: opportunity } = await admin.from("opportunities")
    .select("id,published,status,managed_by_mlamh")
    .eq("id", role.opportunity_id)
    .maybeSingle();
  if (!opportunity?.managed_by_mlamh || opportunity.published !== true || !["published", "open"].includes(String(opportunity.status))) {
    throw new Error("The managed role opportunity must be published before talent can be invited.");
  }

  const { data: existingApplication } = await admin.from("opportunity_applications")
    .select("id")
    .eq("opportunity_id", opportunity.id)
    .eq("talent_id", talentId)
    .maybeSingle();
  if (existingApplication) {
    revalidatePath(`/admin/casting/${projectId}/applications`);
    return;
  }

  const now = new Date().toISOString();
  const { data: invitation, error: invitationError } = await admin.from("managed_casting_invitations").upsert({
    casting_project_id: projectId,
    casting_role_id: roleId,
    opportunity_id: opportunity.id,
    talent_id: talentId,
    invited_by: adminUser.id,
    status: "sent",
    message: message || null,
    sent_at: now,
    viewed_at: null,
    applied_at: null,
    updated_at: now,
  }, { onConflict: "opportunity_id,talent_id" }).select("id").single();
  if (invitationError || !invitation) throw new Error(invitationError?.message || "Unable to create managed casting invitation.");

  await createTalentNotification({
    admin,
    adminUserId: adminUser.id,
    talentId,
    invitationId: Number(invitation.id),
    projectId,
    roleId,
    opportunityId: Number(opportunity.id),
    roleTitle: String(role.title || role.title_en || "Casting role"),
  });

  revalidatePath(`/admin/casting/${projectId}/supply`);
  revalidatePath(`/admin/casting/${projectId}/applications`);
  revalidatePath("/ar/talent-dashboard/notifications");
  revalidatePath("/en/talent-dashboard/notifications");
}
