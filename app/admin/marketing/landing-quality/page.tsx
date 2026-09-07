import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildLandingQuality } from "@/lib/marketing/analytics/landing-quality";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; range?: string }> };

const ranges: Record<string, { days: number | null; ar: string; en: string }> = {
  "7d": { days: 7, ar: "7 أيام", en: "7 days" },
  "30d": { days: 30, ar: "30 يومًا", en: "30 days" },
  "90d": { days: 90, ar: "90 يومًا", en: "90 days" },
  all: { days: null, ar: "كل الفترة", en: "All time" },
};

function rate(value: number | null) { return value === null ? "—" : `${value}%`; }

export default async function LandingQualityPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const language = getAdminLanguage(params.lang);
  const ar = language === "ar";
  const rangeKey = params.range && ranges[params.range] ? params.range : "30d";
  const selected = ranges[rangeKey];
  const since = selected.days ? new Date(Date.now() - selected.days * 86400000).toISOString() : null;
  const db = createAdminClient();

  let query = db.from("marketing_events")
    .select("event_name,anonymous_session_id,source,campaign,metadata,occurred_at")
    .in("event_name", ["page_view", "registration_completed", "application_submitted"])
    .order("occurred_at", { ascending: false })
    .limit(6000);
  if (since) query = query.gte("occurred_at", since);

  const { data, error } = await query;
  const rows = buildLandingQuality(data ?? []);
  const landingSessions = rows.reduce((sum, row) => sum + row.landingSessions, 0);
  const registrations = rows.reduce((sum, row) => sum + row.registrationSessions, 0);
  const applications = rows.reduce((sum, row) => sum + row.applicationSessions, 0);
  const registrationRate = landingSessions > 0 ? Math.round((registrations / landingSessions) * 100) : null;
  const applicationRate = landingSessions > 0 ? Math.round((applications / landingSessions) * 100) : null;

  const diagnosed = rows.filter((row) => row.landingSessions >= 5);
  const weakest = diagnosed.length
    ? [...diagnosed].sort((a, b) => (a.registrationRate ?? 101) - (b.registrationRate ?? 101) || b.landingSessions - a.landingSessions)[0]
    : null;
  const diagnosis = weakest
    ? ar
      ? `أضعف Landing Page لديها عينة قابلة للقراءة حاليًا هي ${weakest.path}: ${weakest.landingSessions} جلسة منسوبة، وتحول التسجيل ${rate(weakest.registrationRate)}. هذه مرشحة للمراجعة قبل زيادة الزيارات إليها.`
      : `The weakest landing page with a readable sample is ${weakest.path}: ${weakest.landingSessions} attributed sessions and ${rate(weakest.registrationRate)} registration conversion. Review this page before scaling more traffic to it.`
    : ar
      ? "لا توجد حتى الآن صفحة لديها 5 جلسات Landing منسوبة على الأقل. نجمع baseline أولًا ولا نطلق تجربة CTA قبل وجود عينة قابلة للقراءة."
      : "No landing page has at least 5 attributed landing sessions yet. Build the baseline first; do not launch a CTA experiment before there is a readable sample.";

  const href = (key: string) => `/admin/marketing/landing-quality?lang=${language}&range=${key}`;

  return <AdminPageContainer>
    <AdminPageHeader eyebrow={ar ? "MLAMH · CRO" : "MLAMH · CRO"} title={ar ? "جودة صفحات الوصول" : "Landing Page Quality"} description={ar ? "قياس الجلسات التي دخلت عبر UTM فعلي وربطها بالتسجيل والتقديم المثبتين على الخادم. لا نحسب التصفح الداخلي كـLanding Visit ولا نخمن التحويل عند غياب Session ID." : "Measures real UTM landing sessions and links them to server-verified registrations and applications. Internal navigation is not counted as a landing visit and missing session linkage is never guessed."} />

    <AdminCard className="mb-5 p-4"><div className="flex flex-wrap items-center gap-2"><span className="me-2 text-xs text-white/35">{ar ? "الفترة" : "Range"}</span>{Object.entries(ranges).map(([key, item]) => <Link key={key} href={href(key)} className={`rounded-full border px-3 py-1.5 text-xs ${rangeKey === key ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{ar ? item.ar : item.en}</Link>)}</div></AdminCard>

    {error ? <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm text-amber-100/80">{ar ? "تعذر تحميل بعض بيانات Landing CRO؛ لن يتم تعويضها بتقديرات." : "Some Landing CRO data is unavailable; missing evidence will not be replaced with estimates."}</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={ar ? "Landing Sessions" : "Landing sessions"} value={landingSessions} />
      <AdminStatCard label={ar ? "تسجيلات مرتبطة" : "Linked registrations"} value={registrations} />
      <AdminStatCard label={ar ? "Landing → تسجيل" : "Landing → registration"} value={rate(registrationRate)} />
      <AdminStatCard label={ar ? "Landing → تقديم" : "Landing → application"} value={rate(applicationRate)} />
    </AdminGrid>

    <AdminCard className="mb-6 border border-gold/15 bg-gold/[0.035] p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "قرار CRO" : "CRO DECISION"}</p><p className="mt-2 text-sm leading-7 text-white/70">{diagnosis}</p></AdminCard>

    <AdminCard className="overflow-hidden">
      <div className="border-b border-white/[0.07] p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar ? "أداء صفحات الوصول" : "LANDING PERFORMANCE"}</p><h2 className="mt-1 text-lg text-white">{ar ? "أي صفحة تحول الزيارة إلى فعل؟" : "Which landing page turns traffic into action?"}</h2></div>
      <div className="divide-y divide-white/[0.06]">{rows.length === 0 ? <div className="p-6 text-sm leading-6 text-white/35">{ar ? "لا توجد Landing Sessions منسوبة بالمعيار الجديد حتى الآن." : "No landing sessions have been recorded under the new attribution contract yet."}</div> : rows.slice(0, 20).map((row) => <div key={row.path} className="grid gap-3 px-5 py-4 text-xs md:grid-cols-[1.7fr_repeat(4,.7fr)] md:items-center"><div><p className="break-all font-medium text-white/75">{row.path}</p><p className="mt-1 text-[10px] text-white/25">{row.sources.slice(0, 3).join(" · ") || (ar ? "مصدر غير مسجل" : "No source")} {row.campaigns.length ? `· ${row.campaigns.slice(0, 2).join(" · ")}` : ""}</p></div><div><p className="text-white/30">{ar ? "جلسات" : "Sessions"}</p><p className="mt-1 text-white/70">{row.landingSessions}</p></div><div><p className="text-white/30">{ar ? "تسجيل" : "Registration"}</p><p className="mt-1 text-white/70">{row.registrationSessions}</p></div><div><p className="text-white/30">{ar ? "تقديم" : "Application"}</p><p className="mt-1 text-white/70">{row.applicationSessions}</p></div><div><p className="text-white/30">{ar ? "تحول التسجيل" : "Reg. rate"}</p><p className="mt-1 text-gold">{rate(row.registrationRate)}</p></div></div>)}</div>
      <div className="border-t border-white/[0.06] p-5 text-xs leading-6 text-white/35">{ar ? "عتبة 5 جلسات تستخدم فقط لتحديد صفحة تستحق مراجعة CRO؛ لا تعني دلالة إحصائية ولا تطلق تجربة تلقائيًا." : "The 5-session threshold only identifies a page worth reviewing; it is not statistical significance and does not trigger an experiment automatically."}</div>
    </AdminCard>
  </AdminPageContainer>;
}
