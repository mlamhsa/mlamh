import Link from "next/link";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { getCeoDecisionQueueSnapshot } from "@/lib/marketing/approvals/ceo-decision-queue";
import { approveMarketingApproval, rejectMarketingApproval } from "../actions";

export const dynamic = "force-dynamic";

function riskVariant(risk: string | null) {
  return risk === "high" || risk === "critical" ? "danger" as const : risk === "medium" ? "warning" as const : "muted" as const;
}

export default async function CeoDecisionQueuePage() {
  await requireMarketingAdminAccess("marketing.approve");
  const snapshot = await getCeoDecisionQueueSnapshot();
  const decisions = snapshot.decisions;
  const highPriority = decisions.filter((approval) => ["high", "critical"].includes(approval.risk_level ?? "")).length;
  const editableCount = decisions.filter(({ kind }) => kind === "Outreach" || kind === "Client Reply").length;

  return <AdminPageContainer>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Link href="/admin/marketing/approvals?lang=ar" className="text-xs text-gold/70 hover:text-gold">← مركز القرارات الكامل</Link>
      <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.04] px-3 py-1 text-[11px] text-emerald-100/75">Internal work runs without CEO interruption</span>
    </div>

    <AdminPageHeader eyebrow="MLAMH · AUTONOMOUS MARKETING" title="CEO Decision Queue" description="هنا يظهر فقط ما يحتاج قرارك فعلًا: رسالة خارجية، نشر، أو قرار تجاري مهم. البحث والتحليل والترتيب والتجهيز تبقى مسؤولية الفريق ولا تُعرض عليك كمهام يومية." />

    {snapshot.error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">تعذر تحميل قائمة القرارات الآن.</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-5">
      <AdminStatCard label="يحتاج قرارك الآن" value={decisions.length}/>
      <AdminStatCard label="رسائل للمراجعة" value={editableCount}/>
      <AdminStatCard label="أولوية مرتفعة" value={highPriority}/>
      <AdminStatCard label="محجوب بجودة Contact" value={snapshot.blockedOutreach}/>
      <AdminStatCard label="تشغيل داخلي مخفي" value={snapshot.operationalOnly + snapshot.staleOutreach + snapshot.testFixtures}/>
    </AdminGrid>

    <AdminCard className="mb-6 border-emerald-300/10 bg-emerald-300/[0.025] p-5">
      <p className="text-xs font-medium text-emerald-100">قاعدة التشغيل</p>
      <p className="mt-2 text-sm leading-7 text-white/55">الفريق يستطيع البحث والتحليل وLead Scoring وإعداد Drafts والمتابعة الداخلية تلقائيًا. لا يصل إلى هذه الشاشة إلا القرار الذي يغيّر شيئًا خارج MLAMH أو يحمل أثرًا تجاريًا مهمًا. Outreach غير المكتمل باسم شخص + دوره + قناة موثقة يُحجب تلقائيًا بدل طلب موافقتك.</p>
    </AdminCard>

    <div className="space-y-5">
      {decisions.length === 0 ? <AdminCard className="p-8 text-center"><p className="text-base text-white/75">لا توجد قرارات تحتاج تدخل CEO الآن.</p><p className="mt-2 text-sm text-white/35">الفريق يواصل العمل الداخلي، وستظهر هنا فقط القرارات التي تتطلب موافقتك.</p></AdminCard> : decisions.map(({ id, task_id, reason, channel, risk_level, task, lead, contact, kind, message, subject, recipient, role }) => {
        const needsEditor = kind === "Outreach" || kind === "Client Reply";
        const canApproveHere = kind !== "Client Reply";
        return <AdminCard key={id} className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] p-5">
            <div>
              <div className="flex flex-wrap gap-2"><AdminBadge variant="warning">بانتظار قرارك</AdminBadge><AdminBadge variant="muted">{kind}</AdminBadge><AdminBadge variant={riskVariant(risk_level)}>{risk_level ?? "low"}</AdminBadge></div>
              <h2 className="mt-3 text-lg font-medium text-white">{lead?.organization || task.title || reason || `Decision #${id}`}</h2>
              <p className="mt-1 text-xs text-white/35">Approval #{id} · Task #{task_id}{lead ? ` · Lead #${lead.id} · Score ${lead.lead_score ?? "—"}` : ""}</p>
            </div>
            {recipient ? <a href={recipient.startsWith("http") ? recipient : `mailto:${recipient}`} target="_blank" rel="noreferrer" className="rounded-xl border border-blue-300/15 px-3 py-2 text-xs text-blue-100">فتح القناة</a> : null}
          </div>

          <div className="space-y-4 p-5">
            {contact ? <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">Contact</p><p className="mt-1 text-sm text-white/75">{contact.contact_name}</p></div><div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">Role</p><p className="mt-1 text-sm text-white/75">{role || "—"}</p></div><div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">Channel</p><p className="mt-1 break-all text-sm text-white/75">{task.channel || channel || "internal"}</p></div></div> : null}
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><p className="text-[10px] text-white/35">لماذا وصل لك؟</p><p className="mt-2 text-sm leading-7 text-white/65">{reason || "قرار خارجي أو تجاري يحتاج موافقة CEO."}</p></div>
            {subject ? <div><p className="text-[10px] text-white/35">Subject</p><p className="mt-1 text-sm text-white/75">{subject}</p></div> : null}
            {message ? <div><p className="text-[10px] text-white/35">Preview</p><div className="mt-2 whitespace-pre-wrap rounded-xl border border-gold/10 bg-gold/[0.02] p-4 text-sm leading-7 text-white/65">{message}</div></div> : null}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.07] p-5">
            {needsEditor ? <Link href="/admin/marketing/approvals/editable?lang=ar" className="rounded-xl border border-blue-300/20 bg-blue-300/[0.04] px-4 py-2.5 text-xs font-medium text-blue-100">مراجعة / تعديل المحتوى</Link> : null}
            {canApproveHere ? <form action={approveMarketingApproval}><input type="hidden" name="approval_id" value={id}/><button className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-2.5 text-xs font-medium text-gold">اعتماد</button></form> : <Link href="/admin/marketing/approvals/editable?lang=ar" className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-2.5 text-xs font-medium text-gold">فتح الاعتماد النهائي</Link>}
            <form action={rejectMarketingApproval}><input type="hidden" name="approval_id" value={id}/><button className="rounded-xl border border-red-300/15 px-5 py-2.5 text-xs text-red-100/70">رفض</button></form>
          </div>
        </AdminCard>;
      })}
    </div>

    {(snapshot.blockedOutreach > 0 || snapshot.staleOutreach > 0) ? <AdminCard className="mt-6 p-5"><p className="text-xs font-medium text-white/70">قرارات لم نزعجك بها</p><p className="mt-2 text-sm leading-7 text-white/40">{snapshot.blockedOutreach} Outreach محجوب لأن Contact غير مكتمل أو غير موثق، و{snapshot.staleOutreach} Outreach قديم لLead سبق التواصل معه. يعالجها الفريق داخليًا بدل وضعها في قائمة CEO.</p></AdminCard> : null}
  </AdminPageContainer>;
}
