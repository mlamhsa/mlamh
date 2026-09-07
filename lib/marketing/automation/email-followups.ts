import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";

const FOLLOW_UP_DELAY_MS = 72 * 60 * 60 * 1000;

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function arabicText(value: string) {
  return /[\u0600-\u06ff]/u.test(value);
}

export function isEmailFollowUpDue({
  publishedAt,
  now = new Date(),
  followUpNeeded,
}: {
  publishedAt: string;
  now?: Date;
  followUpNeeded: boolean;
}) {
  if (!followUpNeeded) return false;
  const sentMs = Date.parse(publishedAt);
  return Number.isFinite(sentMs) && now.getTime() - sentMs >= FOLLOW_UP_DELAY_MS;
}

export function buildEmailFollowUpDraft(previousContent: string) {
  if (arabicText(previousContent)) {
    return "مرحبًا،\n\nمتابعة سريعة بخصوص رسالتنا السابقة. هل لديكم تحديث أو أي تفاصيل إضافية حتى نكمل معكم الخطوة التالية؟\n\nفريق ملامح | الشراكات والكاستنج";
  }
  return "Hello,\n\nA quick follow-up on our previous message. Do you have any update or additional details so we can continue with the next step?\n\nMLAMH Team | Partnerships & Casting";
}

export async function prepareDueEmailFollowUps({ now = new Date(), limit = 20 }: { now?: Date; limit?: number } = {}) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - FOLLOW_UP_DELAY_MS).toISOString();
  const safeLimit = Math.max(1, Math.min(limit, 50));

  const { data: jobs, error } = await db.from("marketing_channel_jobs")
    .select("id,task_id,payload,published_at,result")
    .eq("channel", "email")
    .eq("status", "published")
    .lte("published_at", cutoff)
    .order("published_at", { ascending: false })
    .limit(safeLimit);
  if (error) throw new Error(`[email_followups.jobs] ${error.message}`);

  let created = 0;
  let skipped = 0;
  const taskIds: number[] = [];

  for (const job of jobs ?? []) {
    const payload = record(job.payload);
    if (payload.kind !== "external_reply" || payload.follow_up_needed !== true || !job.task_id || !job.published_at) {
      skipped += 1;
      continue;
    }

    const recipient = record(payload.recipient);
    const recipientEmail = text(recipient.email);
    const previousContent = text(payload.content) ?? text(payload.text);
    const subject = text(payload.subject);
    if (!recipientEmail || !previousContent || !subject || !isEmailFollowUpDue({ publishedAt: job.published_at, now, followUpNeeded: true })) {
      skipped += 1;
      continue;
    }

    const { data: sourceTask } = await db.from("marketing_tasks")
      .select("id,lead_id,conversation_id")
      .eq("id", job.task_id)
      .maybeSingle();
    if (!sourceTask?.conversation_id) {
      skipped += 1;
      continue;
    }

    const { count: newerInbound, error: inboundError } = await db.from("marketing_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", sourceTask.conversation_id)
      .eq("direction", "inbound")
      .gt("received_at", job.published_at);
    if (inboundError) throw new Error(`[email_followups.inbound] ${inboundError.message}`);
    if ((newerInbound ?? 0) > 0) {
      skipped += 1;
      continue;
    }

    const idempotencyKey = `email-follow-up:job:${job.id}:1`;
    const { data: existing } = await db.from("marketing_tasks")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing?.id) {
      skipped += 1;
      continue;
    }

    const followUpDraft = buildEmailFollowUpDraft(previousContent);
    const task = await createMarketingTask({
      agentId: "dana",
      taskType: "external_message",
      title: `Email follow-up · ${subject}`,
      objective: "Review this single governed follow-up before external delivery. It was created only because the prior client email requested follow-up, at least 72 hours passed, and no newer inbound reply was recorded. Do not add pricing, commitments, guarantees, or new claims.",
      priority: "high",
      channel: "email",
      approvalLevel: "approval_required",
      source: "email_follow_up_scheduler",
      leadId: sourceTask.lead_id ?? null,
      conversationId: sourceTask.conversation_id,
      input: {
        kind: "external_reply",
        recipient: {
          name: text(recipient.name),
          email: recipientEmail,
        },
        content: followUpDraft,
        channel_drafts: { email: followUpDraft },
        delivery_channels: ["email"],
        subject,
        source_channel: "email",
        source_reference: text(payload.source_reference) ?? `email-job:${job.id}`,
        reply_to_zoho_message_id: text(payload.reply_to_zoho_message_id),
        client_language: arabicText(previousContent) ? "ar" : "en",
        sender_identity: "MLAMH Team | Partnerships & Casting",
        follow_up_attempt: 1,
        follow_up_source_job_id: job.id,
        follow_up_needed: false,
        external_execution: false,
      },
      metadata: {
        email_follow_up: true,
        source_job_id: job.id,
        source_task_id: job.task_id,
        follow_up_attempt: 1,
        follow_up_delay_hours: 72,
        no_newer_inbound_verified: true,
      },
      idempotencyKey,
      maxRetries: 0,
    });

    await db.from("marketing_events").insert({
      event_name: "email_follow_up_due",
      source: "marketing_hub",
      medium: "email",
      entity_type: "marketing_conversation",
      entity_id: String(sourceTask.conversation_id),
      metadata: {
        source_job_id: job.id,
        source_task_id: job.task_id,
        follow_up_task_id: task.id,
        attempt: 1,
        approval_required: true,
      },
      occurred_at: now.toISOString(),
    });

    created += 1;
    taskIds.push(task.id as number);
  }

  return { enabled: true, created, skipped, taskIds, delayHours: 72, maxAttempts: 1 };
}
