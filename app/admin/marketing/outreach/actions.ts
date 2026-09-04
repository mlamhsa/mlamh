"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { executeMarketingEmailJob } from "@/lib/marketing/channels/email-executor";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

function linkedinProfileUrl(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (url.protocol !== "https:" || host !== "linkedin.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function createMarketingOutreachAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const leadId = Number(formData.get("lead_id"));
  if (!Number.isInteger(leadId) || leadId <= 0) throw new Error("A valid lead is required.");
  const channel = String(formData.get("channel") ?? "").trim();
  if (!channel) throw new Error("Channel is required.");
  const message = String(formData.get("message") ?? "").trim();
  if (!message) throw new Error("Message preview is required.");
  const subject = String(formData.get("subject") ?? "").trim();
  const profileUrl = linkedinProfileUrl(formData.get("profile_url"));
  const senderProfile = String(formData.get("sender_profile") ?? "").trim() || "sawsan";

  if (channel === "linkedin" && !profileUrl) {
    throw new Error("A valid https://linkedin.com profile URL is required for LinkedIn outreach.");
  }

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
    linkedin_profile_url: profileUrl,
    sender_profile: channel === "linkedin" ? senderProfile : null,
  };
  const { data: outreach, error } = await db.from("marketing_outreach").insert({
    lead_id: leadId,
    template_key: String(formData.get("template_key") ?? "").trim() || null,
    personalization,
    metadata: channel === "linkedin" ? {
      execution_mode: "manual_linkedin",
      sender_profile: senderProfile,
      automated_send: false,
    } : null,
    channel,
    send_status: "waiting_approval",
    reply_status: "none",
  }).select("id").single();
  if (error) throw new Error(`[create outreach] ${error.message}`);

  const task = await createMarketingTask({
    agentId: "layan",
    taskType: "first_outreach",
    title: `Approve first outreach to lead #${leadId}`,
    objective: channel === "linkedin"
      ? "Review the LinkedIn outreach before Sawsan sends it manually from the approved sender profile."
      : "Review the first external B2B outreach before sending.",
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
      linkedin_profile_url: profileUrl,
      sender_profile: channel === "linkedin" ? senderProfile : null,
      execution_mode: channel === "linkedin" ? "manual_linkedin" : null,
    },
  });

  const { data: approval } = await db.from("marketing_approvals").select("id").eq("task_id", task.id).eq("status", "pending").maybeSingle();
  if (approval) await db.from("marketing_outreach").update({ approval_id: approval.id, updated_at: new Date().toISOString() }).eq("id", outreach.id);

  revalidatePath("/admin/marketing/outreach");
  revalidatePath("/admin/marketing/approvals");
}

export async function markLinkedInOutreachSentAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const outreachId = Number(formData.get("outreach_id"));
  if (!Number.isInteger(outreachId) || outreachId <= 0) throw new Error("Invalid outreach id.");

  const db = createAdminClient();
  const { data: outreach, error } = await db
    .from("marketing_outreach")
    .select("id,lead_id,channel,send_status,personalization,metadata")
    .eq("id", outreachId)
    .single();
  if (error || !outreach) throw new Error("Outreach not found.");
  if (outreach.channel !== "linkedin") throw new Error("This action is only available for LinkedIn outreach.");
  if (!(["approved", "scheduled"] as string[]).includes(outreach.send_status)) {
    throw new Error("LinkedIn outreach must be approved before it can be marked as sent.");
  }

  const now = new Date();
  const followUpAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const metadata = outreach.metadata && typeof outreach.metadata === "object" && !Array.isArray(outreach.metadata)
    ? outreach.metadata as Record<string, unknown>
    : {};
  const personalization = outreach.personalization && typeof outreach.personalization === "object" && !Array.isArray(outreach.personalization)
    ? outreach.personalization as Record<string, unknown>
    : {};
  const senderProfile = typeof personalization.sender_profile === "string" && personalization.sender_profile.trim()
    ? personalization.sender_profile.trim()
    : "sawsan";

  const { error: updateError } = await db.from("marketing_outreach").update({
    send_status: "sent",
    next_follow_up_at: followUpAt.toISOString(),
    metadata: {
      ...metadata,
      execution_mode: "manual_linkedin",
      automated_send: false,
      sent_manually_at: now.toISOString(),
      sender_profile: senderProfile,
    },
    updated_at: now.toISOString(),
  }).eq("id", outreachId);
  if (updateError) throw new Error(`[mark LinkedIn sent] ${updateError.message}`);

  const { error: followUpError } = await db.from("marketing_followups").insert({
    lead_id: outreach.lead_id,
    follow_up_at: followUpAt.toISOString(),
    reason: "LinkedIn follow-up #1 after approved manual outreach",
    channel: "linkedin",
    owner: senderProfile,
    sequence_step: 1,
    status: "scheduled",
    next_action: "Review reply status; if no reply, prepare LinkedIn follow-up #1.",
  });
  if (followUpError) throw new Error(`[schedule LinkedIn follow-up] ${followUpError.message}`);

  await db.from("marketing_leads").update({
    stage: "contacted",
    last_contact_at: now.toISOString(),
    next_action_at: followUpAt.toISOString(),
  }).eq("id", outreach.lead_id);

  revalidatePath("/admin/marketing/outreach");
  revalidatePath("/admin/marketing/follow-ups");
  revalidatePath("/admin/marketing/leads");
}

export async function recordLinkedInReplyAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const outreachId = Number(formData.get("outreach_id"));
  if (!Number.isInteger(outreachId) || outreachId <= 0) throw new Error("Invalid outreach id.");

  const outcome = String(formData.get("outcome") ?? "").trim();
  if (!["interested", "not_now", "not_interested"].includes(outcome)) {
    throw new Error("Invalid LinkedIn reply outcome.");
  }

  const db = createAdminClient();
  const { data: outreach, error } = await db
    .from("marketing_outreach")
    .select("id,lead_id,channel,send_status,reply_status,metadata")
    .eq("id", outreachId)
    .single();
  if (error || !outreach) throw new Error("Outreach not found.");
  if (outreach.channel !== "linkedin") throw new Error("This action is only available for LinkedIn outreach.");
  if (outreach.send_status !== "sent") throw new Error("LinkedIn outreach must be sent before recording a reply.");

  const now = new Date();
  const metadata = outreach.metadata && typeof outreach.metadata === "object" && !Array.isArray(outreach.metadata)
    ? outreach.metadata as Record<string, unknown>
    : {};
  const replyStatus = outcome === "interested" ? "qualified" : outcome === "not_interested" ? "not_interested" : "replied";

  const { error: outreachError } = await db.from("marketing_outreach").update({
    reply_status: replyStatus,
    outcome,
    next_follow_up_at: null,
    metadata: {
      ...metadata,
      reply_recorded_manually: true,
      reply_recorded_at: now.toISOString(),
    },
    updated_at: now.toISOString(),
  }).eq("id", outreachId);
  if (outreachError) throw new Error(`[record LinkedIn reply] ${outreachError.message}`);

  const { error: cancelError } = await db.from("marketing_followups").update({
    status: "cancelled",
    updated_at: now.toISOString(),
    next_action: "Cancelled because a LinkedIn reply was recorded.",
  }).eq("lead_id", outreach.lead_id).eq("channel", "linkedin").in("status", ["scheduled", "due"]);
  if (cancelError) throw new Error(`[cancel LinkedIn follow-ups] ${cancelError.message}`);

  if (outcome === "interested") {
    const { error: leadError } = await db.from("marketing_leads").update({
      stage: "qualified",
      brief_status: "requested",
      next_action_at: now.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", outreach.lead_id);
    if (leadError) throw new Error(`[qualify LinkedIn lead] ${leadError.message}`);
  } else if (outcome === "not_now") {
    const followUpAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const { error: leadError } = await db.from("marketing_leads").update({
      stage: "replied",
      next_action_at: followUpAt.toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", outreach.lead_id);
    if (leadError) throw new Error(`[defer LinkedIn lead] ${leadError.message}`);

    const { error: followUpError } = await db.from("marketing_followups").insert({
      lead_id: outreach.lead_id,
      follow_up_at: followUpAt.toISOString(),
      reason: "LinkedIn contact replied: not now",
      channel: "linkedin",
      owner: typeof metadata.sender_profile === "string" ? metadata.sender_profile : "sawsan",
      sequence_step: 2,
      status: "scheduled",
      previous_contact_at: now.toISOString(),
      next_action: "Revisit the conversation after the contact asked for more time.",
      metadata: { source_outreach_id: outreachId, reply_outcome: outcome },
    });
    if (followUpError) throw new Error(`[defer LinkedIn follow-up] ${followUpError.message}`);
  } else {
    const { error: leadError } = await db.from("marketing_leads").update({
      stage: "lost",
      next_action_at: null,
      updated_at: now.toISOString(),
    }).eq("id", outreach.lead_id);
    if (leadError) throw new Error(`[close LinkedIn lead] ${leadError.message}`);
  }

  revalidatePath("/admin/marketing/outreach");
  revalidatePath("/admin/marketing/follow-ups");
  revalidatePath("/admin/marketing/leads");
  revalidatePath("/admin/marketing/briefs");
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
