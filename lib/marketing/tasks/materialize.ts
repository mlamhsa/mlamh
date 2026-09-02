import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";

type SourceTask = {
  id: number;
  agent_id: string | null;
  task_type: string;
  title: string;
};

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function materializeContentStrategy(task: SourceTask, output: Record<string, unknown>) {
  const items = Array.isArray(output.content_items) ? output.content_items.slice(0, 3) : [];
  if (!items.length) return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };

  const db = createAdminClient();
  const { count: existing } = await db
    .from("marketing_content")
    .select("id", { count: "exact", head: true })
    .contains("metadata", { source_task_id: task.id });
  if ((existing ?? 0) > 0) return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };

  const rows = items.flatMap((raw, index) => {
    const item = record(raw);
    const title = text(item.title);
    const caption = text(item.caption);
    const channel = text(item.channel);
    if (!title || !caption || (channel !== "instagram" && channel !== "facebook")) return [];

    return [{
      title,
      hook: text(item.hook),
      caption,
      body: text(item.body),
      cta: text(item.cta),
      content_type: text(item.content_type) ?? "feed",
      channel,
      objective: text(item.objective) ?? "organic_growth",
      audience: record(item.audience),
      agent_id: task.agent_id ?? "reem",
      language: "ar",
      status: "draft",
      asset_references: [],
      utm: {},
      metrics: {},
      metadata: {
        source: "marketing_ai",
        source_task_id: task.id,
        source_task_type: task.task_type,
        source_item_index: index,
        autonomous: true,
      },
    }];
  });

  if (!rows.length) return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };
  const { error } = await db.from("marketing_content").insert(rows);
  if (error) throw new Error(`[marketing_materialize.content] ${error.message}`);
  return { contentCreated: rows.length, outreachCreated: 0, approvalsCreated: 0 };
}

async function materializeOutboundEmail(task: SourceTask, output: Record<string, unknown>) {
  const drafts = Array.isArray(output.outreach_drafts) ? output.outreach_drafts.slice(0, 3) : [];
  if (!drafts.length) return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };

  const db = createAdminClient();
  let outreachCreated = 0;
  let approvalsCreated = 0;

  for (const raw of drafts) {
    const draft = record(raw);
    const leadId = numberValue(draft.lead_id);
    const subject = text(draft.subject);
    const message = text(draft.message);
    if (!leadId || !subject || !message) continue;

    const { data: lead } = await db
      .from("marketing_leads")
      .select("id,contact_id,organization,stage")
      .eq("id", leadId)
      .in("stage", ["new", "qualified"])
      .maybeSingle();
    if (!lead?.contact_id) continue;

    const { count: existing } = await db
      .from("marketing_outreach")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .eq("channel", "email")
      .in("send_status", ["draft", "waiting_approval", "approved", "scheduled", "sent"]);
    if ((existing ?? 0) > 0) continue;

    const { data: contact } = await db
      .from("marketing_contacts")
      .select("email")
      .eq("id", lead.contact_id)
      .maybeSingle();
    const recipientEmail = text(contact?.email);
    if (!recipientEmail) continue;

    const { data: outreach, error: outreachError } = await db
      .from("marketing_outreach")
      .insert({
        lead_id: leadId,
        template_key: "ai_personalized_first_outreach",
        personalization: { subject, message, source_task_id: task.id },
        channel: "email",
        send_status: "draft",
        reply_status: "none",
        metadata: { source: "marketing_ai", source_task_id: task.id, autonomous: true },
      })
      .select("id")
      .single();
    if (outreachError || !outreach) throw new Error(`[marketing_materialize.outreach] ${outreachError?.message ?? "insert failed"}`);
    outreachCreated += 1;

    const approvalTask = await createMarketingTask({
      agentId: "dana",
      taskType: "first_outreach",
      title: `First outreach · ${lead.organization}`,
      objective: "Review the AI-prepared first publisher/client outreach before external delivery.",
      priority: "high",
      channel: "email",
      source: "autonomous_materializer",
      leadId,
      input: {
        outreach_id: outreach.id,
        recipient_email: recipientEmail,
        subject,
        message,
        source_task_id: task.id,
      },
      metadata: { source_task_id: task.id, autonomous: true },
      idempotencyKey: `outreach:${outreach.id}:first_email`,
    });

    const { data: approval } = await db
      .from("marketing_approvals")
      .select("id")
      .eq("task_id", approvalTask.id)
      .maybeSingle();

    await db
      .from("marketing_outreach")
      .update({
        send_status: "waiting_approval",
        approval_id: approval?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", outreach.id);

    approvalsCreated += approval?.id ? 1 : 0;
  }

  return { contentCreated: 0, outreachCreated, approvalsCreated };
}

export async function materializeMarketingTaskOutput(task: SourceTask, output: unknown) {
  const value = record(output);
  if (task.task_type === "content_strategy") return materializeContentStrategy(task, value);
  if (task.task_type === "outbound_email") return materializeOutboundEmail(task, value);
  return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };
}
