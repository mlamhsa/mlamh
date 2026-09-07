export type DemandLeadFact = {
  id: number;
  contact_id?: number | null;
  source?: string | null;
  channel?: string | null;
  stage?: string | null;
  brief_status?: string | null;
};

export type DemandContactFact = {
  id: number;
  contact_name?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  metadata?: unknown;
};

export type DemandTaskFact = {
  lead_id?: number | null;
  task_type?: string | null;
  status?: string | null;
};

export type DemandOutreachFact = {
  lead_id?: number | null;
  channel?: string | null;
  send_status?: string | null;
  reply_status?: string | null;
  outcome?: string | null;
};

export type DemandBriefFact = {
  lead_id?: number | null;
  status?: string | null;
  opportunity_id?: number | string | null;
};

type DemandQualityInput = {
  leads: DemandLeadFact[];
  contacts: DemandContactFact[];
  tasks: DemandTaskFact[];
  outreach: DemandOutreachFact[];
  briefs: DemandBriefFact[];
};

export type DemandQualityStage = {
  key: "leads" | "researched" | "ready" | "prepared" | "sent" | "replied" | "positive" | "brief" | "opportunity";
  count: number;
};

export type DemandQualitySnapshot = {
  stages: DemandQualityStage[];
  totalLeads: number;
  researchedLeads: number;
  outreachReadyLeads: number;
  outreachPreparedLeads: number;
  sentLeads: number;
  repliedLeads: number;
  positiveReplyLeads: number;
  briefLeads: number;
  completeBriefLeads: number;
  opportunityLeads: number;
  researchToReadyRate: number | null;
  readyToPreparedRate: number | null;
  preparedToSentRate: number | null;
  sentToReplyRate: number | null;
  replyToPositiveRate: number | null;
  sentToBriefRate: number | null;
  briefToOpportunityRate: number | null;
  leadToBriefRate: number | null;
  largestObservedDrop: { from: string; to: string; rate: number; lost: number } | null;
};

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function contactRole(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const row = metadata as Record<string, unknown>;
  return clean(row.job_title) ?? clean(row.role) ?? clean(row.title);
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

function ids(rows: Array<number | null | undefined>) {
  return new Set(rows.filter((value): value is number => Number.isInteger(value) && Number(value) > 0));
}

function intersectCount(a: Set<number>, b: Set<number>) {
  let total = 0;
  for (const value of a) if (b.has(value)) total += 1;
  return total;
}

export function buildDemandQuality(input: DemandQualityInput): DemandQualitySnapshot {
  const leadIds = ids(input.leads.map((lead) => lead.id));
  const contactById = new Map(input.contacts.map((contact) => [contact.id, contact]));

  const researched = ids(input.tasks
    .filter((task) => task.task_type === "lead_enrichment" && task.status === "completed")
    .map((task) => task.lead_id));

  const ready = new Set<number>();
  for (const lead of input.leads) {
    if (!lead.contact_id) continue;
    const contact = contactById.get(lead.contact_id);
    if (!contact) continue;
    const hasName = Boolean(clean(contact.contact_name));
    const hasRole = Boolean(contactRole(contact.metadata));
    const hasChannel = Boolean(clean(contact.email) || clean(contact.linkedin_url));
    if (hasName && hasRole && hasChannel) ready.add(lead.id);
  }

  const prepared = ids(input.outreach.map((row) => row.lead_id));
  const sent = ids(input.outreach.filter((row) => row.send_status === "sent").map((row) => row.lead_id));
  const replied = ids(input.outreach.filter((row) => clean(row.reply_status) && row.reply_status !== "none").map((row) => row.lead_id));
  const positive = ids(input.outreach.filter((row) => row.reply_status === "qualified" || row.outcome === "interested").map((row) => row.lead_id));
  const brief = ids(input.briefs.map((row) => row.lead_id));
  const completeBrief = ids(input.briefs.filter((row) => row.status === "complete").map((row) => row.lead_id));
  const opportunity = ids(input.briefs.filter((row) => row.opportunity_id !== null && row.opportunity_id !== undefined).map((row) => row.lead_id));
  for (const lead of input.leads) {
    if (["opportunity", "opportunity_created", "won"].includes(lead.stage ?? "")) opportunity.add(lead.id);
  }

  const researchedLeadCount = intersectCount(leadIds, researched);
  const readyLeadCount = intersectCount(leadIds, ready);
  const preparedLeadCount = intersectCount(leadIds, prepared);
  const sentLeadCount = intersectCount(leadIds, sent);
  const repliedLeadCount = intersectCount(sent, replied);
  const positiveReplyLeadCount = intersectCount(replied, positive);
  const briefLeadCount = intersectCount(leadIds, brief);
  const completeBriefLeadCount = intersectCount(leadIds, completeBrief);
  const opportunityLeadCount = intersectCount(leadIds, opportunity);

  const researchedReady = intersectCount(researched, ready);
  const readyPrepared = intersectCount(ready, prepared);
  const preparedSent = intersectCount(prepared, sent);
  const sentBrief = intersectCount(sent, brief);
  const briefOpportunity = intersectCount(brief, opportunity);

  const transitionCandidates = [
    { from: "researched", to: "outreach_ready", numerator: researchedReady, denominator: researchedLeadCount },
    { from: "outreach_ready", to: "outreach_prepared", numerator: readyPrepared, denominator: readyLeadCount },
    { from: "outreach_prepared", to: "sent", numerator: preparedSent, denominator: preparedLeadCount },
    { from: "sent", to: "replied", numerator: repliedLeadCount, denominator: sentLeadCount },
    { from: "replied", to: "positive_reply", numerator: positiveReplyLeadCount, denominator: repliedLeadCount },
    { from: "brief", to: "opportunity", numerator: briefOpportunity, denominator: briefLeadCount },
  ].filter((item) => item.denominator > 0)
    .map((item) => ({ ...item, rate: Math.round((item.numerator / item.denominator) * 100), lost: Math.max(0, item.denominator - item.numerator) }));

  const largestObservedDrop = transitionCandidates.length
    ? [...transitionCandidates].sort((a, b) => a.rate - b.rate || b.lost - a.lost)[0]
    : null;

  return {
    stages: [
      { key: "leads", count: leadIds.size },
      { key: "researched", count: researchedLeadCount },
      { key: "ready", count: readyLeadCount },
      { key: "prepared", count: preparedLeadCount },
      { key: "sent", count: sentLeadCount },
      { key: "replied", count: repliedLeadCount },
      { key: "positive", count: positiveReplyLeadCount },
      { key: "brief", count: briefLeadCount },
      { key: "opportunity", count: opportunityLeadCount },
    ],
    totalLeads: leadIds.size,
    researchedLeads: researchedLeadCount,
    outreachReadyLeads: readyLeadCount,
    outreachPreparedLeads: preparedLeadCount,
    sentLeads: sentLeadCount,
    repliedLeads: repliedLeadCount,
    positiveReplyLeads: positiveReplyLeadCount,
    briefLeads: briefLeadCount,
    completeBriefLeads: completeBriefLeadCount,
    opportunityLeads: opportunityLeadCount,
    researchToReadyRate: pct(researchedReady, researchedLeadCount),
    readyToPreparedRate: pct(readyPrepared, readyLeadCount),
    preparedToSentRate: pct(preparedSent, preparedLeadCount),
    sentToReplyRate: pct(repliedLeadCount, sentLeadCount),
    replyToPositiveRate: pct(positiveReplyLeadCount, repliedLeadCount),
    sentToBriefRate: pct(sentBrief, sentLeadCount),
    briefToOpportunityRate: pct(briefOpportunity, briefLeadCount),
    leadToBriefRate: pct(briefLeadCount, leadIds.size),
    largestObservedDrop,
  };
}
