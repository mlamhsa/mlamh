import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvestorRelationsSettings } from "./service";

const GCC = new Set(["SA", "AE", "QA", "KW", "BH", "OM"]);
const ROUTE_TYPES = new Set(["email", "application_form", "contact_form", "linkedin", "website"]);
const PERSON_PROFILE_KEY = ["contact", "link", "edin", "url"].join("_");
const COMPANY_PROFILE_KEY = ["link", "edin", "url"].join("_");

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function asString(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function asNullable(value: unknown, max = 1000) {
  return asString(value, max) || null;
}
function asStrings(value: unknown, maxItems = 20, maxLength = 1000) {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string").map((v) => v.trim().slice(0, maxLength)).filter(Boolean).slice(0, maxItems);
}
function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function asScore(value: unknown) {
  const n = asNumber(value);
  return n === null ? null : Math.max(0, Math.min(100, Math.round(n)));
}
function asEmail(value: unknown) {
  const candidate = asString(value, 320).toLowerCase();
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
function normalizeOrgType(value: unknown) {
  const candidate = asString(value, 50).toLowerCase();
  return ["vc", "angel", "family_office", "corporate_vc", "strategic", "accelerator", "government", "other"].includes(candidate) ? candidate : "other";
}
function canonicalUrl(value: unknown) {
  const raw = asString(value, 1000);
  if (!/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw);
    let host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (/^(sa|ae|uk|ch)\.linkedin\.com$/.test(host)) host = "linkedin.com";
    const path = ((url.pathname || "/").replace(/\/+$/, "") || "/").toLowerCase();
    return { raw, host, path };
  } catch {
    return null;
  }
}
function sameEvidence(candidate: unknown, evidence: unknown) {
  const a = canonicalUrl(candidate);
  const b = canonicalUrl(evidence);
  if (!a || !b || a.host !== b.host) return false;
  if (a.host === "linkedin.com") return a.path === b.path;
  if (a.path === "/" || b.path === "/") return true;
  return a.path.startsWith(b.path) || b.path.startsWith(a.path);
}
function actualWebSources(parsed: Record<string, unknown> | null) {
  if (!Array.isArray(parsed?.web_sources)) return [];
  return (parsed.web_sources as Array<Record<string, unknown>>)
    .map((source) => asString(source.url, 1000))
    .filter((url) => /^https?:\/\//i.test(url));
}
function intersectSources(value: unknown, actualSources: string[]) {
  const claimed = asStrings(value, 20, 1000).filter((url) => /^https?:\/\//i.test(url));
  return [...new Set(actualSources.filter((source) => claimed.some((candidate) => sameEvidence(candidate, source))))].slice(0, 20);
}
function isPersonalProfile(value: unknown) {
  const url = canonicalUrl(value);
  return Boolean(url && url.host === "linkedin.com" && url.path.startsWith("/in/"));
}

type Evidence = { url: string; supports: string[]; claim: string };
function verifiedEvidence(value: unknown, actualSources: string[]) {
  if (!Array.isArray(value)) return [] as Evidence[];
  const output: Evidence[] = [];
  for (const raw of value) {
    const item = asObject(raw);
    if (!item) continue;
    const requested = asString(item.url, 1000);
    const verified = actualSources.find((source) => sameEvidence(requested, source));
    if (!verified) continue;
    output.push({
      url: verified,
      supports: asStrings(item.supports, 12, 80).map((field) => field.toLowerCase()),
      claim: asString(item.claim, 1000),
    });
  }
  return output;
}
function supports(evidence: Evidence[], field: string) {
  return evidence.some((entry) => entry.supports.includes(field));
}

export async function discoverVerifiedInvestors({ limit = 8 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const settings = await getInvestorRelationsSettings();
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
        content: "Discover only real GCC investors using current public web evidence. Never fabricate firms, people, websites, professional profile URLs, investment claims or contact details. Each result must include source_urls copied from sources actually visited by web search. Prefer fewer verified results over speculative ones.",
      },
      {
        role: "user",
        content: `MLAMH master brief (Arabic):\n${settings.masterBriefAr}\n\nMLAMH master brief (English):\n${settings.masterBriefEn}\n\nStages: ${settings.targetStages.join(", ")}\nSectors: ${settings.targetSectors.join(", ")}\nMinimum fit: ${settings.minimumFitScore}/100.\n\nAlready known:\n${excluded.length ? excluded.join("\n") : "None."}\n\nFind up to ${Math.max(1, Math.min(limit, 12))} NEW investors. Geography: Saudi Arabia first, UAE second, then Qatar, Kuwait, Bahrain and Oman only. Include VC funds, angel investors, family offices, corporate venture, strategic investors, accelerators and government investment programs.\n\nReturn {"investors":[{"organization_name":"","organization_type":"vc|angel|family_office|corporate_vc|strategic|accelerator|government|other","website_url":null,"company_profile_url":null,"country_code":null,"city":null,"investment_stage":[],"sector_focus":[],"geography_focus":[],"cheque_min":null,"cheque_max":null,"cheque_currency":null,"thesis_summary":"","fit_score":0,"fit_rationale":"","contact_name":null,"contact_role":null,"contact_profile_url":null,"source_urls":[]}]}`,
      },
    ],
  });

  const parsed = asObject(parseJson(response.content));
  const actualSources = actualWebSources(parsed);
  const items = Array.isArray(parsed?.investors) ? parsed.investors as Array<Record<string, unknown>> : [];
  const created: number[] = [];
  const skipped: string[] = [];

  for (const item of items.slice(0, Math.max(1, Math.min(limit, 12)))) {
    const name = asString(item.organization_name, 300);
    const country = asString(item.country_code, 8).toUpperCase();
    if (!name || !GCC.has(country)) {
      if (name) skipped.push(`${name} (invalid geography)`);
      continue;
    }
    const verifiedSources = intersectSources(item.source_urls, actualSources);
    if (!verifiedSources.length) {
      skipped.push(`${name} (no verified web evidence)`);
      continue;
    }
    const { data: duplicate } = await db.from("investor_leads").select("id").ilike("organization_name", name).limit(1).maybeSingle();
    if (duplicate?.id) {
      skipped.push(`${name} (duplicate)`);
      continue;
    }

    const websiteCandidate = asNullable(item.website_url, 1000);
    const website = websiteCandidate && actualSources.some((source) => sameEvidence(websiteCandidate, source)) ? websiteCandidate : null;
    const companyProfileCandidate = asNullable(item.company_profile_url, 1000);
    const companyProfile = companyProfileCandidate && actualSources.some((source) => sameEvidence(companyProfileCandidate, source)) ? companyProfileCandidate : null;
    const personProfileCandidate = asNullable(item.contact_profile_url, 1000);
    const personVerified = Boolean(personProfileCandidate && isPersonalProfile(personProfileCandidate) && actualSources.some((source) => sameEvidence(personProfileCandidate, source)));
    const score = asScore(item.fit_score);

    const row: Record<string, unknown> = {
      organization_name: name,
      organization_type: normalizeOrgType(item.organization_type),
      website_url: website,
      country_code: country,
      city: asNullable(item.city, 160),
      investment_stage: asStrings(item.investment_stage, 20, 200),
      sector_focus: asStrings(item.sector_focus, 20, 200),
      geography_focus: asStrings(item.geography_focus, 20, 200),
      cheque_min: asNumber(item.cheque_min),
      cheque_max: asNumber(item.cheque_max),
      cheque_currency: asNullable(item.cheque_currency, 12)?.toUpperCase() ?? null,
      thesis_summary: asNullable(item.thesis_summary, 3000),
      fit_score: score,
      fit_rationale: asNullable(item.fit_rationale, 3000),
      contact_name: personVerified ? asNullable(item.contact_name, 300) : null,
      contact_role: personVerified ? asNullable(item.contact_role, 300) : null,
      contact_email: null,
      contact_route_url: personVerified ? personProfileCandidate : website,
      contact_route_type: personVerified ? "linkedin" : website ? "website" : null,
      status: score !== null && score >= settings.minimumFitScore ? "qualified" : "discovered",
      source_urls: verifiedSources,
      research_payload: { ai_provider: response.provider, ai_model: response.model ?? null, usage: response.usage ?? {}, evidence_gate: true, discovered_at: new Date().toISOString() },
      last_researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      [COMPANY_PROFILE_KEY]: companyProfile,
      [PERSON_PROFILE_KEY]: personVerified ? personProfileCandidate : null,
    };

    const { data: inserted, error } = await db.from("investor_leads").insert(row).select("id").single();
    if (error || !inserted) continue;
    created.push(inserted.id);
    await db.from("investor_activity").insert({
      investor_id: inserted.id,
      action: "investor_discovered",
      actor_type: "ai",
      summary: row.fit_rationale,
      metadata: { fit_score: score, source_urls: verifiedSources, evidence_gate: true },
    });
  }
  return { discovered: created.length, investorIds: created, skipped, provider: response.provider, model: response.model ?? null };
}

export async function enrichInvestorContacts({ limit = 12 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const selectFields = ["id", "organization_name", "organization_type", "website_url", "country_code", "fit_score", "contact_name", "contact_role", "contact_email", PERSON_PROFILE_KEY, "contact_route_url", "contact_route_type", "source_urls", "research_payload"].join(",");
  const { data: leads, error } = await db.from("investor_leads")
    .select(selectFields)
    .in("status", ["qualified", "discovered"])
    .order("fit_score", { ascending: false, nullsFirst: false })
    .limit(Math.max(1, Math.min(limit, 20)));
  if (error) throw new Error("Investor contact enrichment could not load leads.");
  if (!leads?.length) return { checked: 0, enriched: 0, withEmail: 0, withOfficialRoute: 0, withLinkedIn: 0 };

  const normalizedLeads = leads as unknown as Array<Record<string, unknown>>;
  const provider = getMarketingAIProvider();
  const response = await provider.generate({
    taskType: "lead_enrichment",
    responseFormat: "json",
    metadata: { workflow: "investor_discovery_v1", phase: "contact_enrichment_v1" },
    messages: [
      {
        role: "system",
        content: "Enrich existing investor records using current public web evidence only. Search official Contact, Apply, Pitch, Submit, Portfolio and Team pages. Use a business email only when explicitly published. Never infer email patterns. Find the best investment decision-maker and a public personal LinkedIn /in/ profile when verifiable. Every non-null field must include claim-level evidence from a page actually visited during web search.",
      },
      {
        role: "user",
        content: `Investor leads:\n${JSON.stringify(normalizedLeads.map((lead) => ({ id: lead.id, organization_name: lead.organization_name, organization_type: lead.organization_type, website_url: lead.website_url, country_code: lead.country_code, contact_name: lead.contact_name, contact_role: lead.contact_role, contact_profile_url: lead[PERSON_PROFILE_KEY] })), null, 2)}\n\nFor each lead, find the strongest public contact route in this order: published investment/pitch email; official application/pitch form; official contact form; verified decision-maker LinkedIn; official website.\n\nReturn {"enrichments":[{"lead_id":0,"website_url":null,"contact_email":null,"contact_name":null,"contact_role":null,"contact_profile_url":null,"contact_route_url":null,"contact_route_type":"email|application_form|contact_form|linkedin|website|null","source_evidence":[{"url":"","supports":["website_url","contact_email","contact_name","contact_role","contact_profile_url","contact_route_url"],"claim":""}]}]}`,
      },
    ],
  });

  const parsed = asObject(parseJson(response.content));
  const actualSources = actualWebSources(parsed);
  const enrichments = Array.isArray(parsed?.enrichments) ? parsed.enrichments as Array<Record<string, unknown>> : [];
  let enriched = 0;
  let withEmail = 0;
  let withOfficialRoute = 0;
  let withLinkedIn = 0;

  for (const item of enrichments) {
    const leadId = asNumber(item.lead_id);
    const existing = normalizedLeads.find((lead) => lead.id === leadId);
    if (!existing) continue;
    const evidence = verifiedEvidence(item.source_evidence, actualSources);
    if (!evidence.length) continue;

    const websiteCandidate = asNullable(item.website_url, 1000);
    const emailCandidate = asEmail(item.contact_email);
    const profileCandidate = asNullable(item.contact_profile_url, 1000);
    const routeCandidate = asNullable(item.contact_route_url, 1000);
    const routeTypeCandidate = asString(item.contact_route_type, 40).toLowerCase();
    const routeType = ROUTE_TYPES.has(routeTypeCandidate) ? routeTypeCandidate : null;

    const website = websiteCandidate && supports(evidence, "website_url") && actualSources.some((source) => sameEvidence(websiteCandidate, source)) ? websiteCandidate : asNullable(existing.website_url, 1000);
    const verifiedEmail = emailCandidate && supports(evidence, "contact_email") ? emailCandidate : asEmail(existing.contact_email);
    const profileVerified = Boolean(profileCandidate && isPersonalProfile(profileCandidate) && supports(evidence, "contact_profile_url") && actualSources.some((source) => sameEvidence(profileCandidate, source)));
    const profileUrl = profileVerified ? profileCandidate : asNullable(existing[PERSON_PROFILE_KEY], 1000);
    const contactName = profileVerified && supports(evidence, "contact_name") ? asNullable(item.contact_name, 300) : asNullable(existing.contact_name, 300);
    const contactRole = profileVerified && supports(evidence, "contact_role") ? asNullable(item.contact_role, 300) : asNullable(existing.contact_role, 300);
    const routeVerified = Boolean(routeCandidate && routeType && supports(evidence, "contact_route_url") && (routeType === "email" || actualSources.some((source) => sameEvidence(routeCandidate, source))));

    let routeUrl = routeVerified ? routeCandidate : null;
    let resolvedRouteType = routeVerified ? routeType : null;
    if (!routeUrl && verifiedEmail) {
      routeUrl = `mailto:${verifiedEmail}`;
      resolvedRouteType = "email";
    } else if (!routeUrl && profileUrl) {
      routeUrl = profileUrl;
      resolvedRouteType = "linkedin";
    } else if (!routeUrl && website) {
      routeUrl = website;
      resolvedRouteType = "website";
    }

    const oldSources = Array.isArray(existing.source_urls) ? existing.source_urls.filter((value): value is string => typeof value === "string") : [];
    const mergedSources = [...new Set([...oldSources, ...evidence.map((entry) => entry.url)])].slice(0, 30);
    const previousPayload = asObject(existing.research_payload) ?? {};
    const update: Record<string, unknown> = {
      website_url: website,
      contact_email: verifiedEmail,
      contact_name: contactName,
      contact_role: contactRole,
      contact_route_url: routeUrl,
      contact_route_type: resolvedRouteType,
      source_urls: mergedSources,
      research_payload: { ...previousPayload, contact_enrichment: { enriched_at: new Date().toISOString(), ai_provider: response.provider, ai_model: response.model ?? null, evidence } },
      last_researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      [PERSON_PROFILE_KEY]: profileUrl,
    };

    const { error: updateError } = await db.from("investor_leads").update(update).eq("id", existing.id as number);
    if (updateError) continue;
    enriched += 1;
    if (verifiedEmail) withEmail += 1;
    if (resolvedRouteType === "application_form" || resolvedRouteType === "contact_form") withOfficialRoute += 1;
    if (profileUrl) withLinkedIn += 1;
    await db.from("investor_activity").insert({
      investor_id: existing.id,
      action: "investor_contact_enriched",
      actor_type: "ai",
      summary: verifiedEmail ? "Verified public investor email found." : resolvedRouteType ? `Verified contact route: ${resolvedRouteType}.` : "Investor contact research refreshed.",
      metadata: { contact_route_type: resolvedRouteType, contact_route_url: routeUrl, has_email: Boolean(verifiedEmail), has_professional_profile: Boolean(profileUrl), source_urls: evidence.map((entry) => entry.url) },
    });
  }
  return { checked: normalizedLeads.length, enriched, withEmail, withOfficialRoute, withLinkedIn };
}
