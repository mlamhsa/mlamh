import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvestorRelationsSettings } from "./service";

const GCC = new Set(["SA", "AE", "QA", "KW", "BH", "OM"]);
const ROUTE_TYPES = new Set(["email", "application_form", "contact_form", "linkedin", "website"]);

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function str(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function nullable(value: unknown, max = 1000) {
  return str(value, max) || null;
}
function strings(value: unknown, maxItems = 20, maxLength = 1000) {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string").map((v) => v.trim().slice(0, maxLength)).filter(Boolean).slice(0, maxItems);
}
function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function fitScore(value: unknown) {
  const n = numberValue(value);
  return n === null ? null : Math.max(0, Math.min(100, Math.round(n)));
}
function email(value: unknown) {
  const candidate = str(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}
function parseJson(content: string) {
  const trimmed = content.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(trimmed.slice(first, last + 1));
  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    try { return JSON.parse(candidate) as unknown; } catch { /* try next */ }
  }
  throw new Error("Investor research returned invalid JSON.");
}
function orgType(value: unknown) {
  const candidate = str(value, 50).toLowerCase();
  return ["vc", "angel", "family_office", "corporate_vc", "strategic", "accelerator", "government", "other"].includes(candidate) ? candidate : "other";
}
function canonical(value: unknown) {
  const raw = str(value, 1000);
  if (!/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw);
    let host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (/^(sa|ae|uk|ch)\.linkedin\.com$/.test(host)) host = "linkedin.com";
    const path = ((url.pathname || "/").replace(/\/+$/, "") || "/").toLowerCase();
    return { raw, host, path };
  } catch { return null; }
}
function matches(candidate: unknown, evidence: unknown) {
  const a = canonical(candidate);
  const b = canonical(evidence);
  if (!a || !b || a.host !== b.host) return false;
  if (a.host === "linkedin.com") return a.path === b.path;
  if (a.path === "/" || b.path === "/") return true;
  return a.path.startsWith(b.path) || b.path.startsWith(a.path);
}
function webSources(parsed: Record<string, unknown> | null) {
  if (!Array.isArray(parsed?.web_sources)) return [];
  return (parsed.web_sources as Array<Record<string, unknown>>).map((source) => str(source.url, 1000)).filter((url) => /^https?:\/\//i.test(url));
}
function matchedSources(value: unknown, sources: string[]) {
  const requested = strings(value, 20, 1000).filter((url) => /^https?:\/\//i.test(url));
  return [...new Set(sources.filter((source) => requested.some((candidate) => matches(candidate, source))))].slice(0, 20);
}
function personalLinkedIn(value: unknown) {
  const url = canonical(value);
  return Boolean(url && url.host === "linkedin.com" && url.path.startsWith("/in/"));
}
function allowedCountry(value: unknown) {
  return GCC.has(str(value, 8).toUpperCase());
}

type Evidence = { url: string; supports: string[]; claim: string };
function verifiedEvidence(value: unknown, sources: string[]): Evidence[] {
  if (!Array.isArray(value)) return [];
  const output: Evidence[] = [];
  for (const raw of value) {
    const item = obj(raw);
    if (!item) continue;
    const requestedUrl = str(item.url, 1000);
    const verifiedUrl = sources.find((source) => matches(requestedUrl, source));
    if (!verifiedUrl) continue;
    output.push({
      url: verifiedUrl,
      supports: strings(item.supports, 12, 80).map((field) => field.toLowerCase()),
      claim: str(item.claim, 1000),
    });
  }
  return output;
}
function supports(evidence: Evidence[], field: string) {
  return evidence.some((item) => item.supports.includes(field));
}

export async function discoverVerifiedInvestors({ limit = 8 }: { limit?: number } = {}) {
  const settings = await getInvestorRelationsSettings();
  const db = createAdminClient();
  const { data: existing } = await db.from("investor_leads").select("organization_name,website_url").limit(300);
  const excluded = (existing ?? []).map((row) => `${row.organization_name}${row.website_url ? ` — ${row.website_url}` : ""}`).slice(0, 200);
  const provider = getMarketingAIProvider();
  const response = await provider.generate({
    taskType: "lead_enrichment",
    responseFormat: "json",
    metadata: { workflow: "investor_discovery_v1", evidence_gate: true },
    messages: [
      {
        role: "system",
        content: "Discover only real GCC investors using current public web evidence. Never fabricate firms, people, websites, LinkedIn profiles, investment claims or contact details. Each investor must include source_urls copied from sources actually used during web research. Prefer fewer verified results over speculative ones.",
      },
      {
        role: "user",
        content: `MLAMH master brief (Arabic):\n${settings.masterBriefAr}\n\nMLAMH master brief (English):\n${settings.masterBriefEn}\n\nTarget stages: ${settings.targetStages.join(", ")}\nTarget sectors: ${settings.targetSectors.join(", ")}\nMinimum desired fit: ${settings.minimumFitScore}/100.\n\nAlready known investors:\n${excluded.length ? excluded.join("\n") : "None."}\n\nFind up to ${Math.max(1, Math.min(limit, 12))} NEW investors. Geography: Saudi Arabia first, UAE second, then Qatar, Kuwait, Bahrain and Oman only. Include VCs, angels, family offices, corporate venture, strategic investors, accelerators and government investment programs.\n\nReturn exactly this JSON shape: {"investors":[{"organization_name":"","organization_type":"vc|angel|family_office|corporate_vc|strategic|accelerator|government|other","website_url":null,"linkedin_url":null,"country_code":null,"city":null,"investment_stage":[],"sector_focus":[],"geography_focus":[],"cheque_min":null,"cheque_max":null,"cheque_currency":null,"thesis_summary":"","fit_score":0,"fit_rationale":"","contact_name":null,"contact_role":null,"contact_linkedin_url":null,"source_urls":[]}]}`,
      },
    ],
  });

  const parsed = obj(parseJson(response.content));
  const sources = webSources(parsed);
  const items = Array.isArray(parsed?.investors) ? parsed.investors as Array<Record<string, unknown>> : [];
  const created: number[] = [];
  const skipped: string[] = [];

  for (const item of items.slice(0, Math.max(1, Math.min(limit, 12)))) {
    const name = str(item.organization_name, 300);
    if (!name || !allowedCountry(item.country_code)) {
      if (name) skipped.push(`${name} (invalid geography)`);
      continue;
    }
    const verifiedSources = matchedSources(item.source_urls, sources);
    if (!verifiedSources.length) {
      skipped.push(`${name} (no verified web evidence)`);
      continue;
    }
    const { data: duplicate } = await db.from("investor_leads").select("id").ilike("organization_name", name).limit(1).maybeSingle();
    if (duplicate?.id) {
      skipped.push(`${name} (duplicate)`);
      continue;
    }

    const websiteCandidate = nullable(item.website_url, 1000);
    const website = websiteCandidate && sources.some((source) => matches(websiteCandidate, source)) ? websiteCandidate : null;
    const companyLinkedInCandidate = nullable(item.linkedin_url, 1000);
    const companyLinkedIn = companyLinkedInCandidate && sources.some((source) => matches(companyLinkedInCandidate, source)) ? companyLinkedInCandidate : null;
    const personLinkedInCandidate = nullable(item.contact_linkedin_url, 1000);
    const personVerified = Boolean(personLinkedInCandidate && personalLinkedIn(personLinkedInCandidate) && sources.some((source) => matches(personLinkedInCandidate, source)));
    const score = fitScore(item.fit_score);

    const row = {
      organization_name: name,
      organization_type: orgType(item.organization_type),
      website_url: website,
      linkedin_url: companyLinkedIn,
      country_code: str(item.country_code, 8).toUpperCase(),
      city: nullable(item.city, 160),
      investment_stage: strings(item.investment_stage, 20, 200),
      sector_focus: strings(item.sector_focus, 20, 200),
      geography_focus: strings(item.geography_focus, 20, 200),
      cheque_min: numberValue(item.cheque_min),
      cheque_max: numberValue(item.cheque_max),
      cheque_currency: nullable(item.cheque_currency, 12)?.toUpperCase() ?? null,
      thesis_summary: nullable(item.thesis_summary, 3000),
      fit_score: score,
      fit_rationale: nullable(item.fit_rationale, 3000),
      contact_name: personVerified ? nullable(item.contact_name, 300) : null,
      contact_role: personVerified ? nullable(item.contact_role, 300) : null,
      contact_email: null,
      contact_linkedin_url: personVerified ? personLinkedInCandidate : null,
      contact_route_url: personVerified ? personLinkedInCandidate : website,
      contact_route_type: personVerified ? "linkedin" : website ? "website" : null,
      status: score !== null && score >= settings.minimumFitScore ? "qualified" : "discovered",
      source_urls: verifiedSources,
      research_payload: { ai_provider: response.provider, ai_model: response.model ?? null, usage: response.usage ?? {}, evidence_gate: true, discovered_at: new Date().toISOString() },
      last_researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await db.from("investor_leads").insert(row).select("id").single();
    if (error || !inserted) continue;
    created.push(inserted.id);
    await db.from("investor_activity").insert({ investor_id: inserted.id, action: "investor_discovered", actor_type: "ai", summary: row.fit_rationale, metadata: { fit_score: score, source_urls: verifiedSources, evidence_gate: true } });
  }

  return { discovered: created.length, investorIds: created, skipped, provider: response.provider, model: response.model ?? null };
}

export async function enrichInvestorContacts({ limit = 12 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const { data: leads, error } = await db.from("investor_leads")
    .select("id,organization_name,organization_type,website_url,country_code,fit_score,contact_name,contact_role,contact_email,contact_linkedin_url,contact_route_url,contact_route_type,source_urls,research_payload")
    .in("status", ["qualified", "discovered"])
    .order("fit_score", { ascending: false, nullsFirst: false })
    .limit(Math.max(1, Math.min(limit, 20)));
  if (error) throw new Error("Investor contact enrichment could not load leads.");
  if (!leads?.length) return { checked: 0, enriched: 0, withEmail: 0, withOfficialRoute: 0, withLinkedIn: 0 };

  const provider = getMarketingAIProvider();
  const response = await provider.generate({
    taskType: "lead_enrichment",
    responseFormat: "json",
    metadata: { workflow: "investor_discovery_v1", phase: "contact_enrichment_v1" },
    messages: [
      {
        role: "system",
        content: "Enrich existing investor records using current public web evidence only. Search the official website for Contact, Apply, Pitch, Submit, Portfolio and Team pages. Use a business email only when explicitly published. Never infer an email pattern. Find the best investment decision-maker and a public personal LinkedIn /in/ profile when verifiable. Every non-null field must have claim-level source evidence from a page actually visited during web search.",
      },
      {
        role: "user",
        content: `Investor leads:\n${JSON.stringify(leads.map((lead) => ({ id: lead.id, organization_name: lead.organization_name, organization_type: lead.organization_type, website_url: lead.website_url, country_code: lead.country_code, contact_name: lead.contact_name, contact_role: lead.contact_role, contact_linkedin_url: lead.contact_linkedin_url })), null, 2)}\n\nFor each lead, find the strongest public contact route in this order: published investment/pitch email; official application/pitch form; official contact form; verified decision-maker LinkedIn; official website.\n\nReturn exactly: {"enrichments":[{"lead_id":0,"website_url":null,"contact_email":null,"contact_name":null,"contact_role":null,"contact_linkedin_url":null,"contact_route_url":null,"contact_route_type":"email|application_form|contact_form|linkedin|website|null","source_evidence":[{"url":"","supports":["website_url","contact_email","contact_name","contact_role","contact_linkedin_url","contact_route_url"],"claim":""}]}]}`,
      },
    ],
  });

  const parsed = obj(parseJson(response.content));
  const sources = webSources(parsed);
  const enrichments = Array.isArray(parsed?.enrichments) ? parsed.enrichments as Array<Record<string, unknown>> : [];
  let enriched = 0;
  let withEmail = 0;
  let withOfficialRoute = 0;
  let withLinkedIn = 0;

  for (const item of enrichments) {
    const leadId = numberValue(item.lead_id);
    const existing = leads.find((lead) => lead.id === leadId);
    if (!existing) continue;
    const evidence = verifiedEvidence(item.source_evidence, sources);
    if (!evidence.length) continue;

    const websiteCandidate = nullable(item.website_url, 1000);
    const emailCandidate = email(item.contact_email);
    const linkedinCandidate = nullable(item.contact_linkedin_url, 1000);
    const routeCandidate = nullable(item.contact_route_url, 1000);
    const routeTypeCandidate = str(item.contact_route_type, 40).toLowerCase();
    const routeType = ROUTE_TYPES.has(routeTypeCandidate) ? routeTypeCandidate : null;

    const website = websiteCandidate && supports(evidence, "website_url") && sources.some((source) => matches(websiteCandidate, source)) ? websiteCandidate : existing.website_url;
    const contactEmail = emailCandidate && supports(evidence, "contact_email") ? emailCandidate : existing.contact_email;
    const linkedinVerified = Boolean(linkedinCandidate && personalLinkedIn(linkedinCandidate) && supports(evidence, "contact_linkedin_url") && sources.some((source) => matches(linkedinCandidate, source)));
    const contactLinkedIn = linkedinVerified ? linkedinCandidate : existing.contact_linkedin_url;
    const contactName = linkedinVerified && supports(evidence, "contact_name") ? nullable(item.contact_name, 300) : existing.contact_name;
    const contactRole = linkedinVerified && supports(evidence, "contact_role") ? nullable(item.contact_role, 300) : existing.contact_role;
    const routeVerified = Boolean(routeCandidate && routeType && supports(evidence, "contact_route_url") && (routeType === "email" || sources.some((source) => matches(routeCandidate, source))));

    let contactRouteUrl: string | null = routeVerified ? routeCandidate : null;
    let contactRouteType: string | null = routeVerified ? routeType : null;
    if (!contactRouteUrl && contactEmail) {
      contactRouteUrl = `mailto:${contactEmail}`;
      contactRouteType = "email";
    } else if (!contactRouteUrl && contactLinkedIn) {
      contactRouteUrl = contactLinkedIn;
      contactRouteType = "linkedin";
    } else if (!contactRouteUrl && website) {
      contactRouteUrl = website;
      contactRouteType = "website";
    }

    const oldSources = Array.isArray(existing.source_urls) ? existing.source_urls.filter((value): value is string => typeof value === "string") : [];
    const mergedSources = [...new Set([...oldSources, ...evidence.map((entry) => entry.url)])].slice(0, 30);
    const previousPayload = obj(existing.research_payload) ?? {};
    const { error: updateError } = await db.from("investor_leads").update({
      website_url: website,
      contact_email: contactEmail,
      contact_name: contactName,
      contact_role: contactRole,
      contact_linkedin_url: contactLinkedIn,
      contact_route_url: contactRouteUrl,
      contact_route_type: contactRouteType,
      source_urls: mergedSources,
      research_payload: { ...previousPayload, contact_enrichment: { enriched_at: new Date().toISOString(), ai_provider: response.provider, ai_model: response.model ?? null, evidence } },
      last_researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
    if (updateError) continue;

    enriched += 1;
    if (contactEmail) withEmail += 1;
    if (contactRouteType === "application_form" || contactRouteType === "contact_form") withOfficialRoute += 1;
    if (contactLinkedIn) withLinkedIn += 1;
    await db.from("investor_activity").insert({
      investor_id: existing.id,
      action: "investor_contact_enriched",
      actor_type: "ai",
      summary: contactEmail ? "Verified public investor email found." : contactRouteType ? `Verified contact route: ${contactRouteType}.` : "Investor research refreshed.",
      metadata: { contact_route_type: contactRouteType, contact_route_url: contactRouteUrl, has_email: Boolean(contactEmail), has_linkedin: Boolean(contactLinkedIn), source_urls: evidence.map((entry) => entry.url) },
    });
  }

  return { checked: leads.length, enriched, withEmail, withOfficialRoute, withLinkedIn };
}
