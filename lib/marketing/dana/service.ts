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
import {
  buildResolvedCommercialDemandKey,
  buildResolvedDemandLookup,
  mergeSourceReferences,
} from "./workflow";

type Db = ReturnType<typeof createAdminClient>;

type PreparedIntakeResult = {
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

type IntakeResult =
  | { status: "not_commercial"; classification: ReturnType<typeof classifyCommercialInquiry> }
  | PreparedIntakeResult;

type TaskSnapshot = {
  id: number | string;
  status?: string | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
};

const WORKFLOW_WAIT_ATTEMPTS = 120;
const WORKFLOW_WAIT_MS = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function taskIdempotencyKey(demandKey: string) {
  return `dana:commercial-intake:${demandKey}`;
}

async function acquireWorkflow(
  db: Db,
  input: CommercialInquiry,
  demandKey: string,
) {
  const idempotencyKey = taskIdempotencyKey(demandKey);
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

  const { data: inserted, error } = await db
    .from("marketing_tasks")
    .insert(payload)
    .select("id,status,input,output")
    .maybeSingle();
  if (!error && inserted) return { task: inserted as TaskSnapshot, owner: true };

  const { data: existing, error: existingError } = await db
    .from("marketing_tasks")
    .select("id,status,input,output")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existingError || !existing) {
    throw new Error(
      `[Dana.acquireWorkflow] ${error?.message ?? existingError?.message ?? "workflow unavailable"}`,
    );
  }
  return { task: existing as TaskSnapshot, owner: false };
}

async function findExistingContact(db: Db, input: CommercialInquiry) {
  const email = normalizeEmail(input.senderEmail);
  const phone = normalizePhone(input.senderPhone);

  const [emailResult, phoneResult] = await Promise.all([
    email
      ? db
          .from("marketing_contacts")
          .select("id,email,phone,metadata")
          .ilike("email", email)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    phone
      ? db
          .from("marketing_contacts")
          .select("id,email,phone,metadata")
          .eq("phone", phone)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (emailResult.error) throw new Error(`[Dana.resolveContact] ${emailResult.error.message}`);
  if (phoneResult.error) throw new Error(`[Dana.resolveContact] ${phoneResult.error.message}`);

  const emailContact = emailResult.data;
  const phoneContact = phoneResult.data;
  if (
    emailContact?.id &&
    phoneContact?.id &&
    Number(emailContact.id) !== Number(phoneContact.id)
  ) {
    throw new Error(
      "[Dana.resolveContact] email and phone resolve to different contacts; refusing unsafe merge",
    );
  }

  return emailContact ?? phoneContact ?? null;
}

async function appendContactAliases(
  db: Db,
  contact: Record<string, unknown>,
  input: CommercialInquiry,
) {
  const email = normalizeEmail(input.senderEmail);
  const phone = normalizePhone(input.senderPhone);
  const patch: Record<string, unknown> = {};
  if (email && !contact.email) patch.email = email;
  if (phone && !contact.phone) patch.phone = phone;
  const metadata = (contact.metadata ?? {}) as Record<string, unknown>;
  patch.metadata = {
    ...metadata,
    source_references: mergeSourceReferences(
      metadata.source_references,
      input.sourceReference,
    ),
  };
  const { error } = await db
    .from("marketing_contacts")
    .update(patch)
    .eq("id", Number(contact.id));
  if (error) throw new Error(`[Dana.resolveContact] ${error.message}`);
}

async function resolveContact(db: Db, input: CommercialInquiry) {
  const existing = await findExistingContact(db, input);
  if (existing?.id) {
    await appendContactAliases(db, existing as Record<string, unknown>, input);
    return Number(existing.id);
  }

  const email = normalizeEmail(input.senderEmail);
  const phone = normalizePhone(input.senderPhone);
  const { data, error } = await db
    .from("marketing_contacts")
    .insert({
      organization_name: input.organizationName ?? null,
      contact_name: input.senderName,
      email: email || null,
      phone: phone || null,
      metadata: {
        first_source_channel: input.sourceChannel,
        first_source_reference: input.sourceReference,
        source_references: [input.sourceReference],
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(`[Dana.resolveContact] ${error.message}`);
  return Number(data.id);
}

async function findWorkflowByResolvedContact(
  db: Db,
  input: CommercialInquiry,
  classification: ReturnType<typeof classifyCommercialInquiry>,
  contactId: number,
) {
  const lookup = buildResolvedDemandLookup(input, classification, contactId);
  const { data, error } = await db
    .from("marketing_tasks")
    .select("id,status,input,output")
    .eq("task_type", "commercial_intake")
    .contains("input", lookup)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[Dana.findWorkflow] ${error.message}`);
  return (data as TaskSnapshot | null) ?? null;
}

async function persistResolvedWorkflowIdentity(
  db: Db,
  task: TaskSnapshot,
  input: CommercialInquiry,
  classification: ReturnType<typeof classifyCommercialInquiry>,
  contactId: number,
  demandKey: string,
) {
  const currentInput = (task.input ?? {}) as Record<string, unknown>;
  const nextInput = {
    ...currentInput,
    ...buildResolvedDemandLookup(input, classification, contactId),
    demand_key: demandKey,
    source_references: mergeSourceReferences(
      currentInput.source_references,
      input.sourceReference,
    ),
  };
  const { error } = await db
    .from("marketing_tasks")
    .update({ input: nextInput })
    .eq("id", Number(task.id));
  if (error) throw new Error(`[Dana.persistWorkflowIdentity] ${error.message}`);
  task.input = nextInput;
}

async function resolveLead(
  db: Db,
  input: CommercialInquiry,
  demandKey: string,
  contactId: number,
  classification: ReturnType<typeof classifyCommercialInquiry>,
) {
  const { data: existing } = await db
    .from("marketing_leads")
    .select("id")
    .contains("metadata", { demand_key: demandKey })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return Number(existing.id);

  const brief = buildDanaBrief(input);
  const organization =
    input.organizationName?.trim() || input.senderName.trim() || "Inbound client";
  const { data, error } = await db
    .from("marketing_leads")
    .insert({
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
      metadata: {
        demand_key: demandKey,
        source_references: [input.sourceReference],
        classification,
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(`[Dana.resolveLead] ${error.message}`);
  return Number(data.id);
}

async function resolveConversation(
  db: Db,
  input: CommercialInquiry,
  demandKey: string,
  contactId: number,
  leadId: number,
) {
  const externalThreadId = `demand:${demandKey}`;
  const { data: existing } = await db
    .from("marketing_conversations")
    .select("id,metadata")
    .eq("channel", input.sourceChannel)
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();
  if (existing?.id) return Number(existing.id);

  const { data, error } = await db
    .from("marketing_conversations")
    .insert({
      channel: input.sourceChannel,
      external_thread_id: externalThreadId,
      contact_id: contactId,
      lead_id: leadId,
      assigned_agent_id: DANA_AGENT.id,
      status: "open",
      stage: "qualified",
      priority: "high",
      tags: ["commercial_inbound", "dana"],
      metadata: {
        demand_key: demandKey,
        source_references: [input.sourceReference],
        source_of_truth: input.sourceChannel,
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(`[Dana.resolveConversation] ${error.message}`);
  return Number(data.id);
}

async function resolveBrief(
  db: Db,
  input: CommercialInquiry,
  demandKey: string,
  contactId: number,
  leadId: number,
  conversationId: number,
) {
  const { data: existing } = await db
    .from("marketing_briefs")
    .select("id,status,requirements,talent_type,talent_count,city")
    .eq("lead_id", leadId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return { id: Number(existing.id), domain: buildDanaBrief(input) };

  const brief = buildDanaBrief(input);
  const { data, error } = await db
    .from("marketing_briefs")
    .insert({
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
      metadata: {
        demand_key: demandKey,
        source_references: [input.sourceReference],
        generated_by: DANA_AGENT.id,
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(`[Dana.resolveBrief] ${error.message}`);

  await db
    .from("marketing_leads")
    .update({ brief_status: brief.status })
    .eq("id", leadId);
  return { id: Number(data.id), domain: brief };
}

async function loadEligibleTalents(
  db: Db,
  talentType: "actor" | "model" | "mixed" | null,
) {
  if (!talentType) return [] as TalentCandidate[];
  let query = db
    .from("talents")
    .select(
      "id,display_name_en,display_name_ar,name_en,name_ar,primary_role,category_en,category_ar,city_en,city_ar,gender,skills,modeling_types,availability_status,published,status",
    )
    .eq("published", true)
    .in("status", ["approved", "active"])
    .limit(100);
  if (talentType !== "mixed") {
    query = query.or(
      `primary_role.eq.${talentType},category_en.ilike.${talentType}`,
    );
  }
  const { data, error } = await query;
  if (error) throw new Error(`[Dana.loadTalents] ${error.message}`);
  return (data ?? []).map((row) => ({
    id: Number(row.id),
    name:
      row.display_name_en ||
      row.display_name_ar ||
      row.name_en ||
      row.name_ar ||
      `Talent ${row.id}`,
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
    .contains("metadata", {
      demand_key: demandKey,
      prepared_by: DANA_AGENT.id,
    })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const draft = buildExternalDraft(input, brief, shortlist);
  let draftMessageId = existingDraft?.id ? Number(existingDraft.id) : 0;
  if (!draftMessageId) {
    const { data, error } = await db
      .from("marketing_messages")
      .insert({
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
          source_references: [input.sourceReference],
          shortlist,
        },
      })
      .select("id")
      .single();
    if (error) throw new Error(`[Dana.prepareDraft] ${error.message}`);
    draftMessageId = Number(data.id);
  }

  const { data: existingApproval } = await db
    .from("marketing_approvals")
    .select("id")
    .eq("task_id", taskId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  let approvalId = existingApproval?.id ? Number(existingApproval.id) : 0;
  if (!approvalId) {
    const approvalLevel = approvalLevelForExternalDraft(draft.content);
    const { data, error } = await db
      .from("marketing_approvals")
      .insert({
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
          source_references: [input.sourceReference],
          recipient: {
            name: input.senderName,
            email: normalizeEmail(input.senderEmail) || null,
            phone: normalizePhone(input.senderPhone) || null,
          },
          sender_identity: DANA_AGENT.externalIdentity,
          content: draft.content,
          external_execution: false,
        },
        channel: input.sourceChannel,
        preview: {
          content: draft.content,
          shortlist_status: shortlist.status,
          brief_status: brief.status,
        },
        risk_level: approvalLevel === "ceo_only" ? "high" : "medium",
      })
      .select("id")
      .single();
    if (error) throw new Error(`[Dana.requestApproval] ${error.message}`);
    approvalId = Number(data.id);
  }
  return { draftMessageId, approvalId };
}

async function readTask(db: Db, taskId: number) {
  const { data, error } = await db
    .from("marketing_tasks")
    .select("id,status,input,output")
    .eq("id", taskId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(`[Dana.waitWorkflow] ${error?.message ?? "workflow unavailable"}`);
  }
  return data as TaskSnapshot;
}

async function waitForCompletedTask(db: Db, taskId: number) {
  for (let attempt = 0; attempt < WORKFLOW_WAIT_ATTEMPTS; attempt += 1) {
    const task = await readTask(db, taskId);
    if (task.status === "completed") return task;
    if (task.status === "failed" || task.status === "cancelled") {
      throw new Error(`[Dana.waitWorkflow] workflow ${task.status}`);
    }
    await sleep(WORKFLOW_WAIT_MS);
  }
  throw new Error("[Dana.waitWorkflow] workflow lock timed out while still running");
}

async function appendMetadataSourceReference(
  db: Db,
  table: "marketing_contacts" | "marketing_leads" | "marketing_conversations" | "marketing_briefs" | "marketing_messages",
  entityId: number,
  sourceReference: string,
) {
  const { data, error } = await db
    .from(table)
    .select("id,metadata")
    .eq("id", entityId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `[Dana.aggregateSourceReference] ${table}: ${error?.message ?? "entity unavailable"}`,
    );
  }
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const sourceReferences = mergeSourceReferences(
    metadata.source_references,
    sourceReference,
  );
  const { error: updateError } = await db
    .from(table)
    .update({ metadata: { ...metadata, source_references: sourceReferences } })
    .eq("id", entityId);
  if (updateError) {
    throw new Error(`[Dana.aggregateSourceReference] ${table}: ${updateError.message}`);
  }
}

async function appendApprovalSourceReference(
  db: Db,
  approvalId: number,
  sourceReference: string,
) {
  const { data, error } = await db
    .from("marketing_approvals")
    .select("id,proposed_action")
    .eq("id", approvalId)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `[Dana.aggregateSourceReference] approval: ${error?.message ?? "entity unavailable"}`,
    );
  }
  const proposedAction = (data.proposed_action ?? {}) as Record<string, unknown>;
  const sourceReferences = mergeSourceReferences(
    proposedAction.source_references,
    sourceReference,
  );
  const { error: updateError } = await db
    .from("marketing_approvals")
    .update({
      proposed_action: {
        ...proposedAction,
        source_references: sourceReferences,
      },
    })
    .eq("id", approvalId);
  if (updateError) {
    throw new Error(`[Dana.aggregateSourceReference] approval: ${updateError.message}`);
  }
}

function preparedResultFromTask(task: TaskSnapshot, deduplicated: boolean) {
  const output = (task.output ?? {}) as Record<string, unknown>;
  const shortlist = (output.shortlist ?? {}) as Record<string, unknown>;
  const required = [
    "contact_id",
    "lead_id",
    "conversation_id",
    "brief_id",
    "draft_message_id",
    "approval_id",
  ] as const;
  for (const key of required) {
    if (typeof output[key] !== "number") {
      throw new Error(`[Dana.workflowResult] missing ${key}`);
    }
  }
  const shortlistStatus = shortlist.status;
  if (shortlistStatus !== "matched" && shortlistStatus !== "insufficient_matches") {
    throw new Error("[Dana.workflowResult] invalid shortlist status");
  }
  return {
    status: "prepared" as const,
    demandKey: String(output.demand_key ?? ""),
    taskId: Number(task.id),
    contactId: Number(output.contact_id),
    leadId: Number(output.lead_id),
    conversationId: Number(output.conversation_id),
    briefId: Number(output.brief_id),
    shortlistStatus,
    draftMessageId: Number(output.draft_message_id),
    approvalId: Number(output.approval_id),
    deduplicated,
  };
}

async function aggregateDuplicateSourceReference(
  db: Db,
  taskId: number,
  sourceReference: string,
) {
  for (let attempt = 0; attempt < WORKFLOW_WAIT_ATTEMPTS; attempt += 1) {
    const { data: claimed, error } = await db
      .from("marketing_tasks")
      .update({ status: "running" })
      .eq("id", taskId)
      .eq("status", "completed")
      .select("id,status,input,output")
      .maybeSingle();
    if (error) throw new Error(`[Dana.aggregateSourceReference] ${error.message}`);

    if (!claimed) {
      const current = await readTask(db, taskId);
      if (current.status === "failed" || current.status === "cancelled") {
        throw new Error(`[Dana.aggregateSourceReference] workflow ${current.status}`);
      }
      await sleep(WORKFLOW_WAIT_MS);
      continue;
    }

    const task = claimed as TaskSnapshot;
    try {
      const result = preparedResultFromTask(task, true);
      const taskInput = (task.input ?? {}) as Record<string, unknown>;
      const sourceReferences = mergeSourceReferences(
        taskInput.source_references,
        sourceReference,
      );

      await db
        .from("marketing_tasks")
        .update({ input: { ...taskInput, source_references: sourceReferences } })
        .eq("id", taskId);

      await appendMetadataSourceReference(
        db,
        "marketing_contacts",
        result.contactId,
        sourceReference,
      );
      await appendMetadataSourceReference(
        db,
        "marketing_leads",
        result.leadId,
        sourceReference,
      );
      await appendMetadataSourceReference(
        db,
        "marketing_conversations",
        result.conversationId,
        sourceReference,
      );
      await appendMetadataSourceReference(
        db,
        "marketing_briefs",
        result.briefId,
        sourceReference,
      );
      await appendMetadataSourceReference(
        db,
        "marketing_messages",
        result.draftMessageId,
        sourceReference,
      );
      await appendApprovalSourceReference(db, result.approvalId, sourceReference);

      await db
        .from("marketing_tasks")
        .update({ status: "completed" })
        .eq("id", taskId);
      return { ...task, status: "completed", input: { ...taskInput, source_references: sourceReferences } };
    } catch (aggregateError) {
      await db
        .from("marketing_tasks")
        .update({ status: "completed" })
        .eq("id", taskId);
      throw aggregateError;
    }
  }
  throw new Error("[Dana.aggregateSourceReference] timed out acquiring aggregation lock");
}

async function returnDeduplicatedWorkflow(
  db: Db,
  task: TaskSnapshot,
  input: CommercialInquiry,
) {
  const completed =
    task.status === "completed" ? task : await waitForCompletedTask(db, Number(task.id));
  const aggregated = await aggregateDuplicateSourceReference(
    db,
    Number(completed.id),
    input.sourceReference,
  );
  const result = preparedResultFromTask(aggregated, true);
  await recordLifecycle(
    db,
    "deduplicated",
    result.demandKey,
    "marketing_task",
    String(result.taskId),
    {
      source_channel: input.sourceChannel,
      source_reference: input.sourceReference,
    },
  );
  return result;
}

export async function processCommercialInquiry(
  input: CommercialInquiry,
): Promise<IntakeResult> {
  const classification = classifyCommercialInquiry(input);
  if (!classification.commercial) {
    return { status: "not_commercial", classification };
  }

  const db = createAdminClient();
  await ensureDanaAgent(db);

  const existingContact = await findExistingContact(db, input);
  let contactId = existingContact?.id ? Number(existingContact.id) : 0;
  if (existingContact?.id) {
    await appendContactAliases(
      db,
      existingContact as Record<string, unknown>,
      input,
    );
    const existingWorkflow = await findWorkflowByResolvedContact(
      db,
      input,
      classification,
      contactId,
    );
    if (existingWorkflow) {
      return returnDeduplicatedWorkflow(db, existingWorkflow, input);
    }
  }

  const initialDemandKey = contactId
    ? buildResolvedCommercialDemandKey(input, classification, contactId)
    : buildCommercialDemandKey(input, classification);
  const acquired = await acquireWorkflow(db, input, initialDemandKey);
  if (!acquired.owner) {
    return returnDeduplicatedWorkflow(db, acquired.task, input);
  }

  const task = acquired.task;
  const taskId = Number(task.id);

  if (!contactId) contactId = await resolveContact(db, input);
  const demandKey = buildResolvedCommercialDemandKey(
    input,
    classification,
    contactId,
  );
  await persistResolvedWorkflowIdentity(
    db,
    task,
    input,
    classification,
    contactId,
    demandKey,
  );

  await recordLifecycle(
    db,
    "classified",
    demandKey,
    "marketing_task",
    String(taskId),
    { source_channel: input.sourceChannel, classification },
  );

  const leadId = await resolveLead(
    db,
    input,
    demandKey,
    contactId,
    classification,
  );
  const conversationId = await resolveConversation(
    db,
    input,
    demandKey,
    contactId,
    leadId,
  );
  await recordLifecycle(
    db,
    "resolved",
    demandKey,
    "marketing_lead",
    String(leadId),
    {
      source_channel: input.sourceChannel,
      contact_id: contactId,
      conversation_id: conversationId,
    },
  );
  await recordLifecycle(
    db,
    "lead",
    demandKey,
    "marketing_lead",
    String(leadId),
    { source_channel: input.sourceChannel },
  );

  const { id: briefId, domain: brief } = await resolveBrief(
    db,
    input,
    demandKey,
    contactId,
    leadId,
    conversationId,
  );
  await recordLifecycle(
    db,
    "brief",
    demandKey,
    "marketing_brief",
    String(briefId),
    { source_channel: input.sourceChannel, brief_status: brief.status },
  );

  const candidates = await loadEligibleTalents(db, brief.talentType);
  const shortlist = rankEligibleTalents(
    brief,
    candidates,
    Math.max(1, Math.min(brief.talentCount ?? 1, 3)),
  );
  await recordLifecycle(
    db,
    "matched",
    demandKey,
    "marketing_brief",
    String(briefId),
    {
      source_channel: input.sourceChannel,
      shortlist_status: shortlist.status,
      matches: shortlist.matches,
    },
  );

  const { draftMessageId, approvalId } = await resolveDraftAndApproval(
    db,
    input,
    demandKey,
    taskId,
    conversationId,
    brief,
    shortlist,
  );
  await recordLifecycle(
    db,
    "draft_prepared",
    demandKey,
    "marketing_message",
    String(draftMessageId),
    { source_channel: input.sourceChannel, external_execution: false },
  );
  await recordLifecycle(
    db,
    "approval_requested",
    demandKey,
    "marketing_approval",
    String(approvalId),
    {
      source_channel: input.sourceChannel,
      approval_status: "pending",
      external_execution: false,
    },
  );

  const output = {
    demand_key: demandKey,
    contact_id: contactId,
    lead_id: leadId,
    conversation_id: conversationId,
    brief_id: briefId,
    shortlist,
    draft_message_id: draftMessageId,
    approval_id: approvalId,
    external_execution: false,
  };
  const { error: completionError } = await db
    .from("marketing_tasks")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      output,
      lead_id: leadId,
      conversation_id: conversationId,
    })
    .eq("id", taskId);
  if (completionError) {
    throw new Error(`[Dana.completeWorkflow] ${completionError.message}`);
  }

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
    deduplicated: false,
  };
}
