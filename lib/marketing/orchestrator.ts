import { createAdminClient } from "@/lib/supabase/admin";
import { runGovernedChannelWorker } from "@/lib/marketing/channels/autonomous-executor";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { runMarketingTaskById } from "@/lib/marketing/tasks/runner";

type DailyMission = {
  agentId: string;
  taskType: string;
  title: string;
  objective: string;
  channel: string;
  priority: "normal" | "high";
};

type RunnableDailyTask = {
  id: number;
  agent_id: string | null;
  retry_count: number;
  max_retries: number;
};

type LeadRow = {
  id: number;
  organization: string;
  contact_id: number | null;
  city: string | null;
  demand_signal: string | null;
  opportunity_type: string | null;
  lead_score: number | null;
  stage: string;
};

type ContactRow = {
  id: number;
  contact_name: string | null;
  email: string | null;
  linkedin_url: string | null;
  website: string | null;
  metadata: Record<string, unknown> | null;
};

const DAILY_MISSIONS: DailyMission[] = [
  { agentId: "rakan", taskType: "growth_analytics", title: "Daily growth intelligence", objective: "Analyze MLAMH live marketplace metrics, identify the strongest signal, the largest bottleneck, and the three highest-impact actions for today. Use only supplied data and end with clear continue / stop / test recommendations.", channel: "internal", priority: "high" },
  { agentId: "nora", taskType: "growth_strategy", title: "Daily marketing direction", objective: "Turn current MLAMH marketplace signals into no more than three focused marketing priorities for today. Prioritize qualified talent supply, publisher demand, opportunity liquidity and applications. Avoid creating work with no measurable outcome.", channel: "internal", priority: "high" },
  { agentId: "reem", taskType: "content_strategy", title: "Daily social content plan", objective: "Prepare a small production-ready MLAMH social plan from current marketplace signals. Every proposed Instagram or Facebook item must specify channel, format, hook, caption, CTA and intended outcome. Draft only; creative production is a required dependency before publishing approval.", channel: "instagram", priority: "high" },
  { agentId: "faisal", taskType: "community_growth", title: "Daily talent supply action", objective: "Identify the single highest-value organic action for qualified Actor and Model supply today, grounded in current registrations, profile completion and opportunity demand. Return an actionable recommendation rather than a list of generic ideas.", channel: "instagram", priority: "normal" },
];

function riyadhDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function contactRole(contact: ContactRow | null) {
  const metadata = contact?.metadata && typeof contact.metadata === "object" && !Array.isArray(contact.metadata) ? contact.metadata : {};
  const value = metadata.job_title ?? metadata.role ?? metadata.title;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function cleanStaleAutonomousTasks(now = new Date()) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();
  const { data: stale, error } = await db
    .from("marketing_tasks")
    .select("id,agent_id,title,status,channel,created_at")
    .eq("source", "autonomous_orchestrator")
    .in("status", ["queued", "scheduled"])
    .lt("created_at", cutoff)
    .limit(100);
  if (error) throw new Error(`[marketing_orchestrator.stale.read] ${error.message}`);
  if (!stale?.length) return { staleCancelled: 0 };

  const ids = stale.map((task) => task.id);
  const cancelledAt = now.toISOString();
  const { error: cancelError } = await db.from("marketing_tasks").update({
    status: "cancelled",
    locked_at: null,
    locked_by: null,
    updated_at: cancelledAt,
    metadata: { stale_cleanup: true, stale_cleanup_at: cancelledAt },
  }).in("id", ids).in("status", ["queued", "scheduled"]);
  if (cancelError) throw new Error(`[marketing_orchestrator.stale.cancel] ${cancelError.message}`);

  await db.from("marketing_agent_activity").insert(stale.map((task) => ({
    agent_id: task.agent_id,
    task_id: task.id,
    action: "stale_task_cancelled",
    reason: `Cancelled stale autonomous task: ${task.title}`,
    channel: task.channel ?? "internal",
    result: { previous_status: task.status, cutoff, cancelled_at: cancelledAt },
  })));

  const affectedAgents = [...new Set(stale.map((task) => task.agent_id).filter((id): id is string => Boolean(id)))];
  if (affectedAgents.length) {
    await db.from("marketing_agents").update({ status: "idle", current_task_id: null, updated_at: cancelledAt }).in("id", affectedAgents).in("status", ["scheduled"]);
  }

  return { staleCancelled: stale.length };
}

async function seedLeadPreparationTasks(day: string) {
  const db = createAdminClient();
  const { data: leadData, error } = await db
    .from("marketing_leads")
    .select("id,organization,contact_id,city,demand_signal,opportunity_type,lead_score,stage")
    .in("stage", ["new", "qualified"])
    .order("lead_score", { ascending: false, nullsFirst: false })
    .limit(8);
  if (error) throw new Error(`[marketing_orchestrator.leads] ${error.message}`);

  const leads = (leadData ?? []) as LeadRow[];
  const contactIds = [...new Set(leads.map((lead) => lead.contact_id).filter((id): id is number => typeof id === "number"))];
  const { data: contactData } = contactIds.length
    ? await db.from("marketing_contacts").select("id,contact_name,email,linkedin_url,website,metadata").in("id", contactIds)
    : { data: [] as ContactRow[] };
  const contacts = new Map(((contactData ?? []) as ContactRow[]).map((contact) => [contact.id, contact]));

  let enrichmentQueued = 0;
  let outreachPrepQueued = 0;

  for (const lead of leads) {
    const contact = lead.contact_id ? contacts.get(lead.contact_id) ?? null : null;
    const hasNamedContact = Boolean(contact?.contact_name?.trim());
    const hasReachableChannel = Boolean(contact?.linkedin_url?.trim() || contact?.email?.trim());
    const role = contactRole(contact);

    if (!hasNamedContact || !hasReachableChannel) {
      await createMarketingTask({
        agentId: "salman",
        taskType: "lead_enrichment",
        title: `Prepare outreach-ready lead · ${lead.organization}`,
        objective: "Prepare this demand lead for outreach by identifying exactly which verified public contact data is missing. Do not invent people, titles, emails, phone numbers, LinkedIn profiles, relationships or claims. If the connected research context cannot verify a field, mark it as a research gap instead of guessing.",
        priority: "high",
        channel: "research",
        approvalLevel: "auto",
        leadId: lead.id,
        source: "autonomous_orchestrator",
        input: {
          day,
          lead_id: lead.id,
          organization: lead.organization,
          city: lead.city,
          opportunity_type: lead.opportunity_type,
          demand_signal: lead.demand_signal,
          current_readiness: {
            contact_name: hasNamedContact,
            contact_role: Boolean(role),
            linkedin: Boolean(contact?.linkedin_url?.trim()),
            email: Boolean(contact?.email?.trim()),
            website: Boolean(contact?.website?.trim()),
          },
          required_output: ["verified_contact_person", "role", "best_channel", "source_evidence", "remaining_gaps"],
        },
        metadata: { orchestrated: true, day, outcome: "outreach_ready_lead" },
        idempotencyKey: `lead-enrichment:${lead.id}:${day}`,
      });
      enrichmentQueued += 1;
      continue;
    }

    await createMarketingTask({
      agentId: "layan",
      taskType: "outreach_preparation",
      title: `Prepare outreach · ${lead.organization}`,
      objective: "Prepare a concise personalized first-touch outreach draft for this verified lead. Prefer LinkedIn when a LinkedIn profile is available and use Sawsan Ahdadi / Business Development as the sender profile. Email may be prepared when available. Do not send anything, do not invent context, and do not claim a prior relationship.",
      priority: "high",
      channel: contact?.linkedin_url ? "linkedin" : "email",
      approvalLevel: "auto",
      leadId: lead.id,
      source: "autonomous_orchestrator",
      input: {
        day,
        lead_id: lead.id,
        organization: lead.organization,
        city: lead.city,
        opportunity_type: lead.opportunity_type,
        demand_signal: lead.demand_signal,
        contact: {
          name: contact?.contact_name,
          role,
          linkedin_available: Boolean(contact?.linkedin_url?.trim()),
          email_available: Boolean(contact?.email?.trim()),
        },
        sender_profile: { name: "Sawsan Ahdadi", role: "Business Development" },
        required_output: ["recommended_channel", "message", "follow_up_plan"],
      },
      metadata: { orchestrated: true, day, outcome: "approval_ready_outreach" },
      idempotencyKey: `outreach-preparation:${lead.id}:${day}`,
    });
    outreachPrepQueued += 1;
  }

  return { enrichmentQueued, outreachPrepQueued };
}

export async function seedDailyMarketingCycle(now = new Date()) {
  const db = createAdminClient();
  const day = riyadhDayKey(now);
  const staleCleanup = await cleanStaleAutonomousTasks(now);
  const { data: activeAgents } = await db.from("marketing_agents").select("id").eq("is_active", true);
  const active = new Set((activeAgents ?? []).map((agent) => agent.id));
  const rows = DAILY_MISSIONS.filter((mission) => active.has(mission.agentId)).map((mission) => ({
    agent_id: mission.agentId,
    task_type: mission.taskType,
    title: mission.title,
    objective: mission.objective,
    priority: mission.priority,
    status: "queued",
    channel: mission.channel,
    source: "autonomous_orchestrator",
    input: { cycle: "daily", market_timezone: "Asia/Riyadh", day },
    approval_level: "auto",
    approval_status: "not_required",
    idempotency_key: `autonomous:${day}:${mission.agentId}:${mission.taskType}`,
    metadata: { orchestrated: true, external_execution: false, day, outcome_driven: true },
  }));

  const { data, error } = await db.from("marketing_tasks").upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id,agent_id,title,objective,channel,status");
  if (error) throw new Error(`[marketing_orchestrator.seed] ${error.message}`);

  const created = data ?? [];
  if (created.length) {
    await db.from("marketing_agent_activity").insert(created.map((task) => ({
      agent_id: task.agent_id,
      task_id: task.id,
      action: "task_created",
      reason: task.objective ?? task.title,
      channel: task.channel ?? "internal",
      result: { source: "autonomous_orchestrator", day, status: task.status },
    })));
  }

  const leadPreparation = await seedLeadPreparationTasks(day);
  return { day, seeded: created.length, ...staleCleanup, ...leadPreparation };
}

async function getRunnableDailyTasks(day: string, limit = 8) {
  const db = createAdminClient();
  const safeLimit = Math.max(1, Math.min(limit, 8));
  const { data, error } = await db
    .from("marketing_tasks")
    .select("id,agent_id,retry_count,max_retries")
    .eq("source", "autonomous_orchestrator")
    .contains("metadata", { day })
    .in("status", ["queued", "scheduled"])
    .order("id", { ascending: true })
    .limit(16);
  if (error) throw new Error(`[marketing_orchestrator.queue] ${error.message}`);
  return ((data ?? []) as RunnableDailyTask[])
    .filter((task) => task.retry_count <= task.max_retries)
    .slice(0, safeLimit);
}

async function reflectQueuedAgents(tasks: RunnableDailyTask[]) {
  const db = createAdminClient();
  await Promise.all(tasks.map(async (task) => {
    if (!task.agent_id) return;
    await db.from("marketing_agents").update({
      status: "scheduled",
      current_task_id: task.id,
      updated_at: new Date().toISOString(),
    }).eq("id", task.agent_id).in("status", ["idle", "scheduled"]);
  }));
}

export async function runAutonomousMarketingCycle({ maxTasks = 3, maxChannelJobs = 2 }: { maxTasks?: number; maxChannelJobs?: number } = {}) {
  const seeded = await seedDailyMarketingCycle();
  const allRunnable = await getRunnableDailyTasks(seeded.day, 8);
  await reflectQueuedAgents(allRunnable);

  const executed: Array<{ taskId: number; status: string; error?: string }> = [];
  for (const task of allRunnable.slice(0, Math.max(1, Math.min(maxTasks, 8)))) {
    const result = await runMarketingTaskById(task.id, `autonomous-marketing-${seeded.day}`, "autonomous_orchestrator");
    if (result) executed.push(result);
  }

  const channels = await runGovernedChannelWorker({ maxJobs: maxChannelJobs });
  const remaining = await getRunnableDailyTasks(seeded.day, 8);
  await reflectQueuedAgents(remaining);

  return {
    ...seeded,
    executed,
    channels,
    remainingForNextTick: remaining.length > 0,
    remainingTaskCount: remaining.length,
  };
}
