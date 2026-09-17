import { createAdminClient } from "@/lib/supabase/admin";
import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { getInvestorRelationsSettings } from "./service";

const GCC_COUNTRY_CODES = new Set(["SA", "AE", "QA", "KW", "BH", "OM"]);

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asNullableString(value: unknown, max = 1000) {
  const result = asString(value, max);
  return result || null;
}

function asStringArray(value: unknown, maxItems = 20, maxLength = 1000) {
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
  const trimmed = content.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));
  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    try { return JSON.parse(candidate) as unknown; } catch { /* try next */ }
  }
  throw new Error("Investor research returned invalid JSON.");
}

function normalizeEmail(value: unknown) {
  const email = asString(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function normalizeOrgType(value: unknown) {
  const raw = asString(value, 50).toLowerCase();
  return ["vc", "angel", "family_office", "corporate_vc", "strategic", "accelerator", "government", "other"].includes(raw) ? raw : "other";
}

function canonicalUrl(value: unknown) {
  const raw = asString(value, 1000);
  if (!/^https?:\/\//i.test(raw)) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^(sa|ae|uk|ch)\.linkedin\.com$/, "linkedin.com");
    const path = (url.pathname || "/").replace(/\/+$/, "") || "/";
    return { raw, host, path: path.toLowerCase() };
  } catch {
    return null;
  }
}

function evidenceMatches(candidate: unknown, evidenceUrl: unknown) {
  const candidateUrl = canonicalUrl(candidate);
  const evidence = canonicalUrl(evidenceUrl);
  if (!candidateUrl || !evidence || candidateUrl.host !== evidence.host) return false;
  if (candidateUrl.host === "linkedin.com") return candidateUrl.path === evidence.path;
  if (candidateUrl.path === "/" || evidence.path === "/") return true;
  return candidateUrl.path.startsWith(evidence.path) || evidence.path.startsWith(candidateUrl.path);
}

function verifiedWebSources(parsed: Record<string, unknown> | null) {
  const sources = Array.isArray(parsed?.web_sources) ? parsed?.web_sources as Array<Record<string, unknown>> : [];
  return sources
    .map((source) => asString(source.url, 1000))
    .filter((url) => /^https?:\/\//i.test(url));
}

function matchedSources(candidates: unknown, webSources: string[]) {
  const requested = asStringArray(candidates, 20, 1000).filter((url) => /^https?:\/\//i.test(url));
  const matched = webSources.filter((source) => requested.some((candidate) => evidenceMatches(candidate, source)));
  return [...new Set(matched)].slice(0, 20);
}

function isPersonalLinkedIn(value: unknown) {
  const url = canonicalUrl(value);
  return Boolean(url && url.host === "linkedin.com" && url.path.startsWith("/in/"));
}

function isAllowedCountry(value: unknown) {
  return GCC_COUNTRY_CODES.has(asString(value, 8).toUpperCase());
}

type EvidenceEntry = { url?: unknown; supports?: unknown; claim?: unknown };

function verifiedEvidence(entries: unknown, webSources: string[]) {
  if (!Array.isArray(entries)) return [] as Array<{ url: string; supports: string[]; claim: string }>;
  return entries.flatMap((entry) => {
    const object = asObject(entry) as EvidenceEntry | null;
    const url = asString(object?.url, 1000);
    if (!url || !webSources.some((source) => evidenceMatches(url, source))) return [];
    return [{
      url: webSources.find((source) => evidenceMatches(url, source)) || url,
      supports: asStringArray(object?.supports, 12, 80).map((item) => item.toLowerCase()),
      claim: asString(object?.claim, 1000),
    }];
  });
}

function supportsField(evidence: Array<{ supports: string[] }>, field: string) {
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
        content: "Discover only real GCC investors using current public web evidence. Never fabricate names, firms, websites, LinkedIn profiles, investment theses, cheque sizes or contact details. Return fewer results rather than speculative ones. Each investor must include source_urls copied from sources actually used during web research.",
      },
      {
        role: "user",
        content: `MLAMH master brief (Arabic):\n${settings.masterBriefAr}\n\nMLAMH master brief (English):\n${settings.masterBriefEn}\n\nTarget stages: ${settings.targetStages.join(", ")}\nTarget sectors: ${settings.targetSectors.join(", ")}\nMinimum desired fit: ${settings.minimumFitScore}/100.\n\nAlready known investors:\n${excluded.length ? excluded.join("\n") : "None."}\n\nFind up to ${Math.max(1, Math.min(limit, 12))} NEW investors. Geography rule: Saudi Arabia first, UAE second, then Qatar, Kuwait, Bahrain and Oman only. Include VCs, angels, family offices, corporate venture, strategic investors, accelerators and government investment programs.\n\nReturn {"investors":[{"organization_name":"","organization_type":"vc|angel|family_office|corporate_vc|strategic|accelerator|government|other","website_url":null,"linkedin_url":null,"country_code":null,"city":null,"investment_stage":[],"sector_focus":[],"geography_focus":[],"cheque_min":null,"cheque_max":null,"cheque_currency":null,"thesis_summary":"","fit_score":0,"fit_rationale":"","contact_name":null,"contact_role":null,"contact_linkedin_url":null,"source_urls":[]}]}.",
      },
    ],
  });

  const parsed = asObject(parseAIJson(response.content));
  const webSources = verifiedWebSources(parsed);
  const items = Array.isArray(parsed?.investors) ? parsed?.investors as Array<Record<string, unknown>> : [];
  const created: number[] = [];
  const skipped: string[] = [];

  for (const item of items.slice(0, Math.max(1, Math.min(limit, 12)))) {
    const organizationName = asString(item.organization_name, 300);
    if (!organizationName || !isAllowedCountry(item.country_code)) {
      if (organizationName) skipped.push(`${organizationName} (invalid geography)`);
      continue;
    }
    const sources = matchedSources(item.source_urls, webSources);
    if (!sources.length) {
      skipped.push(`${organizationName} (no verified web evidence)`);
      continue;
    }
    const websiteUrl = asNullableString(item.website_url, 1000);
    const websiteVerified = websiteUrl && webSources.some((source) => evidenceMatches(websiteUrl, source));
    const linkedinUrl = asNullableString(item.linkedin_url, 1000);
    const linkedinVerified = linkedinUrl && webSources.some((source) => evidenceMatches(linkedinUrl, source));
    const personLinkedIn = asNullableString(item.contact_linkedin_url, 1000);
    const personVerified = isPersonalLinkedIn(personLinkedIn) && webSources.some((source) => evidenceMatches(personLinkedIn, source));

    const { data: duplicate } = await db.from("investor_leads").select("id").ilike("organization_name", organizationName).limit(1).maybeSingle();
    if (duplicate?.id) {
      skipped.push(`${organizationName} (duplicate)`);
      continue;
    }

    const fitScore = score(item.fit_score);
    const row = {
      organization_name: organizationName,
      organization_type: normalizeOrgType(item.organization_type),
      website_url: websiteVerified ? websiteUrl : null,
      linkedin_url: linkedinVerified ? linkedinUrl : null,
      country_code: asString(item.country_code, 8).toUpperCase(),
      city: asNullableString(item.city, 160),
      investment_stage: asStringArray(item.investment_stage, 20, 200),
      sector_focus: asStringArray(item.sector_focus, 20, 200),
      geography_focus: asStringArray(item.geography_focus, 20, 200),
      cheque_min: asNumber(item.cheque_min),
      cheque_max: asNumber(item.cheque_max),
      cheque_currency: asNullableString(item.cheque_currency, 12)?.toUpperCase() ?? null,
      thesis_summary: asNullableString(item.thesis_summary, 3000),
      fit_score: fitScore,
      fit_rationale: asNullableString(item.fit_rationale, 3000),
      contact_name: personVerified ? asNullableString(item.contact_name, 300) : null,
      contact_role: personVerified ? asNullableString(item.contact_role, 300) : null,
      contact_email: null,
      contact_linkedin_url: personVerified ? personLinkedIn : null,
      contact_route_url: personVerified ? personLinkedIn : (websiteVerified ? websiteUrl : null),
      contact_route_type: personVerified ? "linkedin" : (websiteVerified ? "website" : null),
      status: fitScore !== null && fitScore >= settings.minimumFitScore ? "qualified" : "discovered",
      source_urls: sources,
      research_payload: { ai_provider: response.provider, ai_model: response.model ?? null, usage: response.usage ?? {}, evidence_gate: true, discovered_at: new Date().toISOString() },
      last_researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: inserted, error } = await db.from("investor_leads").insert(row).select("id").single();
    if (error || !inserted) continue;
    created.push(inserted.id);
    await db.from("investor_activity").insert({ investor_id: inserted.id, action: "investor_discovered", actor_type: "ai", summary: row.fit_rationale, metadata: { fit_score: fitScore, source_urls: sources, evidence_gate: true } });
  }

  return { discovered: created.length, investorIds: created, skipped, provider: response.provider, model: response.model ?? null };
}

export async function enrichInvestorContacts({ limit = 12 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const { data: leads, error } = await db.from("investor_leads")
    .select("id,organization_name,organization_type,website_url,linkedin_url,country_code,city,fit_score,fit_rationale,contact_name,contact_role,contact_email,contact_linkedin_url,contact_route_url,contact_route_type,source_urls,research_payload")
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
        content: "Enrich existing investor records using current public web evidence only. Search the official website first for Contact, Apply, Pitch, Submit, Portfolio or Team pages. Use a business email only if explicitly published. Never infer an email pattern. Find the best investment decision-maker and a personal LinkedIn /in/ profile when publicly verifiable. Every non-null field must have claim-level evidence from a source actually visited during web search.",
      },
      {
        role: "user",
        content: `Investor leads to enrich:\n${JSON.stringify(leads.map((lead) => ({ id: lead.id, organization_name: lead.organization_name, organization_type: lead.organization_type, website_url: lead.website_url, country_code: lead.country_code, contact_name: lead.contact_name, contact_role: lead.contact_role, contact_linkedin_url: lead.contact_linkedin_url })), null, 2)}\n\nFor each lead, return the strongest verified public contact route. Prefer: (1) published investment/pitch email, (2) official application/pitch form, (3) official contact form, (4) verified decision-maker LinkedIn, (5) official website.\n\nReturn {"enrichments":[{"lead_id":0,"website_url":null,"contact_email":null,"contact_name":null,"contact_role":null,"contact_linkedin_url":null,"contact_route_url":null,"contact_route_type":"email|application_form|contact_form|linkedin|website|null","source_evidence":[{"url":"","supports":["website_url|contact_email|contact_name|contact_role|contact_linkedin_url|contact_route_url"],"claim":""}]}]}.`,
      },
    ],
  });

  const parsed = asObject(parseAIJson(response.content));
  const webSources = verifiedWebSources(parsed);
  const enrichments = Array.isArray(parsed?.enrichments) ? parsed?.enrichments as Array<Record<string, unknown>> : [];
  let enriched = 0;
  let withEmail = 0;
  let withOfficialRoute = 0;
  let withLinkedIn = 0;

  for (const item of enrichments) {
    const leadId = asNumber(item.lead_id);
    const existing = leads.find((lead) => lead.id === leadId);
    if (!existing) continue;
    const evidence = verifiedEvidence(item.source_evidence, webSources);
    if (!evidence.length) continue;

    const websiteCandidate = asNullableString(item.website_url, 1000);
    const emailCandidate = normalizeEmail(item.contact_email);
    const linkedinCandidate = asNullableString(item.contact_linkedin_url, 1000);
    const routeCandidate = asNullableString(item.contact_route_url, 1000);
    const routeTypeRaw = asString(item.contact_route_type, 40).toLowerCase();
    const routeType = ["email", "application_form", "contact_form", "linkedin", "website"].includes(routeTypeRaw) ? routeTypeRaw : null;

    const websiteUrl = websiteCandidate && supportsField(evidence, "website_url") && webSources.some((source) => evidenceMatches(websiteCandidate, source)) ? websiteCandidate : existing.website_url;
    const contactEmail = emailCandidate && supportsField(evidence, "contact_email") ? emailCandidate : existing.contact_email;
    const personalLinkedInVerified = linkedinCandidate && isPersonalLinkedIn(linkedinCandidate) && supportsField(evidence, "contact_linkedin_url") && webSources.some((source) => evidenceMatches(linkedinCandidate, source));
    const contactLinkedIn = personalLinkedInVerified ? linkedinCandidate : existing.contact_linkedin_url;
    const contactName = personalLinkedInVerified && supportsField(evidence, "contact_name") ? asNullableString(item.contact_name, 300) : existing.contact_name;
    const contactRole = personalLinkedInVerified && supportsField(evidence, "contact_role") ? asNullableString(item.contact_role, 300) : existing.contact_role;
    const routeVerified = routeCandidate && routeType && supportsField(evidence, "contact_route_url") && (routeType === "email" || webSources.some((source) => evidenceMatches(routeCandidate, source)));
    const fallbackRoute = contactEmail ? { url: `mailto:${contactEmail}`, type: "email" } : contactLinkedIn ? { url: contactLinkedIn, type: "linkedin" } : websiteUrl ? { url: websiteUrl, type: "website" } : { url: null, type: null };
    const contactRouteUrl = routeVerified ? routeCandidate : fallbackRoute.url;
    const contactRouteType = routeVerified ? routeType : fallbackRoute.type;
    const mergedSources = [...new Set([...(Array.isArray(existing.source_urls) ? existing.source_urls.filter((value): value is string => typeof value === "string") : []), ...evidence.map((entry) => entry.url)])].slice(0, 30);
    const previousPayload = asObject(existing.research_payload) ?? {};

    const { error: updateError } = await db.from("investor_leads").update({
      website_url: websiteUrl,
      contact_email: contactEmail,
      contact_name: contactName,
      contact_role: contactRole,
      contact_linkedin_url: contactLinkedIn,
      contact_route_url: contactRouteUrl,
      contact_route_type: contactRouteType,
      source_urls: mergedSources,
      research_payload: {
        ...previousPayload,
        contact_enrichment: {
          enriched_at: new Date().toISOString(),
          ai_provider: response.provider,
          ai_model: response.model ?? null,
          evidence: evidence.map((entry) => ({ url: entry.url, claim: entry.claim, supports: entry.supports })),
        },
      },
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
