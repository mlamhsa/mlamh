import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildDemandQuality } from "@/lib/marketing/analytics/demand-quality";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; range?: string }> };

const ranges: Record<string, { days: number | null; ar: string; en: string }> = {
  "7d": { days: 7, ar: "7 أيام", en: "7 days" },
  "30d": { days: 30, ar: "30 يومًا", en: "30 days" },
  "90d": { days: 90, ar: "90 يومًا", en: "90 days" },
  all: { days: null, ar: "كل الفترة", en: "All time" },
};

function rate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function stageLabel(key: string, ar: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    leads: { ar: "Leads", en: "Leads" },
    researched: { ar: "تم بحثها", en: "Research completed" },
    ready: { ar: "جاهزة للتواصل", en: "Outreach ready" },
    prepared: { ar: "تواصل مجهز", en: "Outreach prepared" },
    sent: { ar: "تم الإرسال", en: "Sent" },
    replied: { ar: "ردت", en: "Replied" },
    positive: { ar: "رد إيجابي", en: "Positive reply" },
    brief: { ar: "تحولت إلى Brief", en: "Reached brief" },
    opportunity: { ar: "تحولت إلى فرصة", en: "Reached opportunity" },
  };
  return ar ? labels[key]?.ar ?? key : labels[key]?.en ?? key;
}

export default async function DemandQualityPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const language = getAdminLanguage(params.lang);
  const ar = language === "ar";
  const rangeKey = params.range && ranges[params.range] ? params.range : "30d";
  const selectedRange = ranges[rangeKey];
  const since = selectedRange.days ? new Date(Date.now() - selectedRange.days * 86400000).toISOString() : null;
  const db = createAdminClient();

  let leadQuery = db.from("marketing_leads")
    .select("id,contact_id,source,channel,stage,brief_status,created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (since) leadQuery = leadQuery.gte("created_at", since);

  const { data: leads, error: leadError } = await leadQuery;
  const leadRows = leads ?? [];
  const leadIds = leadRows.map((lead) => lead.id);
  const contactIds = [...new Set(leadRows.map((lead) => lead.contact_id).filter((id): id is number => typeof id === "number"))];

  const [contactsResult, tasksResult, outreachResult, briefsResult] = await Promise.all([
    contactIds.length
      ? db.from("marketing_contacts").select("id,contact_name,email,linkedin_url,metadata").in("id", contactIds)
      : Promise.resolve({ data: [], error: null }),
    leadIds.length
      ? db.from("marketing_tasks").select("lead_id,task_type,status").in("lead_id", leadIds).in("task_type", ["lead_enrichment", "outreach_preparation"]).limit(4000)
      : Promise.resolve({ data: [], error: null }),
    leadIds.length
      ? db.from("marketing_outreach").select("lead_id,channel,send_status,reply_status,outcome").in("lead_id", leadIds).limit(4000)
      : Promise.resolve({ data: [], error: null }),
    leadIds.length
      ? db.from("marketing_briefs").select("lead_id,status,opportunity_id").in("lead_id", leadIds).limit(4000)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const contacts = contactsResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const outreach = outreachResult.data ?? [];
  const briefs = briefsResult.data ?? [];
  const snapshot = buildDemandQuality({ leads: leadRows, contacts, tasks, outreach, briefs });
  const dataError = leadError ?? contactsResult.error ?? tasksResult.error ?? outreachResult.error ?? briefsResult.error;

  const sourceNames = [...new Set(leadRows.map((lead) => lead.source?.trim()).filter((value): value is string => Boolean(value)))];
  const sourceRows = sourceNames.map((source) => {
    const scopedLeads = leadRows.filter((lead) => lead.source === source);
    return { source, snapshot: buildDemandQuality({ leads: scopedLeads, contacts, tasks, outreach, briefs }) };
  }).sort((a, b) => b.snapshot.briefLeads - a.snapshot.briefLeads || b.snapshot.sentLeads - a.snapshot.sentLeads || b.snapshot.totalLeads - a.snapshot.totalLeads);

  const bottleneck = snapshot.largestObservedDrop;
  const bottleneckText = !bottleneck
    ? (ar ? "لا توجد بعد سلسلة تحويل كافية لتحديد أكبر تسرب بصورة موثوقة." : "There is not yet enough recorded progression to identify a reliable largest drop.")
    : ar
      ? `أكبر تسرب مرصود حاليًا: ${stageLabel(bottleneck.from === "outreach_ready" ? "ready" : bottleneck.from === "outreach_prepared" ? "prepared" : bottleneck.from === "positive_reply" ? "positive" : bottleneck.from, true)} ← ${stageLabel(bottleneck.to === "outreach_ready" ? "ready" : bottleneck.to === "outreach_prepared" ? "prepared" : bottleneck.to === "positive_reply" ? "positive" : bottleneck.to, true)}. التحول ${bottleneck.rate}%، وفُقد ${bottleneck.lost} Lead في هذه النقلة ضمن البيانات الحالية.`
      : `Largest observed drop: ${stageLabel(bottleneck.from === "outreach_ready" ? "ready" : bottleneck.from === "outreach_prepared" ? "prepared" : bottleneck.from === "positive_reply" ? "positive" : bottleneck.from, false)} → ${stageLabel(bottleneck.to === "outreach_ready" ? "ready" : bottleneck.to === "outreach_prepared" ? "prepared" : bottleneck.to === "positive_reply" ? "positive" : bottleneck.to, false)}. Conversion is ${bottleneck.rate}%, with ${bottleneck.lost} leads not progressing through that recorded transition.`;

  const rangeHref = (key: string) => `/admin/marketing/demand-quality?lang=${language}&range=${key}`;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={ar ? "MLAMH · جودة الطلب" : "MLAMH · DEMAND QUALITY"}
      title={ar ? "جودة Prospecting والتحول إلى Brief" : "Prospecting & Lead-to-Brief Quality"}
      description={ar ? "هل الفريق يبني Demand حقيقيًا أم يجمع Leads فقط؟ هذه الشاشة تقيس البحث، جاهزية التواصل، الإرسال، الردود، الـBriefs والفرص من البيانات المسجلة فقط." : "Is the team creating real demand or only collecting leads? This view measures research, outreach readiness, sends, replies, briefs and opportunities from recorded evidence only."}
    />

    <AdminCard className="mb-5 p-4"><div className="flex flex-wrap items-center gap-2"><span className="me-2 text-xs text-white/35">{ar ? "الفترة" : "Range"}</span>{Object.entries(ranges).map(([key, item]) => <Link key={key} href={rangeHref(key)} className={`rounded-full border px-3 py-1.5 text-xs ${rangeKey === key ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{ar ? item.ar : item.en}</Link>)}</div></AdminCard>

    {dataError ? <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm text-amber-100/80">{ar ? "بعض بيانات Demand Quality غير متاحة حاليًا؛ لن يتم تعويضها بتقديرات." : "Some Demand Quality data is unavailable; the dashboard will not replace missing evidence with estimates."}</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={ar ? "Leads" : "Leads"} value={snapshot.totalLeads} />
      <AdminStatCard label={ar ? "جاهزة للتواصل" : "Outreach ready"} value={snapshot.outreachReadyLeads} />
      <AdminStatCard label={ar ? "تم الإرسال" : "Sent leads"} value={snapshot.sentLeads} />
      <AdminStatCard label={ar ? "وصلت إلى Brief" : "Reached brief"} value={snapshot.briefLeads} />
    </AdminGrid>

    <AdminCard className="mb-6 border border-gold/15 bg-gold/[0.035] p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "التشخيص الحالي" : "CURRENT DIAGNOSIS"}</p><p className="mt-2 text-sm leading-7 text-white/70">{bottleneckText}</p></AdminCard>

    <AdminCard className="mb-6 overflow-hidden">
      <div className="border-b border-white/[0.07] p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "مسار الجودة" : "QUALITY PIPELINE"}</p><h2 className="mt-1 text-lg text-white">{ar ? "من Lead إلى فرصة" : "From lead to opportunity"}</h2></div>
      <div className="grid gap-px bg-white/[0.06] sm:grid-cols-3 xl:grid-cols-9">{snapshot.stages.map((stage) => <div key={stage.key} className="bg-black/20 p-4"><p className="min-h-8 text-[10px] leading-4 text-white/35">{stageLabel(stage.key, ar)}</p><p className="mt-2 text-2xl font-light text-white">{stage.count}</p></div>)}</div>
    </AdminCard>

    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <AdminCard className="p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "جودة التجهيز" : "PROSPECTING QUALITY"}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "بحث → جاهز" : "Research → ready"}</p><p className="mt-2 text-2xl text-white">{rate(snapshot.researchToReadyRate)}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "جاهز → مسودة" : "Ready → prepared"}</p><p className="mt-2 text-2xl text-white">{rate(snapshot.readyToPreparedRate)}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "مسودة → إرسال" : "Prepared → sent"}</p><p className="mt-2 text-2xl text-white">{rate(snapshot.preparedToSentRate)}</p></div></div><p className="mt-4 text-xs leading-6 text-white/35">{ar ? "جاهزية التواصل تستخدم نفس Contract الموجود في Lead Workspace: اسم شخص + منصب + Email أو LinkedIn موثق." : "Outreach readiness uses the same Lead Workspace contract: named person + role/title + verified Email or LinkedIn channel."}</p></AdminCard>

      <AdminCard className="p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "جودة التحويل" : "OUTBOUND CONVERSION"}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "إرسال → رد" : "Sent → reply"}</p><p className="mt-2 text-2xl text-white">{rate(snapshot.sentToReplyRate)}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "رد → إيجابي" : "Reply → positive"}</p><p className="mt-2 text-2xl text-white">{rate(snapshot.replyToPositiveRate)}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "إرسال → Brief" : "Sent → brief"}</p><p className="mt-2 text-2xl text-gold">{rate(snapshot.sentToBriefRate)}</p></div></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "Lead → Brief" : "Lead → brief"}</p><p className="mt-2 text-xl text-white">{rate(snapshot.leadToBriefRate)}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="text-xs text-white/35">{ar ? "Brief → فرصة" : "Brief → opportunity"}</p><p className="mt-2 text-xl text-white">{rate(snapshot.briefToOpportunityRate)}</p></div></div></AdminCard>
    </div>

    <AdminCard className="overflow-hidden">
      <div className="border-b border-white/[0.07] p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "جودة المصدر" : "SOURCE QUALITY"}</p><h2 className="mt-1 text-lg text-white">{ar ? "أي مصدر يتحول إلى Demand؟" : "Which source turns into demand?"}</h2></div>
      <div className="divide-y divide-white/[0.06]">{sourceRows.length === 0 ? <div className="p-6 text-sm text-white/35">{ar ? "لا توجد مصادر Lead مسجلة ضمن الفترة." : "No lead sources recorded in this range."}</div> : sourceRows.slice(0, 12).map(({ source, snapshot: row }) => <div key={source} className="grid gap-3 px-5 py-4 text-xs md:grid-cols-[1.3fr_repeat(5,.7fr)] md:items-center"><div><p className="font-medium text-white/75">{source}</p><p className="mt-1 text-[10px] text-white/25">{row.totalLeads} Leads</p></div><div><p className="text-white/30">{ar ? "جاهز" : "Ready"}</p><p className="mt-1 text-white/70">{row.outreachReadyLeads}</p></div><div><p className="text-white/30">{ar ? "مرسل" : "Sent"}</p><p className="mt-1 text-white/70">{row.sentLeads}</p></div><div><p className="text-white/30">{ar ? "رد" : "Reply"}</p><p className="mt-1 text-white/70">{row.repliedLeads}</p></div><div><p className="text-white/30">Brief</p><p className="mt-1 text-gold">{row.briefLeads}</p></div><div><p className="text-white/30">{ar ? "Lead→Brief" : "Lead→Brief"}</p><p className="mt-1 text-white/70">{rate(row.leadToBriefRate)}</p></div></div>)}</div>
    </AdminCard>
  </AdminPageContainer>;
}
