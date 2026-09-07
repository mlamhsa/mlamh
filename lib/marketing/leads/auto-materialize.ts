import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateContactAutoVerification } from "./contact-auto-verification";
import { getOutreachReadiness } from "./outreach-readiness";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function evidenceUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const url = text(record(item).url);
    return url ? [url] : [];
  });
}

async function findExistingContact({ organization, name, email, linkedinUrl }: { organization: string; name: string; email: string | null; linkedinUrl: string | null }) {
  const db = createAdminClient();
  if (linkedinUrl) {
    const { data } = await db.from("marketing_contacts").select("id,contact_name,email,linkedin_url,metadata").eq("linkedin_url", linkedinUrl).maybeSingle();
    if (data) return data;
  }
  if (email) {
    const { data } = await db.from("marketing_contacts").select("id,contact_name,email,linkedin_url,metadata").eq("email", email).eq("contact_name", name).maybeSingle();
    if (data) return data;
  }
  const { data } = await db.from("marketing_contacts").select("id,contact_name,email,linkedin_url,metadata").eq("organization_name", organization).eq("contact_name", name).maybeSingle();
  return data ?? null;
}

export async function materializeAutoVerifiedLeadResearch({ limit = 12 }: { limit?: number } = {}) {
  const db = createAdminClient();
  const safeLimit = Math.max(1, Math.min(limit, 30));
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: tasks, error } = await db
    .from("marketing_tasks")
    .select("id,agent_id,output,completed_at")
    .eq("task_type", "lead_enrichment")
    .eq("status", "completed")
    .gte("completed_at", since)
    .order("completed_at", { ascending: true })
    .limit(safeLimit * 3);
  if (error) throw new Error(`[contact_auto_verification.read] ${error.message}`);

  const summary = { processedTasks: 0, verifiedContacts: 0, linkedLeads: 0, skipped: 0, researchGaps: 0 };

  for (const task of tasks ?? []) {
    const wrapper = record(task.output);
    if (record(wrapper.contact_auto_verification).processed_at) continue;
    const value = record(wrapper.value);
    const research = Array.isArray(value.lead_research) ? value.lead_research.slice(0, 5) : [];
    const taskResult: Array<Record<string, unknown>> = [];

    for (const rawItem of research) {
      const item = record(rawItem);
      const leadId = positiveInteger(item.lead_id);
      const candidate = record(item.candidate_contact);
      const sourceEvidence = Array.isArray(item.source_evidence) ? item.source_evidence.slice(0, 12) : [];
      const sources = evidenceUrls(sourceEvidence);
      const evaluation = evaluateContactAutoVerification({
        contact_name: text(candidate.name),
        professional_role: text(candidate.role),
        email: text(candidate.public_business_email),
        linkedin_url: text(candidate.public_linkedin_url),
        source_urls: sources,
      });

      if (!leadId || !evaluation.isAutoVerifiable || !evaluation.name || !evaluation.role) {
        summary.researchGaps += 1;
        taskResult.push({ lead_id: leadId, status: "research_gap", missing_fields: evaluation.missingFields });
        continue;
      }

      const { data: lead } = await db.from("marketing_leads")
        .select("id,organization,city,stage,contact_id")
        .eq("id", leadId)
        .in("stage", ["new", "qualified"])
        .maybeSingle();
      if (!lead) {
        summary.skipped += 1;
        taskResult.push({ lead_id: leadId, status: "lead_not_actionable" });
        continue;
      }

      if (lead.contact_id) {
        const { data: current } = await db.from("marketing_contacts")
          .select("contact_name,email,linkedin_url,metadata")
          .eq("id", lead.contact_id)
          .maybeSingle();
        if (getOutreachReadiness(current).isReady) {
          summary.skipped += 1;
          taskResult.push({ lead_id: leadId, status: "existing_ready_contact", contact_id: lead.contact_id });
          continue;
        }
      }

      const existing = await findExistingContact({
        organization: lead.organization,
        name: evaluation.name,
        email: evaluation.email,
        linkedinUrl: evaluation.linkedinUrl,
      });
      let contactId = existing?.id ?? null;
      if (!contactId) {
        const now = new Date().toISOString();
        const { data: inserted, error: insertError } = await db.from("marketing_contacts").insert({
          organization_name: lead.organization,
          contact_name: evaluation.name,
          email: evaluation.email,
          phone: null,
          linkedin_url: evaluation.linkedinUrl,
          website: text(candidate.company_website),
          city: lead.city,
          metadata: {
            professional_role: evaluation.role,
            source: "contact_auto_verification",
            source_task_id: task.id,
            source_urls: evaluation.sourceUrls,
            source_evidence: sourceEvidence,
            confidence: item.confidence ?? null,
            approval_status: "approved",
            approved_by: "contact_auto_verification_policy",
            approved_at: now,
            policy: "ceo_approved_auto_verification_policy",
            external_send_allowed: false,
            verification_notes: "Auto-verified from public professional/business evidence under CEO-approved policy. External outreach remains approval-gated.",
          },
        }).select("id").single();
        if (insertError || !inserted) throw new Error(`[contact_auto_verification.insert] ${insertError?.message ?? "insert failed"}`);
        contactId = inserted.id;
        summary.verifiedContacts += 1;
      }

      const { error: leadError } = await db.from("marketing_leads").update({ contact_id: contactId, updated_at: new Date().toISOString() }).eq("id", lead.id);
      if (leadError) throw new Error(`[contact_auto_verification.link] ${leadError.message}`);
      summary.linkedLeads += 1;
      taskResult.push({ lead_id: leadId, status: "auto_verified", contact_id: contactId });

      await db.from("marketing_agent_activity").insert({
        agent_id: task.agent_id ?? "salman",
        task_id: task.id,
        action: "contact_auto_verified",
        reason: `Verified public decision-maker contact for ${lead.organization} under CEO-approved policy.`,
        channel: evaluation.linkedinUrl ? "linkedin" : "email",
        result: { lead_id: lead.id, contact_id: contactId, external_execution: false, policy: "ceo_approved_auto_verification_policy" },
      });
    }

    const processedAt = new Date().toISOString();
    const { error: taskUpdateError } = await db.from("marketing_tasks").update({
      output: {
        ...wrapper,
        contact_auto_verification: {
          processed_at: processedAt,
          policy: "ceo_approved_auto_verification_policy",
          results: taskResult,
        },
      },
      updated_at: processedAt,
    }).eq("id", task.id);
    if (taskUpdateError) throw new Error(`[contact_auto_verification.task] ${taskUpdateError.message}`);
    summary.processedTasks += 1;
    if (summary.processedTasks >= safeLimit) break;
  }

  return summary;
}
