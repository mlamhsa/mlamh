"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createMarketingOutreachAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const leadId = Number(formData.get("lead_id"));
  if (!Number.isInteger(leadId) || leadId <= 0) throw new Error("A valid lead is required.");
  const channel = String(formData.get("channel") ?? "").trim();
  if (!channel) throw new Error("Channel is required.");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) throw new Error("Message preview is required.");

  const db = createAdminClient();
  const { data: outreach, error } = await db.from("marketing_outreach").insert({
    lead_id: leadId,
    template_key: String(formData.get("template_key") ?? "").trim() || null,
    personalization: { message },
    channel,
    send_status: "waiting_approval",
    reply_status: "none",
  }).select("id").single();
  if (error) throw new Error(`[create outreach] ${error.message}`);

  const task = await createMarketingTask({
    agentId: "layan",
    taskType: "first_outreach",
    title: `Approve first outreach to lead #${leadId}`,
    objective: "Review the first external B2B outreach before sending.",
    channel,
    approvalLevel: "approval_required",
    leadId,
    source: "admin",
    input: { outreach_id: outreach.id, lead_id: leadId, channel, message },
  });

  const { data: approval } = await db.from("marketing_approvals").select("id").eq("task_id", task.id).eq("status", "pending").maybeSingle();
  if (approval) await db.from("marketing_outreach").update({ approval_id: approval.id, updated_at: new Date().toISOString() }).eq("id", outreach.id);

  revalidatePath("/admin/marketing/outreach");
  revalidatePath("/admin/marketing/approvals");
}
