import { createAdminClient } from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isExternalReply(action: JsonRecord) {
  return action.kind === "external_reply";
}

function isSocialPublish(taskType: string, action: JsonRecord) {
  return taskType === "social_publish" || (action.provider === "buffer" && ["instagram", "facebook"].includes(text(action.target)));
}

function isOutreach(taskType: string, action: JsonRecord) {
  return taskType === "first_outreach" || action.kind === "b2b_outreach";
}

function isStrategicDecision(taskType: string, action: JsonRecord) {
  const haystack = `${taskType} ${text(action.kind)} ${text(action.task_type)} ${text(action.title)} ${text(action.objective)}`.toLowerCase();
  return /(paid|spend|budget|pricing|discount|partnership|contract|sponsor|sponsorship)/.test(haystack);
}

function isClosedLeadStage(stage: string | null | undefined) {
  return ["contacted", "replied", "brief_received", "opportunity", "won", "lost"].includes(stage ?? "");
}

export async function getCeoDecisionQueueSnapshot() {
  const db = createAdminClient();
  const { data: approvals, error } = await db
    .from("marketing_approvals")
    .select("id,task_id,status,reason,proposed_action,preview,channel,risk_level,approval_level,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(150);

  const rows = approvals ?? [];
  const taskIds = rows.map((row) => row.task_id);
  const { data: tasks } = taskIds.length
    ? await db.from("marketing_tasks").select("id,task_type,lead_id,channel,title,input,source,status").in("id", taskIds)
    : { data: [] };
  const taskMap = new Map((tasks ?? []).map((task) => [task.id, task]));

  const leadIds = [...new Set((tasks ?? []).map((task) => task.lead_id).filter((id): id is number => typeof id === "number"))];
  const { data: leads } = leadIds.length
    ? await db.from("marketing_leads").select("id,organization,stage,contact_id,lead_score").in("id", leadIds)
    : { data: [] };
  const leadMap = new Map((leads ?? []).map((lead) => [lead.id, lead]));

  const contactIds = [...new Set((leads ?? []).map((lead) => lead.contact_id).filter((id): id is number => typeof id === "number"))];
  const { data: contacts } = contactIds.length
    ? await db.from("marketing_contacts").select("id,contact_name,email,linkedin_url,metadata").in("id", contactIds)
    : { data: [] };
  const contactMap = new Map((contacts ?? []).map((contact) => [contact.id, contact]));

  const decisions: Array<{
    id: number;
    task_id: number;
    status: string;
    reason: string | null;
    proposed_action: unknown;
    preview: unknown;
    channel: string | null;
    risk_level: string | null;
    approval_level: string;
    created_at: string;
    task: NonNullable<typeof tasks>[number];
    lead: NonNullable<typeof leads>[number] | null;
    contact: NonNullable<typeof contacts>[number] | null;
    kind: string;
    message: string;
    subject: string;
    recipient: string;
    role: string;
  }> = [];
  let blockedOutreach = 0;
  let staleOutreach = 0;
  let operationalOnly = 0;
  let testFixtures = 0;

  for (const approval of rows) {
    const task = taskMap.get(approval.task_id);
    if (!task) continue;
    if (task.source === "controlled_test_fixture") {
      testFixtures += 1;
      continue;
    }
    if (["completed", "cancelled", "failed"].includes(task.status)) {
      operationalOnly += 1;
      continue;
    }

    const action = record(approval.proposed_action);
    const input = record(task.input);
    const lead = typeof task.lead_id === "number" ? leadMap.get(task.lead_id) ?? null : null;
    const contact = lead?.contact_id ? contactMap.get(lead.contact_id) ?? null : null;
    const role = text(record(contact?.metadata).professional_role);
    const hasVerifiedChannel = Boolean(text(contact?.email) || text(contact?.linkedin_url));
    const hasNamedContact = Boolean(text(contact?.contact_name)) && !/\bteam\b|فريق/i.test(text(contact?.contact_name));
    const outreachReady = Boolean(contact && hasNamedContact && role && hasVerifiedChannel);
    const outreach = isOutreach(task.task_type, action);

    if (outreach && lead && isClosedLeadStage(lead.stage)) {
      staleOutreach += 1;
      continue;
    }
    if (outreach && !outreachReady) {
      blockedOutreach += 1;
      continue;
    }

    const externalReply = isExternalReply(action);
    const social = isSocialPublish(task.task_type, action);
    const strategic = isStrategicDecision(task.task_type, action);
    if (!outreach && !externalReply && !social && !strategic) {
      operationalOnly += 1;
      continue;
    }

    const recipient = text(record(action.recipient).email) || text(contact?.linkedin_url) || text(contact?.email);
    const message = text(input.message) || text(action.message) || text(action.content) || text(record(approval.preview).message) || text(record(approval.preview).content);
    const subject = text(input.subject) || text(action.subject);
    const kind = outreach ? "Outreach" : externalReply ? "Client Reply" : social ? "Publish" : "Strategic";
    decisions.push({ ...approval, task, lead, contact, kind, message, subject, recipient, role });
  }

  return {
    decisions,
    blockedOutreach,
    staleOutreach,
    operationalOnly,
    testFixtures,
    error: error?.message ?? null,
  };
}
