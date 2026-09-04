import Link from "next/link";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export default async function MarketingLeadLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  await requireMarketingAdminAccess("marketing.view");
  const { id } = await params;
  const leadId = Number(id);
  let researchReady = false;

  if (Number.isInteger(leadId) && leadId > 0) {
    const db = createAdminClient();
    const { data: tasks } = await db.from("marketing_tasks")
      .select("output")
      .eq("lead_id", leadId)
      .eq("task_type", "lead_enrichment")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(3);

    researchReady = (tasks ?? []).some((task) => {
      const value = record(record(task.output).value);
      const rows = Array.isArray(value.lead_research) ? value.lead_research : [];
      return rows.some((raw) => {
        const row = record(raw);
        if (Number(row.lead_id) !== leadId) return false;
        const candidate = record(row.candidate_contact);
        const hasName = typeof candidate.name === "string" && candidate.name.trim().length > 0;
        const hasChannel = [candidate.public_business_email, candidate.public_linkedin_url].some((item) => typeof item === "string" && item.trim().length > 0);
        const hasEvidence = Array.isArray(row.source_evidence) && row.source_evidence.length > 0 || Array.isArray(value.web_sources) && value.web_sources.length > 0;
        return hasName && hasChannel && hasEvidence;
      });
    });
  }

  return (
    <>
      {children}
      {researchReady ? (
        <div className="fixed bottom-6 end-6 z-50 max-w-sm rounded-2xl border border-blue-300/20 bg-[#171717]/95 p-3 shadow-2xl backdrop-blur">
          <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-blue-200/60">SALMAN · RESEARCH READY</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-xs leading-5 text-white/55">وجد الفريق Contact عامًا مع مصادر ويحتاج مراجعتك قبل اعتماده.</p>
            <Link href={`/admin/marketing/leads/${leadId}/research?lang=ar`} className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-medium text-gold transition hover:bg-gold/15">مراجعة البحث</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
