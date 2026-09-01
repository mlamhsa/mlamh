import { createAdminClient } from "@/lib/supabase/admin";

import {
  DANA_AGENT,
  approvalLevelForExternalDraft,
  buildCommercialDemandKey,
  buildDanaBrief,
  buildExternalDraft,
  classifyCommercialInquiry,
  normalizeEmail,
  normalizePhone,
  rankEligibleTalents,
  type CommercialInquiry,
  type TalentCandidate,
} from "./domain";

type Db = ReturnType<typeof createAdminClient>;

type IntakeResult =
  | { status: "not_commercial"; classification: ReturnType<typeof classifyCommercialInquiry> }
  | {
      status: "prepared";
      demandKey: string;
      taskId: number;
      contactId: number;
      leadId: number;
      conversationId: number;
      briefId: number;
      shortlistStatus: "matched" | "insufficient_matches";
      draftMessageId: number;
      approvalId: number;
      deduplicated: boolean;
    };

async function recordLifecycle(
  db: Db,
  action: string,
  demandKey: string,
  entityType: string,
  entityId: string,
  result: Record<string, unknown> = {},
) {
  await Promise.all([
    db.from("marketing_events").insert({
      event_name: `dana_${action}`,
      source: "commercial_intake",
      medium: "internal",
      entity_type: entityType,
      entity_id: entityId,
      metadata: { demand_key: demandKey, agent_id: DANA_AGENT.id, ...result },
    }),
    db.from("marketing_agent_activity").insert({
      agent_id: DANA_AGENT.id,
      action,
      reason: "Dana commercial inbound workflow",
      entity_type: entityType,
      entity_id: entityId,
      channel: typeof result.source_channel === "string" ? result.source_channel : null,
      approval_status: typeof result.approval_status === "string" ? result.approval_status : null,
      result,
      metadata: { demand_key: demandKey },
    }),
  ]);
}

async function ensureDanaAgent(db: Db) {
  const { error } = await db.from("marketing_agents").upsert(
    {
      id: DANA_AGENT.id,
      name: DANA_AGENT.name,
      role: DANA_AGENT.role,
      status: "idle",
      autonomy_level: "approval_required",
      assigned_channels: [...DANA_AGENT.assignedChannels],
      is_active: true,
      metadata: {
        external_identity: DANA_AGENT.externalIdentity,
        internal_auto_actions: ["classification", "resolve", "brief", "matching", "draft", "followup_preparation"],
        external_reply_policy: "approval_required",
        commercial_commitment_policy: "ceo_only",
      },
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`[Dana.ensureAgent] ${error.message}`);
}

async function acquireWorkflow(db: Db, input: CommercialInquiry, demandKey: string) {
  const idempotencyKey = `dana:commercial-intake:${demandKey}`;
  const payload = {
    agent_id: DANA_AGENT.id,
    task_type: "commercial_intake",
    title: `Commercial inbound · ${input.sourceChannel}`,
    objective: "Resolve one commercial demand into a reviewable Dana brief, shortlist and external draft.",
    priority: "high",
    status: "running",
    channel: input.sourceChannel,
    source: "commercial_intake",
    input: {
      demand_key: demandKey,
      source_channel: input.sourceChannel,
      source_references: [input.sourceReference],
    },
    output: {},
    approval_level: "auto",
    approval_status: "not_required",
    idempotency_key: idempotencyKey,
  };

  const { data: inserted, error } = await db.from("marketing_tasks").insert(payload).select("id,input,output").maybeSingle();
  if (!error && inserted) return { task: inserted, deduplicated: false };

  const { data: existing, error: existingError } = await db
    .from("marketing_tasks")
    .select("id,input,output")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingError || !existing) throw new Error(`[Dana.acquireWorkflow] ${error?.message ?? existingError?.message ?? "workflow unavailable"}`);
  return { task: existing, deduplicated: true };
}

async function resolveContact(db: Db, input: CommercialInquiry) {
  const email = normalizeEmail(input.senderEmail);
  const phone = normalizePhone(input.senderPhone);

  if (email) {
    const { data } = await db.from("marketing_contacts").select("id").ilike("email", email).order("id", { ascending: true }).limit(1).maybeSingle();
    if (data?.id) return Number(data.id);
  }
  if (phone) {
    const { data } = await db.from("marketing_contacts").select("id").eq("phone", phone).order("id", { ascending: true }).limit(1).maybeSingle();
    if (data?.id) return Number(data.id);
  }

  const { data, error } = await db.from("marketing_contacts").insert({
    organization_name: input.organizationName ?? null,
    contact_name: input.senderName,
    email: email || null,
    phone: phone || null,
    metadata: { first_source_channel: input.sourceChannel, first_source_reference: input.sourceReference },
  }).select("id").single();
  if (error) throw new Error(`[Dana.resolveContact] ${error.message}`);
  return Number(data.id);
}

async function resolveLead(db: Db, input: CommercialInquiry, demandKey: string, contactId: number, classification: ReturnType<typeof classifyCommercialInquiry>) {
  const { data: existing } = await db.from("marketing_leads").select("id").contains("metadata", { demand_key: demandKey }).limit(1).maybeSingle();
  if (existing?.id) return Number(existing.id);

  const brief = buildDanaBrief(input);
  const organization = input.organizationName?.trim() || input.senderName.trim() || "Inbound client";
  const { data, error } = await db.from("marketing_leads").insert({
    organization,
    contact_id: contactId,
    source: "commercial_intake",
    channel: input.sourceChannel,
    owner: DANA_AGENT.id,
    stage: "qualified",
    lead_score: Math.round(classification.confidence * 100),
    demand_signal: classification.intent,
    opportunity_type: brief.talentType,
    city: brief.city,
    brief_status: "partial",
    tags: ["commercial_inbound", `source:${input.sourceChannel}`],
    metadata: { demand_key: demandKey, source_references: [input.sourceReference], classification },
  }).select("id").single();
  if (error) throw new Error(`[Dana.resolveLead] ${error.message}`);
  return Number(data.id);
}

async function resolveConversation(db: Db, input: CommercialInquiry, demandKey: string, contactId: number, leadId: number) {
  const externalThreadId = `demand:${demandKey}`;
  const { data: existing } = await db
    .from("marketing_conversations")
    .select("id,metadata")
    .eq("channel", input.sourceChannel)
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();
  if (existing?.id) return Number(existing.id);

  const { data, error } = await db.from("marketing_conversations").insert({
    channel: input.sourceChannel,
    external_thread_id: externalThreadId,
    contact_id: contactId,
    lead_id: leadId,
    assigned_agent_id: DANA_AGENT.id,
    status: "open",
    stage: "qualified",
    priority: "high",
    tags: ["commercial_inbound", "dana"],
    metadata: { demand_key: demandKey, source_references: [input.sourceReference], source_of_truth: input.sourceChannel },
  }).select("id").single();
  if (error) throw new Error(`[Dana.resolveConversation] ${error.message}`);
  return Number(data.id);
}

async function resolveBrief(db: Db, input: CommercialInquiry, demandKey: string, contactId: number, leadId: number, conversationId: number) {
  const { data: existing } = await db.from("marketing_briefs").select("id,status,requirements,talent_type,talent_count,city").eq("lead_id", leadId).order("id", { ascending: true }).limit(1).maybeSingle();
  if (existing?.id) return { id: Number(existing.id), domain: buildDanaBrief(input) };

  const brief = buildDanaBrief(input);
  const { data, error } = await db.from("marketing_briefs").insert({
    project_type: brief.projectType,
    talent_type: brief.talentType,
    talent_count: brief.talentCount,
    city: brief.city,
    requirements: brief.requirements,
    compensation: brief.compensation,
    contact_id: contactId,
    source: input.sourceChannel,
    lead_id: leadId,
    conversation_id: conversationId,
    status: brief.status,
    metadata: { demand_key: demandKey, source_references: [input.sourceReference], generated_by: DANA_AGENT.id },
  }).select("id").single();
  if (error) throw new Error(`[Dana.resolveBrief] ${error.message}`);

  await db.from("marketing_leads").update({ brief_status: brief.status }).eq("id", leadId);
  return { id: Number(data.id), domain: brief };
}

async function loadEligibleTalents(db: Db, talentType: "actor" | "model" | "mixed" | null) {
  if (!talentType) return [] as TalentCandidate[];
  let query = db
    .from("talents")
    .select("id,display_name_en,display_name_ar,name_en,name_ar,primary_role,category_en,category_ar,city_en,city_ar,gender,skills,modeling_types,availability_status,published,status")
    .eq("published", true)
    .in("status", ["approved", "active"])
    .limit(100);
  if (talentType !== "mixed") query = query.or(`primary_role.eq.${talentType},category_en.ilike.${talentType}`);
  const { data, error } = await query;
  if (error) throw new Error(`[Dana.loadTalents] ${error.message}`);
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    name: row.display_name_en || row.display_name_ar || row.name_en || row.name_ar || `Talent ${row.id}`,
    primaryRole: row.primary_role,
    categoryEn: row.category_en,
    categoryAr: row.category_ar,
    cityEn: row.city_en,
    cityAr: row.city_ar,
    gender: row.gender,
    skills: Array.isArray(row.skills) ? row.skills : null,
    modelingTypes: Array.isArray(row.modeling_types) ? row.modeling_types : null,
    availabilityStatus: row.availability_status,
    published: Boolean(row.published),
    status: row.status,
  }));
}

async function resolveDraftAndApproval(
  db: Db,
  input: CommercialInquiry,
  demandKey: string,
  taskId: number,
  conversationId: number,
  brief: ReturnType<typeof buildDanaBrief>,
  shortlist: ReturnType<typeof rankEligibleTalents>,
) {
  const { data: existingDraft } = await db
    .from("marketing_messages")
    .select("id,content")
    .eq("conversation_id", conversationId)
    .eq("direction", "outbound")
    .eq("delivery_status", "draft")
    .contains("metadata", { demand_key: demandKey, prepared_by: DANA_AGENT.id })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const draft = buildExternalDraft(input, brief, shortlist);
  let draftMessageId = existingDraft?.id ? Number(existingDraft.id) : 0;
  if (!draftMessageId) {
    const { data, error } = await db.from("marketing_messages").insert({
      conversation_id: conversationId,
      direction: "outbound",
      sender: DANA_AGENT.externalIdentity,
      content: draft.content,
      message_type: "text",
      delivery_status: "draft",
      metadata: {
        demand_key: demandKey,
        prepared_by: DANA_AGENT.id,
        external_identity: DANA_AGENT.externalIdentity,
        external_execution: false,
        shortlist,
      },
    }).select("id").single();
    if (error) throw new Error(`[Dana.prepareDraft] ${error.message}`);
    draftMessageId = Number(data.id);
  }

  const { data: existingApproval } = await db.from("marketing_approvals").select("id").eq("task_id", taskId).order("id", { ascending: true }).limit(1).maybeSingle();
  let approvalId = existingApproval?.id ? Number(existingApproval.id) : 0;
  if (!approvalId) {
    const approvalLevel = approvalLevelForExternalDraft(draft.content);
    const { data, error } = await db.from("marketing_approvals").insert({
      task_id: taskId,
      requested_by_agent_id: DANA_AGENT.id,
      approval_level: approvalLevel,
      status: "pending",
      reason: "External client reply requires review before any execution.",
      proposed_action: {
        kind: "external_reply",
        demand_key: demandKey,
        draft_message_id: draftMessageId,
        source_channel: input.sourceChannel,
        source_reference: input.sourceReference,
        recipient: { name: input.senderName, email: normalizeEmail(input.senderEmail) || null, phone: normalizePhone(input.senderPhone) || null },
        sender_identity: DANA_AGENT.externalIdentity,
        content: draft.content,
        external_execution: false,
      },
      channel: input.sourceChannel,
      preview: { content: draft.content, shortlist_status: shortlist.status, brief_status: brief.status },
      risk_level: approvalLevel === "ceo_only" ? "high" : "medium",
    }).select("id").single();
    if (error) throw new Error(`[Dana.requestApproval] ${error.message}`);
    approvalId = Number(data.id);
  }
  return { draftMessageId, approvalId };
}

export async function processCommercialInquiry(input: CommercialInquiry): Promise<IntakeResult> {
  const classification = classifyCommercialInquiry(input);
  if (!classification.commercial) return { status: "not_commercial", classification };

  const db = createAdminClient();
  await ensureDanaAgent(db);
  const demandKey = buildCommercialDemandKey(input, classification);
  const { task, deduplicated } = await acquireWorkflow(db, input, demandKey);
  const taskId = Number(task.id);
  await recordLifecycle(db, "classified", demandKey, "marketing_task", String(taskId), { source_channel: input.sourceChannel, classification });

  const contactId = await resolveContact(db, input);
  const leadId = await resolveLead(db, input, demandKey, contactId, classification);
  const conversationId = await resolveConversation(db, input, demandKey, contactId, leadId);
  await recordLifecycle(db, deduplicated ? "deduplicated" : "resolved", demandKey, "marketing_lead", String(leadId), { source_channel: input.sourceChannel, contact_id: contactId, conversation_id: conversationId });
  await recordLifecycle(db, "lead", demandKey, "marketing_lead", String(leadId), { source_channel: input.sourceChannel });

  const { id: briefId, domain: brief } = await resolveBrief(db, input, demandKey, contactId, leadId, conversationId);
  await recordLifecycle(db, "brief", demandKey, "marketing_brief", String(briefId), { source_channel: input.sourceChannel, brief_status: brief.status });

  const candidates = await loadEligibleTalents(db, brief.talentType);
  const shortlist = rankEligibleTalents(brief, candidates, Math.max(1, Math.min(brief.talentCount ?? 1, 3)));
  await recordLifecycle(db, "matched", demandKey, "marketing_brief", String(briefId), { source_channel: input.sourceChannel, shortlist_status: shortlist.status, matches: shortlist.matches });

  const { draftMessageId, approvalId } = await resolveDraftAndApproval(db, input, demandKey, taskId, conversationId, brief, shortlist);
  await recordLifecycle(db, "draft_prepared", demandKey, "marketing_message", String(draftMessageId), { source_channel: input.sourceChannel, external_execution: false });
  await recordLifecycle(db, "approval_requested", demandKey, "marketing_approval", String(approvalId), { source_channel: input.sourceChannel, approval_status: "pending", external_execution: false });

  await db.from("marketing_tasks").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    output: { demand_key: demandKey, contact_id: contactId, lead_id: leadId, conversation_id: conversationId, brief_id: briefId, shortlist, draft_message_id: draftMessageId, approval_id: approvalId, external_execution: false },
  }).eq("id", taskId);

  return {
    status: "prepared",
    demandKey,
    taskId,
    contactId,
    leadId,
    conversationId,
    briefId,
    shortlistStatus: shortlist.status,
    draftMessageId,
    approvalId,
    deduplicated,
  };
}
