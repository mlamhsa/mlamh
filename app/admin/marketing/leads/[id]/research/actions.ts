"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validHttpUrl(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validLinkedIn(value: unknown) {
  const raw = validHttpUrl(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const isPersonProfile = /^\/in\/[^/]+\/?$/i.test(url.pathname);
    return host === "linkedin.com" && isPersonProfile ? url.toString() : null;
  } catch {
    return null;
  }
}

function validBusinessEmail(value: unknown) {
  const raw = text(value)?.toLowerCase() ?? null;
  if (!raw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return null;
  return raw;
}

function candidateFromOutput(output: unknown, leadId: number, candidateIndex: number) {
  const wrapper = record(output);
  const value = record(wrapper.value);
  const rows = Array.isArray(value.lead_research) ? value.lead_research : [];
  const matching = rows.filter((row) => Number(record(row).lead_id) === leadId);
  const selected = record(matching[candidateIndex]);
  const candidate = record(selected.candidate_contact);
  const sourceEvidence = Array.isArray(selected.source_evidence)
    ? selected.source_evidence
        .map(record)
        .filter((row) => validHttpUrl(row.url) && text(row.claim))
    : [];
  const providerSources = Array.isArray(value.web_sources)
    ? value.web_sources.map(record).filter((row) => validHttpUrl(row.url))
    : [];
  const evidenceUrls = new Set([...sourceEvidence, ...providerSources].map((row) => validHttpUrl(row.url)).filter(Boolean));

  return {
    name: text(candidate.name),
    role: text(candidate.role),
    email: validBusinessEmail(candidate.public_business_email),
    linkedinUrl: validLinkedIn(candidate.public_linkedin_url),
    website: validHttpUrl(candidate.company_website),
    confidence: typeof selected.confidence === "number" ? selected.confidence : Number(selected.confidence) || null,
    sourceEvidence,
    providerSources,
    evidenceUrls: [...evidenceUrls],
  };
}

export async function approveLeadResearchCandidateAction(formData: FormData) {
  const user = await requireMarketingAdminAccess("marketing.approve");
  const leadId = Number(formData.get("lead_id"));
  const taskId = Number(formData.get("task_id"));
  const candidateIndex = Number(formData.get("candidate_index") ?? 0);
  if (!Number.isInteger(leadId) || leadId <= 0 || !Number.isInteger(taskId) || taskId <= 0 || !Number.isInteger(candidateIndex) || candidateIndex < 0) {
    throw new Error("Invalid lead research review request.");
  }

  const db = createAdminClient();
  const [{ data: lead, error: leadError }, { data: task, error: taskError }] = await Promise.all([
    db.from("marketing_leads").select("id,organization,city,contact_id,stage").eq("id", leadId).single(),
    db.from("marketing_tasks").select("id,lead_id,task_type,status,output").eq("id", taskId).single(),
  ]);
  if (leadError || !lead) throw new Error("Lead not found.");
  if (taskError || !task || task.task_type !== "lead_enrichment" || task.status !== "completed" || task.lead_id !== leadId) {
    throw new Error("Lead research task is not eligible for review.");
  }

  const candidate = candidateFromOutput(task.output, leadId, candidateIndex);
  if (!candidate.name) throw new Error("A sourced contact name is required before approval.");
  if (!candidate.role) throw new Error("A sourced professional role/title is required before approval.");
  if (!candidate.email && !candidate.linkedinUrl) throw new Error("A sourced business email or personal LinkedIn profile is required before approval.");
  if (candidate.sourceEvidence.length === 0) throw new Error("Claim-level source evidence is required before a researched contact can become outreach-ready.");

  const now = new Date().toISOString();
  const metadata = {
    job_title: candidate.role,
    research_task_id: taskId,
    research_confidence: candidate.confidence,
    research_source_urls: candidate.evidenceUrls,
    reviewed_by_user_id: user.id,
    reviewed_at: now,
    contact_readiness: "admin_reviewed_public_research",
  };

  let contactId = typeof lead.contact_id === "number" ? lead.contact_id : null;
  let finalEmail = candidate.email;
  let finalLinkedin = candidate.linkedinUrl;
  if (contactId) {
    const { data: existingContact } = await db.from("marketing_contacts")
      .select("contact_name,email,linkedin_url,website,metadata")
      .eq("id", contactId)
      .maybeSingle();
    const existingMetadata = record(existingContact?.metadata);
    finalEmail = candidate.email ?? validBusinessEmail(existingContact?.email);
    finalLinkedin = candidate.linkedinUrl ?? validLinkedIn(existingContact?.linkedin_url);
    const { error } = await db.from("marketing_contacts").update({
      organization_name: lead.organization,
      contact_name: candidate.name ?? text(existingContact?.contact_name),
      email: finalEmail,
      linkedin_url: finalLinkedin,
      website: candidate.website ?? validHttpUrl(existingContact?.website),
      city: lead.city,
      metadata: { ...existingMetadata, ...metadata },
      updated_at: now,
    }).eq("id", contactId);
    if (error) throw new Error(`[review lead contact] ${error.message}`);
  } else {
    const { data: inserted, error } = await db.from("marketing_contacts").insert({
      organization_name: lead.organization,
      contact_name: candidate.name,
      email: candidate.email,
      linkedin_url: candidate.linkedinUrl,
      website: candidate.website,
      city: lead.city,
      metadata,
      updated_at: now,
    }).select("id").single();
    if (error || !inserted) throw new Error(`[create reviewed lead contact] ${error?.message ?? "insert failed"}`);
    contactId = inserted.id;
  }

  const { error: leadUpdateError } = await db.from("marketing_leads").update({
    contact_id: contactId,
    next_action_at: now,
    updated_at: now,
  }).eq("id", leadId);
  if (leadUpdateError) throw new Error(`[link reviewed lead contact] ${leadUpdateError.message}`);

  await db.from("marketing_agent_activity").insert({
    agent_id: "salman",
    task_id: taskId,
    action: "lead_research_approved",
    reason: `Public contact research reviewed for ${lead.organization}`,
    channel: finalLinkedin ? "linkedin" : "email",
    result: {
      lead_id: leadId,
      contact_id: contactId,
      reviewed_by: user.id,
      source_count: candidate.evidenceUrls.length,
      claim_evidence_count: candidate.sourceEvidence.length,
      outreach_ready: Boolean(candidate.name && candidate.role && (finalLinkedin || finalEmail)),
      existing_verified_fields_preserved: true,
    },
  });

  revalidatePath(`/admin/marketing/leads/${leadId}`);
  revalidatePath(`/admin/marketing/leads/${leadId}/research`);
  revalidatePath("/admin/marketing/leads");
  revalidatePath("/admin/marketing/outreach");
  revalidatePath("/admin/marketing");
  redirect(`/admin/marketing/leads/${leadId}?lang=ar&research_approved=1`);
}