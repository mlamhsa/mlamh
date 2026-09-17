import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import {
  getInvestorGmailConnectionState,
  readInvestorGmailThread,
  sendInvestorGmailMessage,
} from "./gmail";

const DEFAULT_MASTER_BRIEF = `MLAMH is a Saudi-based talent marketplace focused on Actors and Models. It connects talent with publishers such as production companies, agencies, brands, event organizers and project owners. The core workflow is: verified professional talent supply → publisher opportunity/brief → qualified applications or managed casting shortlist → selection → direct conversation/booking. MLAMH is live in Saudi Arabia, with a multi-country architecture prepared for expansion. AI capabilities are being developed around talent qualification, matching, opportunity creation, growth intelligence and operational workflows. Investor outreach should position MLAMH as a technology-enabled marketplace and operating layer for talent discovery and casting, not as a traditional talent agency.`;

export type InvestorRelationsSettings = {
  masterBrief: string;
  targetRegions: string[];
  targetStages: string[];
  targetSectors: string[];
  minimumFitScore: number;
  followUpDays: number[];
};

type DiscoveryItem = {
  organization_name?: unknown;
  organization_type?: unknown;
  website_url?: unknown;
  linkedin_url?: unknown;
  country_code?: unknown;
  city?: unknown;
  investment_stage?: unknown;
  sector_focus?: unknown;
  geography_focus?: unknown;
  cheque_min?: unknown;
  cheque_max?: unknown;
  cheque_currency?: unknown;
  thesis_summary?: unknown;
  fit_score?: unknown;
  fit_rationale?: unknown;
  contact_name?: unknown;
  contact_role?: unknown;
  contact_email?: unknown;
  contact_linkedin_url?: unknown;
  source_urls?: unknown;
};

type OutreachDraft = {
  subject?: unknown;
  body?: unknown;
  rationale?: unknown;
  positioning_angle?: unknown;
  recommended_attachments?: unknown;
};

type ReplyAnalysis = {
  classification?: unknown;
  summary?: unknown;
  subject?: unknown;
  body?: unknown;
  suggested_follow_up_days?: unknown;
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asNullableString(value: unknown, max = 1000) {
  const result = asString(value, max);
  return result || null;
}

function asStringArray(value: unknown, maxItems = 20, maxLength = 200) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function score(value: unknown) {
  const number = asNumber(value);
  if (number === null) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function parseAIJson(content: string) {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("Investor AI returned invalid JSON.");
  }
}

function normalizeOrgType(value: unknown) {
  const raw = asString(value, 50).toLowerCase();
  const allowed = new Set(["vc", "angel", "family_office", "corporate_vc", "strategic", "accelerator", "government", "other"]);
  return allowed.has(raw) ? raw : "other";
}

function normalizeEmail(value: unknown) {
  const email = asString(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function extractEmail(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.toLowerCase() ?? null;
}

function uniqUrls(value: unknown) {
  const urls = asStringArray(value, 20, 1000).filter((url) => /^https?:\/\//i.test(url));
  return [...new Set(urls)];
}

export async function getInvestorRelationsSettings(): Promise<InvestorRelationsSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("investor_relations_settings")
    .select("master_brief,target_regions,target_stages,target_sectors,minimum_fit_score,follow_up_days")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error("Investor relations settings could not be loaded.");
  return {
    masterBrief: asString(data?.master_brief, 20000) || DEFAULT_MASTER_BRIEF,
    targetRegions: asStringArray(data?.target_regions) || ["SA", "AE", "GCC"],
    targetStages: asStringArray(data?.target_stages) || ["pre_seed", "seed"],
    targetSectors: asStringArray(data?.target_sectors) || ["marketplace", "media_tech", "creator_economy", "future_of_work", "ai"],
    minimumFitScore: typeof data?.minimum_fit_score === "number" ? data.minimum_fit_score : 70,
    followUpDays: Array.isArray(data?.follow_up_days)
      ? data.follow_up_days.filter((item): item is number => Number.isInteger(item) && item > 0).slice(0, 6)
      : [4, 8, 15],
  };
}

export async function updateInvestorMasterBrief({ masterBrief, userId }: { masterBrief: string; userId: string }) {
  const value = masterBrief.trim().slice(0, 20000);
  if (value.length < 100) throw new Error("Master investor brief is too short.");
  const db = createAdminClient();
  const { error } = await db.from("investor_relations_settings").upsert({
    id: 1,
    master_brief: value,
    updated_by_user_id: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Master investor brief could not be saved.");
}

export async function getInvestorRelationsDashboard() {
  const db = createAdminClient();
  const [leadsResult, outreachResult, settings, gmail] = await Promise.all([
    db.from("investor_leads")
      .select("id,organization_name,organization_type,country_code,fit_score,fit_rationale,contact_name,contact_role,contact_email,status,last_researched_at,last_contacted_at,next_follow_up_at,gmail_thread_id,created_at")
      .order("fit_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("investor_outreach")
      .select("id,investor_id,kind,status,to_email,subject,body_text,rationale,positioning_angle,attachment_plan,approval_requested_at,approved_at,sent_at,gmail_thread_id,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    getInvestorRelationsSettings(),
    getInvestorGmailConnectionState(),
  ]);
  if (leadsResult.error) throw new Error("Investor pipeline could not be loaded.");
  if (outreachResult.error) throw new Error("Investor outreach queue could not be loaded.");

  const leads = leadsResult.data ?? [];
  const outreach = outreachResult.data ?? [];
  const now = Date.now();
  const counts = {
    discovered: leads.length,
    qualified: leads.filter((lead) => (lead.fit_score ?? 0) >= settings.minimumFitScore).length,
    awaitingApproval: outreach.filter((item) => item.status === "pending_approval").length,
    followUpsDue: leads.filter((lead) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= now && ["contacted", "follow_up", "interested"].includes(lead.status)).length,
  };
  const stageCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] ?? 0) + 1;
    return acc;
  }, {});

  return { leads, outreach, settings, gmail, counts, stageCounts };
}

export async function discoverInvestors({ limit = 8 }: { limit?: number } = {}) {
  const settings = await getInvestorRelationsSettings();
  const db = createAdminClient();
  const { data: existing } = await db.from("investor_leads").select("organization_name,website_url").limit(300);
  const excluded = (existing ?? []).map((row) => `${row.organization_name}${row.website_url ? ` — ${row.website_url}` : ""}`).slice(0, 200);
  const provider = getMarketingAIProvider();
  const response = await provider.generate({
    taskType: "lead_enrichment",
    responseFormat: "json",
    metadata: { workflow: "investor_discovery_v1" },
    messages: [
      {
        role: "system",
        content: `You are MLAMH Investor Relations AI. Discover real investors using current public web evidence. Do not fabricate firms, people, investment theses, cheque sizes, emails or LinkedIn URLs. Prefer official investor websites, portfolio pages, reputable announcements and verified professional pages. Fit score must reflect MLAMH's actual stage, region and sector. A lead without enough public evidence should have a lower fit score. Return only JSON.`,
      },
      {
        role: "user",
        content: `MLAMH master brief:\n${settings.masterBrief}\n\nTarget regions: ${settings.targetRegions.join(", ")}\nTarget stages: ${settings.targetStages.join(", ")}\nTarget sectors: ${settings.targetSectors.join(", ")}\nMinimum desired fit: ${settings.minimumFitScore}/100.\n\nAlready known investors to avoid duplicates:\n${excluded.length ? excluded.join("\n") : "None yet."}\n\nFind up to ${Math.max(1, Math.min(limit, 12))} NEW investor organizations with credible current evidence. Focus first on Saudi Arabia and UAE/GCC, then international investors with demonstrated MENA/GCC appetite. Include VCs, angels, family offices, corporate venture arms, strategic investors and accelerators where genuinely relevant.\n\nReturn this exact structure:\n{\n  "investors": [\n    {\n      "organization_name": "",\n      "organization_type": "vc|angel|family_office|corporate_vc|strategic|accelerator|government|other",\n      "website_url": null,\n      "linkedin_url": null,\n      "country_code": null,\n      "city": null,\n      "investment_stage": [],\n      "sector_focus": [],\n      "geography_focus": [],\n      "cheque_min": null,\n      "cheque_max": null,\n      "cheque_currency": null,\n      "thesis_summary": "",\n      "fit_score": 0,\n      "fit_rationale": "",\n      "contact_name": null,\n      "contact_role": null,\n      "contact_email": null,\n      "contact_linkedin_url": null,\n      "source_urls": []\n    }\n  ]\n}`,
      },
    ],
  });

  const parsed = asObject(parseAIJson(response.content));
  const items = Array.isArray(parsed?.investors) ? (parsed?.investors as DiscoveryItem[]) : [];
  const globalSources = Array.isArray(parsed?.web_sources)
    ? (parsed?.web_sources as Array<Record<string, unknown>>).map((source) => asString(source.url, 1000)).filter(Boolean)
    : [];
  const created: number[] = [];
  const skipped: string[] = [];

  for (const item of items.slice(0, Math.max(1, Math.min(limit, 12)))) {
    const organizationName = asString(item.organization_name, 300);
    if (!organizationName) continue;
    const websiteUrl = asNullableString(item.website_url, 1000);
    const { data: duplicate } = await db.from("investor_leads")
      .select("id")
      .ilike("organization_name", organizationName)
      .limit(1)
      .maybeSingle();
    if (duplicate?.id) {
      skipped.push(organizationName);
      continue;
    }

    const fitScore = score(item.fit_score);
    const sourceUrls = [...new Set([...uniqUrls(item.source_urls), ...globalSources])].slice(0, 20);
    const row = {
      organization_name: organizationName,
      organization_type: normalizeOrgType(item.organization_type),
      website_url: websiteUrl,
      linkedin_url: asNullableString(item.linkedin_url, 1000),
      country_code: asNullableString(item.country_code, 8)?.toUpperCase() ?? null,
      city: asNullableString(item.city, 160),
      investment_stage: asStringArray(item.investment_stage),
      sector_focus: asStringArray(item.sector_focus),
      geography_focus: asStringArray(item.geography_focus),
      cheque_min: asNumber(item.cheque_min),
      cheque_max: asNumber(item.cheque_max),
      cheque_currency: asNullableString(item.cheque_currency, 12)?.toUpperCase() ?? null,
      thesis_summary: asNullableString(item.thesis_summary, 3000),
      fit_score: fitScore,
      fit_rationale: asNullableString(item.fit_rationale, 3000),
      contact_name: asNullableString(item.contact_name, 300),
      contact_role: asNullableString(item.contact_role, 300),
      contact_email: normalizeEmail(item.contact_email),
      contact_linkedin_url: asNullableString(item.contact_linkedin_url, 1000),
      status: fitScore !== null && fitScore >= settings.minimumFitScore ? "qualified" : "discovered",
      source_urls: sourceUrls,
      research_payload: {
        ai_provider: response.provider,
        ai_model: response.model ?? null,
        usage: response.usage ?? {},
        discovered_at: new Date().toISOString(),
      },
      last_researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await db.from("investor_leads").insert(row).select("id").single();
    if (error || !inserted) continue;
    created.push(inserted.id);
    await db.from("investor_activity").insert({
      investor_id: inserted.id,
      action: "investor_discovered",
      actor_type: "ai",
      summary: row.fit_rationale,
      metadata: { fit_score: fitScore, source_urls: sourceUrls },
    });
  }

  return { discovered: created.length, investorIds: created, skippedDuplicates: skipped, provider: response.provider, model: response.model ?? null };
}

export async function generateInvestorOutreachDraft(investorId: number) {
  const db = createAdminClient();
  const [{ data: investor, error }, settings] = await Promise.all([
    db.from("investor_leads").select("*").eq("id", investorId).maybeSingle(),
    getInvestorRelationsSettings(),
  ]);
  if (error || !investor) throw new Error("Investor lead was not found.");
  if (!investor.contact_email) throw new Error("A verified public business email is required before outreach can be drafted for approval.");

  const provider = getMarketingAIProvider();
  const response = await provider.generate({
    taskType: "investor_outreach_draft",
    responseFormat: "json",
    metadata: { workflow: "investor_outreach_v1", investor_id: investorId },
    messages: [
      {
        role: "system",
        content: `You write concise, professional investor outreach for MLAMH. Do not invent traction, revenue, users, funding amounts, partnerships or team credentials. Use only the supplied master brief and verified investor research. The goal is to start a serious investment conversation, not oversell. Prefer 120-180 words. Return JSON only.`,
      },
      {
        role: "user",
        content: `MLAMH master brief:\n${settings.masterBrief}\n\nInvestor record:\n${JSON.stringify(investor, null, 2)}\n\nWrite a personalized first outreach email to ${investor.contact_name || "the investment team"}. Explain why MLAMH is relevant to this investor's documented thesis. Do not state that they are interested already.\n\nReturn:\n{\n  "subject": "",\n  "body": "",\n  "rationale": "Why this angle fits this investor",\n  "positioning_angle": "",\n  "recommended_attachments": ["optional items only if useful"]\n}`,
      },
    ],
  });
  const parsed = (asObject(parseAIJson(response.content)) ?? {}) as OutreachDraft;
  const subject = asString(parsed.subject, 300);
  const body = asString(parsed.body, 12000);
  if (!subject || !body) throw new Error("Investor AI returned an incomplete outreach draft.");

  await db.from("investor_outreach")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("investor_id", investorId)
    .eq("kind", "initial")
    .eq("status", "pending_approval");

  const { data: draft, error: insertError } = await db.from("investor_outreach").insert({
    investor_id: investorId,
    kind: "initial",
    status: "pending_approval",
    to_email: investor.contact_email,
    subject,
    body_text: body,
    rationale: asNullableString(parsed.rationale, 3000),
    positioning_angle: asNullableString(parsed.positioning_angle, 2000),
    attachment_plan: asStringArray(parsed.recommended_attachments, 10, 300),
    ai_metadata: { provider: response.provider, model: response.model ?? null, usage: response.usage ?? {} },
    approval_requested_at: new Date().toISOString(),
  }).select("id").single();
  if (insertError || !draft) throw new Error("Investor outreach draft could not be saved.");

  await db.from("investor_leads").update({ status: "awaiting_approval", updated_at: new Date().toISOString() }).eq("id", investorId);
  await db.from("investor_activity").insert({
    investor_id: investorId,
    outreach_id: draft.id,
    action: "outreach_draft_created",
    actor_type: "ai",
    summary: asNullableString(parsed.rationale, 1000),
  });
  return { outreachId: draft.id, subject, body };
}

export async function approveInvestorOutreach({ outreachId, userId }: { outreachId: number; userId: string }) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await db.from("investor_outreach")
    .update({ status: "approved", approved_by_user_id: userId, approved_at: now, updated_at: now })
    .eq("id", outreachId)
    .eq("status", "pending_approval")
    .select("id,investor_id")
    .maybeSingle();
  if (error || !data) throw new Error("Only a pending investor outreach draft can be approved.");
  await db.from("investor_activity").insert({
    investor_id: data.investor_id,
    outreach_id: outreachId,
    action: "outreach_approved",
    actor_type: "admin",
    actor_user_id: userId,
  });
  return data;
}

export async function rejectInvestorOutreach({ outreachId, userId, note }: { outreachId: number; userId: string; note?: string }) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await db.from("investor_outreach")
    .update({
      status: "rejected",
      rejected_by_user_id: userId,
      rejected_at: now,
      rejection_note: note?.trim().slice(0, 2000) || null,
      updated_at: now,
    })
    .eq("id", outreachId)
    .eq("status", "pending_approval")
    .select("id,investor_id")
    .maybeSingle();
  if (error || !data) throw new Error("Only a pending investor outreach draft can be rejected.");
  await db.from("investor_leads").update({ status: "qualified", updated_at: now }).eq("id", data.investor_id).eq("status", "awaiting_approval");
  await db.from("investor_activity").insert({
    investor_id: data.investor_id,
    outreach_id: outreachId,
    action: "outreach_rejected",
    actor_type: "admin",
    actor_user_id: userId,
    summary: note?.trim().slice(0, 1000) || null,
  });
  return data;
}

export async function sendApprovedInvestorOutreach({ outreachId, userId }: { outreachId: number; userId: string }) {
  const db = createAdminClient();
  const { data: outreach, error } = await db.from("investor_outreach")
    .select("id,investor_id,kind,status,to_email,subject,body_text,gmail_thread_id,approved_by_user_id")
    .eq("id", outreachId)
    .maybeSingle();
  if (error || !outreach) throw new Error("Investor outreach was not found.");
  if (outreach.status !== "approved") throw new Error("Investor outreach must be explicitly approved before sending.");
  if (!outreach.approved_by_user_id) throw new Error("Investor outreach approval record is missing.");

  const sendingAt = new Date().toISOString();
  const { data: locked } = await db.from("investor_outreach")
    .update({ status: "sending", updated_at: sendingAt })
    .eq("id", outreachId)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (!locked) throw new Error("Investor outreach is already being processed.");

  try {
    const { data: investor } = await db.from("investor_leads").select("gmail_thread_id").eq("id", outreach.investor_id).maybeSingle();
    const threadId = outreach.gmail_thread_id || investor?.gmail_thread_id || null;
    const sent = await sendInvestorGmailMessage({
      to: outreach.to_email,
      subject: outreach.subject,
      bodyText: outreach.body_text,
      threadId,
    });
    const now = new Date().toISOString();
    const settings = await getInvestorRelationsSettings();
    const firstFollowUpDays = settings.followUpDays[0] ?? 4;
    const nextFollowUpAt = new Date(Date.now() + firstFollowUpDays * 24 * 60 * 60 * 1000).toISOString();

    await db.from("investor_outreach").update({
      status: "sent",
      sent_at: now,
      gmail_message_id: sent.messageId,
      gmail_thread_id: sent.threadId,
      send_error: null,
      updated_at: now,
    }).eq("id", outreachId);
    await db.from("investor_leads").update({
      status: outreach.kind === "reply" ? "interested" : "contacted",
      last_contacted_at: now,
      next_follow_up_at: nextFollowUpAt,
      gmail_thread_id: sent.threadId,
      gmail_last_message_id: sent.messageId,
      updated_at: now,
    }).eq("id", outreach.investor_id);
    await db.from("investor_activity").insert({
      investor_id: outreach.investor_id,
      outreach_id: outreachId,
      action: "outreach_sent_gmail",
      actor_type: "admin",
      actor_user_id: userId,
      metadata: { gmail_message_id: sent.messageId, gmail_thread_id: sent.threadId },
    });
    return sent;
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message.slice(0, 500) : "Investor Gmail send failed.";
    await db.from("investor_outreach").update({ status: "failed", send_error: message, updated_at: new Date().toISOString() }).eq("id", outreachId);
    throw sendError;
  }
}

async function generateReplyDraft({ investor: investorInput, inboundText, inboundSubject, inboundFrom }: {
  investor: Record<string, unknown>;
  inboundText: string;
  inboundSubject: string;
  inboundFrom: string;
}) {
  const settings = await getInvestorRelationsSettings();
  const provider = getMarketingAIProvider();
  const response = await provider.generate({
    taskType: "investor_reply_analysis",
    responseFormat: "json",
    metadata: { workflow: "investor_reply_v1", investor_id: investorInput.id },
    messages: [
      {
        role: "system",
        content: `You are MLAMH Investor Relations AI. Analyze a real investor reply and prepare the next response for CEO/admin approval. Never invent facts or commitments. If the investor asks for information not present in the master brief, say it should be prepared rather than fabricating it. Return JSON only.`,
      },
      {
        role: "user",
        content: `MLAMH master brief:\n${settings.masterBrief}\n\nInvestor record:\n${JSON.stringify(investorInput, null, 2)}\n\nInbound email from: ${inboundFrom}\nSubject: ${inboundSubject}\nBody:\n${inboundText.slice(0, 12000)}\n\nClassify the reply as one of: positive, meeting, info_request, not_now, pass, other. Then draft a concise reply.\nReturn: {"classification":"", "summary":"", "subject":"", "body":"", "suggested_follow_up_days": null}`,
      },
    ],
  });
  const parsed = (asObject(parseAIJson(response.content)) ?? {}) as ReplyAnalysis;
  return {
    classification: asString(parsed.classification, 40).toLowerCase(),
    summary: asString(parsed.summary, 2000),
    subject: asString(parsed.subject, 300),
    body: asString(parsed.body, 12000),
    suggestedFollowUpDays: asNumber(parsed.suggested_follow_up_days),
    aiMetadata: { provider: response.provider, model: response.model ?? null, usage: response.usage ?? {} },
  };
}

export async function syncInvestorReplies({ limit = 20 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const gmail = await getInvestorGmailConnectionState();
  if (gmail.status !== "connected") return { connected: false, checked: 0, newReplies: 0, draftsCreated: 0 };

  const { data: investors, error } = await db.from("investor_leads")
    .select("*")
    .not("gmail_thread_id", "is", null)
    .in("status", ["contacted", "follow_up", "interested", "meeting", "due_diligence"])
    .order("last_contacted_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 50)));
  if (error) throw new Error("Investor reply sync could not load active threads.");

  let checked = 0;
  let newReplies = 0;
  let draftsCreated = 0;

  for (const investor of investors ?? []) {
    checked += 1;
    try {
      const replies = await readInvestorGmailThread(investor.gmail_thread_id);
      const latest = replies.at(-1);
      if (!latest || latest.id === investor.gmail_last_message_id) continue;
      newReplies += 1;
      const analysis = await generateReplyDraft({
        investor: investor as Record<string, unknown>,
        inboundText: latest.text,
        inboundSubject: latest.subject,
        inboundFrom: latest.from,
      });
      const now = new Date().toISOString();
      const statusByClassification: Record<string, string> = {
        positive: "interested",
        meeting: "meeting",
        info_request: "interested",
        not_now: "follow_up",
        pass: "passed",
        other: "interested",
      };
      const nextStatus = statusByClassification[analysis.classification] || "interested";
      const followUpDays = analysis.suggestedFollowUpDays && analysis.suggestedFollowUpDays > 0
        ? Math.min(Math.round(analysis.suggestedFollowUpDays), 180)
        : null;
      await db.from("investor_leads").update({
        status: nextStatus,
        gmail_last_message_id: latest.id,
        next_follow_up_at: followUpDays ? new Date(Date.now() + followUpDays * 86400000).toISOString() : null,
        updated_at: now,
      }).eq("id", investor.id);
      await db.from("investor_activity").insert({
        investor_id: investor.id,
        action: "investor_reply_received",
        actor_type: "gmail",
        summary: analysis.summary || null,
        metadata: {
          gmail_message_id: latest.id,
          gmail_thread_id: latest.threadId,
          classification: analysis.classification,
          from: latest.from,
        },
      });

      if (analysis.classification !== "pass" && analysis.subject && analysis.body) {
        const recipient = extractEmail(latest.from) || investor.contact_email;
        if (recipient) {
          const { data: draft } = await db.from("investor_outreach").insert({
            investor_id: investor.id,
            kind: "reply",
            status: "pending_approval",
            to_email: recipient,
            subject: analysis.subject,
            body_text: analysis.body,
            rationale: analysis.summary || null,
            positioning_angle: `Reply classification: ${analysis.classification || "other"}`,
            ai_metadata: analysis.aiMetadata,
            approval_requested_at: now,
            gmail_thread_id: latest.threadId,
          }).select("id").maybeSingle();
          if (draft?.id) {
            draftsCreated += 1;
            await db.from("investor_activity").insert({
              investor_id: investor.id,
              outreach_id: draft.id,
              action: "reply_draft_created",
              actor_type: "ai",
              summary: analysis.summary || null,
            });
          }
        }
      }
    } catch (threadError) {
      console.error("[InvestorRelations sync thread]", investor.id, threadError instanceof Error ? threadError.message : "thread_sync_failed");
    }
  }
  return { connected: true, checked, newReplies, draftsCreated };
}

export async function prepareDueInvestorFollowUps({ limit = 10 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data: investors, error } = await db.from("investor_leads")
    .select("*")
    .in("status", ["contacted", "follow_up", "interested"])
    .lte("next_follow_up_at", now)
    .not("contact_email", "is", null)
    .order("next_follow_up_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 25)));
  if (error) throw new Error("Due investor follow-ups could not be loaded.");

  const settings = await getInvestorRelationsSettings();
  const provider = getMarketingAIProvider();
  let created = 0;
  for (const investor of investors ?? []) {
    const { data: existing } = await db.from("investor_outreach")
      .select("id")
      .eq("investor_id", investor.id)
      .eq("kind", "follow_up")
      .eq("status", "pending_approval")
      .maybeSingle();
    if (existing?.id) continue;

    const response = await provider.generate({
      taskType: "investor_follow_up_draft",
      responseFormat: "json",
      metadata: { workflow: "investor_follow_up_v1", investor_id: investor.id },
      messages: [
        {
          role: "system",
          content: `Write a short, non-pushy investor follow-up for MLAMH. Do not invent traction or urgency. Keep it under 100 words and return JSON only.`,
        },
        {
          role: "user",
          content: `MLAMH master brief:\n${settings.masterBrief}\n\nInvestor record:\n${JSON.stringify(investor, null, 2)}\n\nReturn {"subject":"", "body":"", "rationale":""}.`,
        },
      ],
    });
    const parsed = asObject(parseAIJson(response.content)) ?? {};
    const subject = asString(parsed.subject, 300);
    const body = asString(parsed.body, 12000);
    if (!subject || !body) continue;
    const { data: draft } = await db.from("investor_outreach").insert({
      investor_id: investor.id,
      kind: "follow_up",
      status: "pending_approval",
      to_email: investor.contact_email,
      subject,
      body_text: body,
      rationale: asNullableString(parsed.rationale, 3000),
      ai_metadata: { provider: response.provider, model: response.model ?? null, usage: response.usage ?? {} },
      approval_requested_at: new Date().toISOString(),
      gmail_thread_id: investor.gmail_thread_id,
    }).select("id").maybeSingle();
    if (!draft?.id) continue;
    created += 1;
    await db.from("investor_leads").update({ status: "follow_up", updated_at: new Date().toISOString() }).eq("id", investor.id);
    await db.from("investor_activity").insert({
      investor_id: investor.id,
      outreach_id: draft.id,
      action: "follow_up_draft_created",
      actor_type: "ai",
      summary: asNullableString(parsed.rationale, 1000),
    });
  }
  return { due: (investors ?? []).length, draftsCreated: created };
}
