"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { executeMarketingEmailJob } from "@/lib/marketing/channels/email-executor";
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
  const subject = String(formData.get("subject") ?? "").trim();

  const db = createAdminClient();
  let recipientEmail: string | null = null;
  if (channel === "email") {
    if (!subject) throw new Error("Email subject is required.");
    const { data: lead, error: leadError } = await db.from("marketing_leads").select("id,contact_id").eq("id", leadId).single();
    if (leadError || !lead?.contact_id) throw new Error("This lead does not have an email contact.");
    const { data: contact, error: contactError } = await db.from("marketing_contacts").select("email").eq("id", lead.contact_id).single();
    recipientEmail = typeof contact?.email === "string" ? contact.email.trim() : null;
    if (contactError || !recipientEmail || !recipientEmail.includes("@")) throw new Error("This lead does not have a valid email contact.");
  }

  const personalization = {
    message,
    subject: subject || null,
    recipient_email: recipientEmail,
  };
  const { data: outreach, error } = await db.from("marketing_outreach").insert({
    lead_id: leadId,
    template_key: String(formData.get("template_key") ?? "").trim() || null,
    personalization,
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
    input: {
      outreach_id: outreach.id,
      lead_id: leadId,
      channel,
      message,
      subject: subject || null,
      recipient_email: recipientEmail,
    },
  });

  const { data: approval } = await db.from("marketing_approvals").select("id").eq("task_id", task.id).eq("status", "pending").maybeSingle();
  if (approval) await db.from("marketing_outreach").update({ approval_id: approval.id, updated_at: new Date().toISOString() }).eq("id", outreach.id);

  revalidatePath("/admin/marketing/outreach");
  revalidatePath("/admin/marketing/approvals");
}

export async function sendApprovedOutreachNowAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const outreachId = Number(formData.get("outreach_id"));
  if (!Number.isInteger(outreachId) || outreachId <= 0) throw new Error("Invalid outreach id.");
  const db = createAdminClient();
  const { data: outreach, error } = await db.from("marketing_outreach").select("id,channel,send_status").eq("id", outreachId).single();
  if (error || !outreach) throw new Error("Outreach not found.");
  if (outreach.channel !== "email") throw new Error("Send now is only wired for email in this phase.");
  if (outreach.send_status !== "approved" && outreach.send_status !== "failed") throw new Error("Outreach must be approved before Send now.");

  const idempotencyKey = `outreach-${outreachId}-email`;
  const { data: job, error: jobError } = await db.from("marketing_channel_jobs").select("id").eq("idempotency_key", idempotencyKey).single();
  if (jobError || !job) throw new Error("Approved email channel job not found.");
  await executeMarketingEmailJob(job.id);
  revalidatePath("/admin/marketing/outreach");
}
