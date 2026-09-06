import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";

type SourceTask = {
  id: number;
  agent_id: string | null;
  task_type: string;
  title: string;
};

type SocialTarget = "instagram" | "facebook";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\\n/g, "\n")
    : null;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function contactRole(metadata: unknown) {
  const value = record(metadata);
  return text(value.job_title) ?? text(value.role) ?? text(value.title);
}

function validLinkedInProfile(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && host === "linkedin.com" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function ensureCreativeProductionTask({
  task,
  contentId,
  title,
  caption,
  cta,
  target,
}: {
  task: SourceTask;
  contentId: number;
  title: string;
  caption: string;
  cta: string | null;
  target: SocialTarget;
}) {
  const db = createAdminClient();
  const idempotencyKey = `creative-production-content-${contentId}-${target}`;
  const { data: existingTask } = await db
    .from("marketing_tasks")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingTask?.id) return false;

  await createMarketingTask({
    agentId: "sarah",
    taskType: "creative_brief",
    title: `Creative production: ${title}`,
    objective: `Prepare a production-ready ${target} visual for this MLAMH social post. The visual must follow MLAMH brand identity and must be completed before any social publishing approval is created.`,
    channel: target,
    approvalLevel: "auto",
    contentId,
    parentTaskId: task.id,
    source: "autonomous_materializer",
    input: {
      content_id: contentId,
      target,
      caption,
      cta,
      required_asset: true,
      brand: {
        primary: "#D4A017",
        dark: "#2E2E2E",
        light: "#F5F1E8",
        accent: "#8C6A2D",
      },
      publishing_gate: "creative_required",
    },
    metadata: {
      source_task_id: task.id,
      autonomous: true,
      creative_gate: true,
    },
    idempotencyKey,
  });

  return true;
}

async function materializeContentStrategy(task: SourceTask, output: Record<string, unknown>) {
  const items = Array.isArray(output.content_items) ? output.content_items.slice(0, 3) : [];
  if (!items.length) {
    return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0, creativeTasksCreated: 0 };
  }

  const db = createAdminClient();
  const { data: existingRows } = await db
    .from("marketing_content")
    .select("id,title,caption,cta,channel,status")
    .contains("metadata", { source_task_id: task.id });

  let contentRows = existingRows ?? [];
  let contentCreated = 0;
  if (!contentRows.length) {
    const rows = items.flatMap((raw, index) => {
      const item = record(raw);
      const title = text(item.title);
      const caption = text(item.caption);
      const channel = text(item.channel);
      if (!title || !caption || (channel !== "instagram" && channel !== "facebook")) return [];

      const target = channel as SocialTarget;
      const rawCta = text(item.cta);
      const cta = target === "instagram"
        ? (rawCta?.replace(/https?:\/\/\S+|(?:www\.)?mlamh\.net\/?/gi, "").trim() || "سجّل من الرابط في البايو")
        : rawCta;

      return [{
        title,
        hook: text(item.hook),
        caption,
        body: text(item.body),
        cta,
        content_type: text(item.content_type) ?? "feed",
        channel: target,
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
          creative_required: true,
        },
      }];
    });

    if (!rows.length) {
      return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0, creativeTasksCreated: 0 };
    }

    const { data: inserted, error } = await db
      .from("marketing_content")
      .insert(rows)
      .select("id,title,caption,cta,channel,status");
    if (error) throw new Error(`[marketing_materialize.content] ${error.message}`);
    contentRows = inserted ?? [];
    contentCreated = contentRows.length;
  }

  let creativeTasksCreated = 0;
  for (const content of contentRows) {
    const target = content.channel as SocialTarget;
    if (target !== "instagram" && target !== "facebook") continue;

    const created = await ensureCreativeProductionTask({
      task,
      contentId: content.id,
      title: content.title ?? `content #${content.id}`,
      caption: content.caption ?? "",
      cta: content.cta ?? null,
      target,
    });
    if (created) creativeTasksCreated += 1;

    if (content.status !== "draft") {
      await db
        .from("marketing_content")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", content.id);
    }
  }

  return {
    contentCreated,
    outreachCreated: 0,
    approvalsCreated: 0,
    creativeTasksCreated,
  };
}

async function ensureOutreachApproval({
  task,
  leadId,
  organization,
  recipientEmail,
  subject,
  message,
  outreachId,
}: {
  task: SourceTask;
  leadId: number;
  organization: string;
  recipientEmail: string;
  subject: string;
  message: string;
  outreachId: number;
}) {
  const db = createAdminClient();
  const { data: existingTask } = await db
    .from("marketing_tasks")
    .select("id")
    .eq("idempotency_key", `outreach:${outreachId}:first_email`)
    .maybeSingle();

  let approvalTaskId = existingTask?.id ?? null;
  if (!approvalTaskId) {
    const approvalTask = await createMarketingTask({
      agentId: "layan",
      taskType: "first_outreach",
      title: `First outreach · ${organization}`,
      objective: "Review the AI-prepared first publisher/client outreach before external delivery.",
      priority: "high",
      channel: "email",
      source: "autonomous_materializer",
      leadId,
      input: {
        outreach_id: outreachId,
        recipient_email: recipientEmail,
        subject,
        message,
        source_task_id: task.id,
      },
      metadata: { source_task_id: task.id, autonomous: true },
      idempotencyKey: `outreach:${outreachId}:first_email`,
    });
    approvalTaskId = approvalTask.id;
  }

  const { data: approval } = await db
    .from("marketing_approvals")
    .select("id")
    .eq("task_id", approvalTaskId)
    .maybeSingle();

  await db
    .from("marketing_outreach")
    .update({
      send_status: approval?.id ? "waiting_approval" : "draft",
      approval_id: approval?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", outreachId);

  return Boolean(approval?.id);
}

async function ensureLinkedInOutreachApproval({
  task,
  leadId,
  organization,
  profileUrl,
  message,
  outreachId,
  contactName,
  role,
}: {
  task: SourceTask;
  leadId: number;
  organization: string;
  profileUrl: string;
  message: string;
  outreachId: number;
  contactName: string | null;
  role: string | null;
}) {
  const db = createAdminClient();
  const idempotencyKey = `outreach:${outreachId}:first_linkedin`;
  const { data: existingTask } = await db.from("marketing_tasks").select("id").eq("idempotency_key", idempotencyKey).maybeSingle();
  let approvalTaskId = existingTask?.id ?? null;

  if (!approvalTaskId) {
    const approvalTask = await createMarketingTask({
      agentId: "layan",
      taskType: "first_outreach",
      title: `LinkedIn outreach · ${organization}`,
      objective: "Review the AI-prepared LinkedIn first-touch message before Sawsan sends it manually from her approved LinkedIn profile.",
      priority: "high",
      channel: "linkedin",
      approvalLevel: "approval_required",
      source: "autonomous_materializer",
      leadId,
      input: {
        outreach_id: outreachId,
        lead_id: leadId,
        channel: "linkedin",
        message,
        linkedin_profile_url: profileUrl,
        sender_profile: "sawsan",
        sender_profile_name: "Sawsan Ahdadi",
        sender_role: "Business Development",
        execution_mode: "manual_linkedin",
        contact_name: contactName,
        contact_role: role,
        source_task_id: task.id,
      },
      metadata: { source_task_id: task.id, autonomous: true, execution_mode: "manual_linkedin", automated_send: false },
      idempotencyKey,
    });
    approvalTaskId = approvalTask.id;
  }

  const { data: approval } = await db.from("marketing_approvals").select("id").eq("task_id", approvalTaskId).maybeSingle();
  await db.from("marketing_outreach").update({
    send_status: approval?.id ? "waiting_approval" : "draft",
    approval_id: approval?.id ?? null,
    updated_at: new Date().toISOString(),
  }).eq("id", outreachId);
  return Boolean(approval?.id);
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

    const { count: suppressed } = await db
      .from("marketing_outreach")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId)
      .in("reply_status", ["not_interested", "blocked"]);
    if ((suppressed ?? 0) > 0) continue;

    const { data: contact } = await db
      .from("marketing_contacts")
      .select("email")
      .eq("id", lead.contact_id)
      .maybeSingle();
    const recipientEmail = text(contact?.email);
    if (!recipientEmail) continue;

    const { data: existing } = await db
      .from("marketing_outreach")
      .select("id,approval_id,send_status")
      .eq("lead_id", leadId)
      .eq("channel", "email")
      .in("send_status", ["draft", "waiting_approval", "approved", "scheduled", "sent"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.send_status === "sent" || existing?.approval_id) continue;

    let outreachId = existing?.id ?? null;
    if (!outreachId) {
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
      if (outreachError || !outreach) {
        throw new Error(`[marketing_materialize.outreach] ${outreachError?.message ?? "insert failed"}`);
      }
      outreachId = outreach.id;
      outreachCreated += 1;
    }

    const approved = await ensureOutreachApproval({
      task,
      leadId,
      organization: lead.organization,
      recipientEmail,
      subject,
      message,
      outreachId,
    });
    if (approved) approvalsCreated += 1;
  }

  return { contentCreated: 0, outreachCreated, approvalsCreated };
}

async function materializeOutreachPreparation(task: SourceTask, output: Record<string, unknown>) {
  const drafts = Array.isArray(output.outreach_drafts) ? output.outreach_drafts.slice(0, 3) : [];
  if (!drafts.length) return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };

  const db = createAdminClient();
  let outreachCreated = 0;
  let approvalsCreated = 0;

  for (const raw of drafts) {
    const draft = record(raw);
    const leadId = numberValue(draft.lead_id);
    const channel = text(draft.channel)?.toLowerCase();
    const message = text(draft.message);
    const subject = text(draft.subject);
    if (!leadId || !message || (channel !== "linkedin" && channel !== "email")) continue;

    const { data: lead } = await db.from("marketing_leads").select("id,contact_id,organization,stage").eq("id", leadId).in("stage", ["new", "qualified"]).maybeSingle();
    if (!lead?.contact_id) continue;

    const { count: suppressed } = await db.from("marketing_outreach").select("id", { count: "exact", head: true }).eq("lead_id", leadId).in("reply_status", ["not_interested", "blocked"]);
    if ((suppressed ?? 0) > 0) continue;

    const { data: contact } = await db.from("marketing_contacts").select("contact_name,email,linkedin_url,metadata").eq("id", lead.contact_id).maybeSingle();
    const contactName = text(contact?.contact_name);
    const role = contactRole(contact?.metadata);
    if (!contactName) continue;

    if (channel === "linkedin") {
      const profileUrl = validLinkedInProfile(contact?.linkedin_url);
      if (!profileUrl) continue;
      const { data: existing } = await db.from("marketing_outreach").select("id,approval_id,send_status").eq("lead_id", leadId).eq("channel", "linkedin").in("send_status", ["draft", "waiting_approval", "approved", "scheduled", "sent"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (existing?.send_status === "sent" || existing?.approval_id) continue;

      let outreachId = existing?.id ?? null;
      if (!outreachId) {
        const { data: outreach, error } = await db.from("marketing_outreach").insert({
          lead_id: leadId,
          template_key: "ai_personalized_linkedin_first_touch",
          personalization: {
            message,
            subject: null,
            recipient_email: null,
            linkedin_profile_url: profileUrl,
            sender_profile: "sawsan",
            contact_name: contactName,
            contact_role: role,
            source_task_id: task.id,
          },
          metadata: {
            source: "marketing_ai",
            source_task_id: task.id,
            autonomous: true,
            execution_mode: "manual_linkedin",
            sender_profile: "sawsan",
            automated_send: false,
          },
          channel: "linkedin",
          send_status: "draft",
          reply_status: "none",
        }).select("id").single();
        if (error || !outreach) throw new Error(`[marketing_materialize.linkedin] ${error?.message ?? "insert failed"}`);
        outreachId = outreach.id;
        outreachCreated += 1;
      }

      const approved = await ensureLinkedInOutreachApproval({ task, leadId, organization: lead.organization, profileUrl, message, outreachId, contactName, role });
      if (approved) approvalsCreated += 1;
      continue;
    }

    const recipientEmail = text(contact?.email);
    if (!recipientEmail || !subject) continue;
    const { data: existing } = await db.from("marketing_outreach").select("id,approval_id,send_status").eq("lead_id", leadId).eq("channel", "email").in("send_status", ["draft", "waiting_approval", "approved", "scheduled", "sent"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing?.send_status === "sent" || existing?.approval_id) continue;

    let outreachId = existing?.id ?? null;
    if (!outreachId) {
      const { data: outreach, error } = await db.from("marketing_outreach").insert({
        lead_id: leadId,
        template_key: "ai_personalized_first_outreach",
        personalization: { subject, message, recipient_email: recipientEmail, source_task_id: task.id },
        channel: "email",
        send_status: "draft",
        reply_status: "none",
        metadata: { source: "marketing_ai", source_task_id: task.id, autonomous: true },
      }).select("id").single();
      if (error || !outreach) throw new Error(`[marketing_materialize.email] ${error?.message ?? "insert failed"}`);
      outreachId = outreach.id;
      outreachCreated += 1;
    }

    const approved = await ensureOutreachApproval({ task, leadId, organization: lead.organization, recipientEmail, subject, message, outreachId });
    if (approved) approvalsCreated += 1;
  }

  return { contentCreated: 0, outreachCreated, approvalsCreated };
}

export async function materializeMarketingTaskOutput(task: SourceTask, output: unknown) {
  const value = record(output);
  if (task.task_type === "content_strategy") return materializeContentStrategy(task, value);
  if (task.task_type === "outbound_email") return materializeOutboundEmail(task, value);
  if (task.task_type === "outreach_preparation") return materializeOutreachPreparation(task, value);
  return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0 };
}
