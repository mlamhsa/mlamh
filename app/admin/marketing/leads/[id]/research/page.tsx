import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveLeadResearchCandidateAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }> };

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown) { return typeof value === "string" && value.trim() ? value.trim() : null; }
function url(value: unknown) { const raw = text(value); if (!raw) return null; try { const parsed = new URL(raw); return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null; } catch { return null; } }

export default async function LeadResearchReviewPage({ params }: PageProps) {
  await requireMarketingAdminAccess("marketing.approve");
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId) || leadId <= 0) notFound();
  const db = createAdminClient();

  const [{ data: lead }, { data: tasks }] = await Promise.all([
    db.from("marketing_leads").select("id,organization,city,stage,lead_score,contact_id").eq("id", leadId).maybeSingle(),
    db.from("marketing_tasks").select("id,status,output,completed_at").eq("lead_id", leadId).eq("task_type", "lead_enrichment").eq("status", "completed").order("completed_at", { ascending: false }).limit(10),
  ]);
  if (!lead) notFound();

  const candidates: Array<{ taskId:number; index:number; completedAt:string|null; readiness:string|null; name:string|null; role:string|null; email:string|null; linkedin:string|null; website:string|null; confidence:number|null; sources:Array<{url:string;title:string|null;claim:string|null}>; gaps:string[] }> = [];
  for (const task of tasks ?? []) {
    const wrapper = record(task.output);
    const value = record(wrapper.value);
    const rows = Array.isArray(value.lead_research) ? value.lead_research : [];
    rows.filter((row) => Number(record(row).lead_id) === leadId).forEach((raw, index) => {
      const row = record(raw);
      const contact = record(row.candidate_contact);
      const evidence = Array.isArray(row.source_evidence) ? row.source_evidence.map(record) : [];
      const providerSources = Array.isArray(value.web_sources) ? value.web_sources.map(record) : [];
      const sourceMap = new Map<string,{url:string;title:string|null;claim:string|null}>();
      for (const source of [...evidence, ...providerSources]) {
        const sourceUrl = url(source.url);
        if (!sourceUrl || sourceMap.has(sourceUrl)) continue;
        sourceMap.set(sourceUrl, { url: sourceUrl, title: text(source.title), claim: text(source.claim) });
      }
      candidates.push({
        taskId: task.id,
        index,
        completedAt: task.completed_at,
        readiness: text(row.readiness_status),
        name: text(contact.name),
        role: text(contact.role),
        email: text(contact.public_business_email),
        linkedin: url(contact.public_linkedin_url),
        website: url(contact.company_website),
        confidence: typeof row.confidence === "number" ? row.confidence : Number(row.confidence) || null,
        sources: [...sourceMap.values()],
        gaps: Array.isArray(row.remaining_gaps) ? row.remaining_gaps.filter((item): item is string => typeof item === "string") : [],
      });
    });
  }

  const reviewable = candidates.filter((candidate) => candidate.name && (candidate.email || candidate.linkedin) && candidate.sources.length > 0);

  return <AdminPageContainer>
    <div className="mb-4"><Link href={`/admin/marketing/leads/${leadId}?lang=ar`} className="text-xs text-gold/70 hover:text-gold">← العودة إلى العميل</Link></div>
    <AdminPageHeader eyebrow="SALMAN · PUBLIC RESEARCH REVIEW" title={`مراجعة بحث العميل · ${lead.organization}`} description="يعرض هنا فقط ما وجده البحث العام مع المصادر. لا تصبح أي بيانات Contact معتمدة داخل MLAMH إلا بعد مراجعتك الصريحة." />

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label="نتائج البحث" value={candidates.length}/>
      <AdminStatCard label="جاهزة للمراجعة" value={reviewable.length}/>
      <AdminStatCard label="Lead Score" value={lead.lead_score ?? "—"}/>
      <AdminStatCard label="Contact مرتبط حاليًا" value={lead.contact_id ? "نعم" : "لا"}/>
    </AdminGrid>

    <AdminCard className="mb-6 border border-blue-300/15 bg-blue-300/[0.035] p-5 text-sm leading-7 text-blue-50/70">
      البحث هنا مساعد وليس إثباتًا تلقائيًا. راجع تطابق الشخص مع الشركة والمنصب والمصادر. زر الاعتماد يحفظ البيانات العامة التي راجعتها داخل Contact ويجعل الـLead قابلًا لمسار Layan/Outreach؛ ولا يرسل أي رسالة خارجية.
    </AdminCard>

    <div className="space-y-5">
      {candidates.length === 0 ? <AdminCard className="p-7 text-sm text-white/45">لا توجد نتيجة بحث مكتملة لهذا العميل حتى الآن. سيظهر ناتج Salman هنا بعد تنفيذ مهمة Lead Enrichment المدعومة بالبحث العام.</AdminCard> : candidates.map((candidate, position) => {
        const canApprove = Boolean(candidate.name && (candidate.email || candidate.linkedin) && candidate.sources.length > 0);
        return <AdminCard key={`${candidate.taskId}-${candidate.index}-${position}`} className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2"><AdminBadge variant={canApprove ? "success" : "warning"}>{canApprove ? "قابل للمراجعة" : "بيانات ناقصة"}</AdminBadge>{candidate.readiness ? <AdminBadge variant="muted">{candidate.readiness.replaceAll("_", " ")}</AdminBadge> : null}</div>
              <h2 className="mt-3 text-xl text-white">{candidate.name ?? "لم يتم التحقق من اسم شخص"}</h2>
              <p className="mt-1 text-sm text-white/45">{candidate.role ?? "المنصب غير مثبت"}</p>
            </div>
            <div className="text-end text-xs text-white/35"><p>Research Task #{candidate.taskId}</p><p className="mt-1">Confidence: {candidate.confidence ?? "—"}</p></div>
          </div>

          <div className="grid gap-5 p-5 xl:grid-cols-[.9fr_1.1fr]">
            <div className="space-y-3">
              <DataRow label="Business email" value={candidate.email}/>
              <DataRow label="LinkedIn" value={candidate.linkedin} link/>
              <DataRow label="Company website" value={candidate.website} link/>
              {candidate.gaps.length ? <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-3"><p className="text-[10px] text-amber-100/55">Remaining gaps</p><p className="mt-2 text-xs leading-6 text-amber-50/65">{candidate.gaps.join(" · ")}</p></div> : null}
            </div>
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-gold/60">SOURCE EVIDENCE</p>
              <div className="space-y-2">{candidate.sources.length === 0 ? <p className="text-sm text-red-100/60">لا يوجد مصدر قابل للمراجعة؛ الاعتماد مقفل.</p> : candidate.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/[0.07] bg-black/20 p-3 transition hover:border-gold/20"><p className="truncate text-xs font-medium text-white/70">{source.title ?? source.url}</p><p className="mt-1 truncate text-[10px] text-gold/50">{source.url}</p>{source.claim ? <p className="mt-2 text-xs leading-5 text-white/40">{source.claim}</p> : null}</a>)}</div>
            </div>
          </div>

          <div className="border-t border-white/[0.07] p-5">
            {canApprove ? <form action={approveLeadResearchCandidateAction}><input type="hidden" name="lead_id" value={leadId}/><input type="hidden" name="task_id" value={candidate.taskId}/><input type="hidden" name="candidate_index" value={candidate.index}/><button className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-medium text-gold transition hover:bg-gold/15">اعتماد Contact وتجهيزه لـOutreach</button></form> : <p className="text-sm text-amber-100/60">لن يظهر الاعتماد حتى يتوفر اسم موثق + قناة تواصل عامة + مصدر قابل للمراجعة.</p>}
          </div>
        </AdminCard>;
      })}
    </div>
  </AdminPageContainer>;
}

function DataRow({ label, value, link = false }: { label:string; value:string|null; link?:boolean }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/15 p-3"><p className="text-[10px] text-white/30">{label}</p>{value ? link ? <a href={value} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-gold/75 hover:text-gold">{value}</a> : <p className="mt-1 break-all text-sm text-white/70">{value}</p> : <p className="mt-1 text-sm text-white/25">—</p>}</div>;
}
