import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; range?: string; source?: string; campaign?: string }> };

const eventLabels: Record<string, { ar: string; en: string }> = {
  page_view: { ar: "زيارات قابلة للإسناد", en: "Attributed visits" },
  registration_completed: { ar: "تسجيلات مكتملة", en: "Completed registrations" },
  application_submitted: { ar: "طلبات تقديم", en: "Applications submitted" },
  brief_received: { ar: "طلبات عمل مستلمة", en: "Briefs received" },
};

const ranges: Record<string, { days: number | null; ar: string; en: string }> = {
  "7d": { days: 7, ar: "7 أيام", en: "7 days" },
  "30d": { days: 30, ar: "30 يومًا", en: "30 days" },
  "90d": { days: 90, ar: "90 يومًا", en: "90 days" },
  all: { days: null, ar: "كل الفترة", en: "All time" },
};

function sourceLabel(value: string, isArabic: boolean) {
  if (!isArabic) return value;
  const labels: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", linkedin: "LinkedIn", google: "Google", direct: "مباشر", organic: "بحث عضوي", referral: "إحالة", email: "البريد الإلكتروني" };
  return labels[value.toLowerCase()] ?? value;
}

function pct(part: number, total: number) { return total > 0 ? Math.round((part / total) * 100) : 0; }

export default async function MarketingAnalyticsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const isArabic = getAdminLanguage(params.lang) === "ar";
  const language = isArabic ? "ar" : "en";
  const rangeKey = params.range && ranges[params.range] ? params.range : "30d";
  const range = ranges[rangeKey];
  const sourceFilter = params.source?.trim() || null;
  const campaignFilter = params.campaign?.trim() || null;
  const since = range.days ? new Date(Date.now() - range.days * 86400000).toISOString() : null;
  const db = createAdminClient();

  function applyFilters<T extends { gte: (column: string, value: string) => T; eq: (column: string, value: string) => T }>(query: T) {
    let filtered = query;
    if (since) filtered = filtered.gte("occurred_at", since);
    if (sourceFilter) filtered = filtered.eq("source", sourceFilter);
    if (campaignFilter) filtered = filtered.eq("campaign", campaignFilter);
    return filtered;
  }

  const eventQuery = applyFilters(db.from("marketing_events").select("id,event_name,source,medium,campaign,content,entity_type,entity_id,occurred_at").order("occurred_at", { ascending: false }).limit(2000));
  const countQuery = (eventName: string) => applyFilters(db.from("marketing_events").select("id", { count: "exact", head: true }).eq("event_name", eventName));

  const [eventsResult, visitsResult, registrationsResult, applicationsResult, briefsResult] = await Promise.all([
    eventQuery,
    countQuery("page_view"),
    countQuery("registration_completed"),
    countQuery("application_submitted"),
    countQuery("brief_received"),
  ]);

  const events = eventsResult.data ?? [];
  const error = eventsResult.error;
  const visits = visitsResult.count ?? 0;
  const registrations = registrationsResult.count ?? 0;
  const applications = applicationsResult.count ?? 0;
  const briefs = briefsResult.count ?? 0;
  const registrationRate = pct(registrations, visits);
  const applicationRate = pct(applications, registrations);
  const briefRate = pct(briefs, visits);

  const sourceCounts = new Map<string, number>();
  const campaignCounts = new Map<string, number>();
  for (const event of events) {
    if (event.source) sourceCounts.set(event.source, (sourceCounts.get(event.source) ?? 0) + 1);
    if (event.campaign) campaignCounts.set(event.campaign, (campaignCounts.get(event.campaign) ?? 0) + 1);
  }
  const sources = [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]);
  const campaigns = [...campaignCounts.entries()].sort((a, b) => b[1] - a[1]);

  const diagnosis = visits < 50
    ? { tone: "amber", ar: "البيانات ما زالت قليلة لاتخاذ قرارات قوية. الأولوية: زيادة وصول قابل للإسناد عبر حملات ومحتوى يحمل UTM واضحًا.", en: "There is still too little attributed traffic for strong decisions. Priority: grow measurable reach with consistent UTM tagging." }
    : registrationRate < 10
      ? { tone: "red", ar: `أكبر تسرب حاليًا قبل التسجيل (${registrationRate}%). راجع الرسالة والصفحة المقصودة ووضوح CTA قبل زيادة حجم الزيارات.`, en: `The largest leak is before registration (${registrationRate}%). Improve message/landing-page/CTA clarity before scaling traffic.` }
      : applicationRate < 25
        ? { tone: "amber", ar: `التسجيل جيد نسبيًا لكن التحول إلى تقديم منخفض (${applicationRate}%). ركّز على فرص أوضح وتنشيط المواهب بعد التسجيل.`, en: `Registration is relatively healthy but application activation is low (${applicationRate}%). Focus on clearer opportunities and post-registration activation.` }
        : briefs === 0
          ? { tone: "amber", ar: "مسار المواهب يتحرك لكن لا توجد Briefs من الطلب. الأولوية التشغيلية: Lead enrichment + Outreach جاهز للاعتماد.", en: "Talent-side activity is moving but there are no demand briefs. Operational priority: lead enrichment and approval-ready outreach." }
          : { tone: "green", ar: "المسار يسجل حركة فعلية من الوصول إلى التسجيل والتقديم والطلب. ركّز الآن على تكرار أفضل مصدر/حملة بدل زيادة النشاط العشوائي.", en: "The funnel shows real movement through traffic, registrations, applications and demand. Scale the strongest source/campaign instead of adding random activity." };

  const filterHref = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams({ lang: language, range: rangeKey });
    const nextSource = Object.prototype.hasOwnProperty.call(patch, "source") ? patch.source : sourceFilter;
    const nextCampaign = Object.prototype.hasOwnProperty.call(patch, "campaign") ? patch.campaign : campaignFilter;
    if (nextSource) q.set("source", nextSource);
    if (nextCampaign) q.set("campaign", nextCampaign);
    if (patch.range) q.set("range", patch.range);
    return `/admin/marketing/analytics?${q.toString()}`;
  };

  return <AdminPageContainer>
    <AdminPageHeader eyebrow={isArabic ? "MLAMH · ذكاء الأداء" : "MLAMH · PERFORMANCE INTELLIGENCE"} title={isArabic ? "أداء التسويق" : "Marketing Performance"} description={isArabic ? "قياس فعلي + تشخيص تنفيذي: ما الذي يتحول، أين التسرب، وما القرار التالي — بدون أرقام تقديرية." : "Recorded measurement plus operational diagnosis: what converts, where the funnel leaks, and what to do next — without fabricated metrics."}/>

    <AdminCard className="mb-5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="me-2 text-xs text-white/35">{isArabic ? "الفترة" : "Range"}</span>
        {Object.entries(ranges).map(([key, item]) => <Link key={key} href={filterHref({ range: key })} className={`rounded-full border px-3 py-1.5 text-xs ${rangeKey === key ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{isArabic ? item.ar : item.en}</Link>)}
        {(sourceFilter || campaignFilter) ? <Link href={`/admin/marketing/analytics?lang=${language}&range=${rangeKey}`} className="ms-auto rounded-full border border-red-300/15 px-3 py-1.5 text-xs text-red-100/70">{isArabic ? "مسح الفلاتر" : "Clear filters"}</Link> : null}
      </div>
      {(sourceFilter || campaignFilter) ? <p className="mt-3 text-xs text-white/40">{sourceFilter ? `${isArabic ? "المصدر" : "Source"}: ${sourceLabel(sourceFilter, isArabic)}` : ""}{sourceFilter && campaignFilter ? " · " : ""}{campaignFilter ? `${isArabic ? "الحملة" : "Campaign"}: ${campaignFilter}` : ""}</p> : null}
    </AdminCard>

    {error ? <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm leading-6 text-amber-100/80">{isArabic ? "بيانات الإسناد غير متاحة حاليًا، لذلك لن تعرض اللوحة أرقامًا تقديرية أو مختلقة." : "Attribution data is currently unavailable, so the dashboard will not show estimated or fabricated numbers."}</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-4">{Object.entries(eventLabels).map(([name, label]) => <AdminStatCard key={name} label={isArabic ? label.ar : label.en} value={name === "page_view" ? visits : name === "registration_completed" ? registrations : name === "application_submitted" ? applications : briefs}/>)}</AdminGrid>

    <AdminCard className={`mb-6 border ${diagnosis.tone === "red" ? "border-red-300/20 bg-red-300/[0.045]" : diagnosis.tone === "green" ? "border-emerald-300/15 bg-emerald-300/[0.035]" : "border-amber-300/15 bg-amber-300/[0.04]"} p-5`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{isArabic ? "التشخيص التنفيذي" : "OPERATIONAL DIAGNOSIS"}</p>
      <p className="mt-2 text-sm leading-7 text-white/75">{isArabic ? diagnosis.ar : diagnosis.en}</p>
    </AdminCard>

    <div className="mb-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-5"><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "مسار التحويل" : "CONVERSION FLOW"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "من الزيارة إلى الطلب" : "From visit to demand"}</h2></div>
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-3">
          <div className="bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "زيارة ← تسجيل" : "Visit → registration"}</p><p className="mt-2 text-3xl font-light text-white">{registrationRate}%</p><p className="mt-2 text-xs text-white/30">{registrations} / {visits}</p></div>
          <div className="bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "تسجيل ← تقديم" : "Registration → application"}</p><p className="mt-2 text-3xl font-light text-white">{applicationRate}%</p><p className="mt-2 text-xs text-white/30">{applications} / {registrations}</p></div>
          <div className="bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "زيارة ← Brief" : "Visit → brief"}</p><p className="mt-2 text-3xl font-light text-gold">{briefRate}%</p><p className="mt-2 text-xs text-white/30">{briefs} / {visits}</p></div>
        </div>
        <div className="border-t border-white/[0.06] p-5 text-xs leading-6 text-white/35">{isArabic ? `الأرقام الأساسية أعلاه Exact Counts ضمن الفلاتر المحددة. تفاصيل المصدر/الحملة أدناه مبنية على آخر ${events.length} حدث مطابق.` : `Core funnel numbers above are exact counts for the selected filters. Source/campaign detail below uses the latest ${events.length} matching events.`}</div>
      </AdminCard>

      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "مصادر النمو" : "GROWTH SOURCES"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "من أين تأتي الحركة؟" : "Where is activity coming from?"}</h2></div><span className="text-xs tabular-nums text-white/30">{sources.length}</span></div>
        <div className="mt-5 space-y-2">{sources.length === 0 ? <span className="text-sm leading-6 text-white/40">{isArabic ? "لا توجد مصادر إسناد مسجلة حتى الآن." : "No attribution sources recorded yet."}</span> : sources.slice(0, 8).map(([source, total]) => <Link key={source} href={filterHref({ source })} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/15 px-3 py-2.5 hover:border-gold/20"><span className="text-xs text-white/60">{sourceLabel(source, isArabic)}</span><span className="text-xs tabular-nums text-gold/70">{total}</span></Link>)}</div>
      </AdminCard>
    </div>

    <AdminCard className="p-5">
      <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "أداء الحملات" : "CAMPAIGN SIGNAL"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "الحملات الموجودة في بيانات الإسناد" : "Campaigns present in attribution data"}</h2></div><Link href={`/admin/marketing/campaigns?lang=${language}`} className="text-xs text-gold/70">{isArabic ? "إدارة الحملات ←" : "Campaigns →"}</Link></div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{campaigns.length === 0 ? <p className="text-sm text-white/35">{isArabic ? "لا توجد UTM campaigns مسجلة ضمن الفترة الحالية." : "No UTM campaigns recorded in the current range."}</p> : campaigns.slice(0, 9).map(([campaign, total]) => <Link key={campaign} href={filterHref({ campaign })} className="rounded-xl border border-white/[0.07] bg-black/15 p-3 hover:border-gold/20"><p className="truncate text-xs text-white/65">{campaign}</p><p className="mt-2 text-lg text-gold">{total}</p></Link>)}</div>
    </AdminCard>
  </AdminPageContainer>;
}
