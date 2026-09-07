import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildChannelQuality, type ChannelEvidenceTier } from "@/lib/marketing/analytics/channel-quality";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string; range?: string }>;
};

const ranges: Record<string, { days: number | null; ar: string; en: string }> = {
  "7d": { days: 7, ar: "7 أيام", en: "7 days" },
  "30d": { days: 30, ar: "30 يومًا", en: "30 days" },
  "90d": { days: 90, ar: "90 يومًا", en: "90 days" },
  all: { days: null, ar: "كل الفترة", en: "All time" },
};

const tierLabels: Record<ChannelEvidenceTier, { ar: string; en: string }> = {
  demand_proven: { ar: "طلب تجاري مثبت", en: "Verified demand" },
  talent_conversion: { ar: "تحويل مواهب مثبت", en: "Talent conversion" },
  registration_only: { ar: "تسجيل فقط", en: "Registration only" },
  traffic_only: { ar: "زيارات فقط", en: "Traffic only" },
};

function displayRate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

export default async function ChannelQualityPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const isArabic = getAdminLanguage(params.lang) === "ar";
  const language = isArabic ? "ar" : "en";
  const rangeKey = params.range && ranges[params.range] ? params.range : "30d";
  const range = ranges[rangeKey];
  const since = range.days ? new Date(Date.now() - range.days * 86400000).toISOString() : null;
  const db = createAdminClient();

  let query = db
    .from("marketing_events")
    .select("event_name,source,campaign,occurred_at")
    .in("event_name", ["page_view", "registration_completed", "application_submitted", "brief_received"])
    .order("occurred_at", { ascending: false })
    .limit(5000);

  if (since) query = query.gte("occurred_at", since);

  const { data, error } = await query;
  const rows = buildChannelQuality(data ?? []);

  const totalVisits = rows.reduce((sum, row) => sum + row.visits, 0);
  const totalRegistrations = rows.reduce((sum, row) => sum + row.registrations, 0);
  const totalApplications = rows.reduce((sum, row) => sum + row.applications, 0);
  const totalBriefs = rows.reduce((sum, row) => sum + row.briefs, 0);

  const bestEvidence = rows[0] ?? null;
  const diagnosis = bestEvidence
    ? bestEvidence.evidenceTier === "demand_proven"
      ? isArabic
        ? `أقوى دليل حاليًا يأتي من ${bestEvidence.source}: توجد نتيجة طلب تجاري فعلية. لا نعتبر ذلك كافيًا للتوسع الكبير حتى يتكرر على حجم بيانات أكبر.`
        : `The strongest current evidence comes from ${bestEvidence.source}: it has a verified demand outcome. Do not treat that as enough for aggressive scaling until it repeats on a larger sample.`
      : bestEvidence.evidenceTier === "talent_conversion"
        ? isArabic
          ? `أقوى دليل حاليًا يأتي من ${bestEvidence.source}: المصدر وصل إلى تقديم فعلي من المواهب، لكنه لم يثبت طلبًا تجاريًا بعد.`
          : `The strongest current evidence comes from ${bestEvidence.source}: it has reached a verified talent application, but has not yet proven commercial demand.`
        : isArabic
          ? "البيانات الحالية لم تصل بعد إلى نتيجة سوقية قوية. لا نرفع الإنفاق أو النشاط بناءً على الزيارات وحدها."
          : "Current evidence has not yet reached a strong marketplace outcome. Do not scale activity based on traffic alone."
    : isArabic
      ? "لا توجد بيانات إسناد كافية حتى الآن لاتخاذ قرار قناة."
      : "There is not enough attribution evidence yet to make a channel decision.";

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow={isArabic ? "MLAMH · ذكاء القنوات" : "MLAMH · CHANNEL INTELLIGENCE"}
        title={isArabic ? "جودة القنوات" : "Channel Quality"}
        description={isArabic ? "ترتيب القنوات حسب النتائج المثبتة: زيارة، تسجيل، تقديم، ثم طلب تجاري — وليس حسب حجم الحركة فقط." : "Rank channels by verified outcomes: visit, registration, application, then commercial demand — not by traffic volume alone."}
      />

      <AdminCard className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-2 text-xs text-white/35">{isArabic ? "الفترة" : "Range"}</span>
          {Object.entries(ranges).map(([key, item]) => (
            <Link
              key={key}
              href={`/admin/marketing/channel-quality?lang=${language}&range=${key}`}
              className={`rounded-full border px-3 py-1.5 text-xs ${rangeKey === key ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}
            >
              {isArabic ? item.ar : item.en}
            </Link>
          ))}
        </div>
      </AdminCard>

      {error ? (
        <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm leading-6 text-amber-100/80">
          {isArabic ? "تعذر تحميل بيانات القنوات. لن نعرض تقديرات أو أرقامًا بديلة." : "Channel data could not be loaded. No estimates or substitute metrics will be shown."}
        </AdminCard>
      ) : null}

      <AdminGrid className="mb-6 md:grid-cols-4">
        <AdminStatCard label={isArabic ? "زيارات" : "Visits"} value={totalVisits} />
        <AdminStatCard label={isArabic ? "تسجيلات" : "Registrations"} value={totalRegistrations} />
        <AdminStatCard label={isArabic ? "طلبات تقديم" : "Applications"} value={totalApplications} />
        <AdminStatCard label={isArabic ? "Briefs مثبتة" : "Verified briefs"} value={totalBriefs} />
      </AdminGrid>

      <AdminCard className="mb-6 border border-gold/15 bg-gold/[0.035] p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "قرار القناة" : "CHANNEL DECISION"}</p>
        <p className="mt-2 text-sm leading-7 text-white/75">{diagnosis}</p>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "دليل النتائج" : "OUTCOME EVIDENCE"}</p>
          <h2 className="mt-1 text-lg text-white">{isArabic ? "من يجلب نتائج فعلية؟" : "Which channels produce real outcomes?"}</h2>
          <p className="mt-2 text-xs leading-6 text-white/35">
            {isArabic ? "يتم الترتيب حسب أعمق نتيجة مثبتة أولًا، ثم حجم النتائج. النسب لا تظهر إذا لم يوجد المقام اللازم لحسابها." : "Rows are ranked by the deepest verified outcome first, then outcome volume. Rates remain blank when the required denominator does not exist."}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/[0.06] text-xs text-white/35">
              <tr>
                <th className="px-4 py-3 text-start">{isArabic ? "المصدر / الحملة" : "Source / campaign"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "الدليل" : "Evidence"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "زيارات" : "Visits"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "تسجيل" : "Regs"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "تقديم" : "Apps"}</th>
                <th className="px-4 py-3 text-end">Briefs</th>
                <th className="px-4 py-3 text-end">{isArabic ? "زيارة←تسجيل" : "Visit→reg"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "تسجيل←تقديم" : "Reg→app"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "زيارة←Brief" : "Visit→brief"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-white/35">{isArabic ? "لا توجد نتائج قابلة للإسناد ضمن الفترة المحددة." : "No attributable outcomes in the selected range."}</td></tr>
              ) : rows.map((row) => (
                <tr key={`${row.source}:${row.campaign ?? ""}`} className="border-b border-white/[0.045] last:border-b-0">
                  <td className="px-4 py-3 text-white/70">
                    <div>{row.source}</div>
                    <div className="mt-1 text-xs text-white/30">{row.campaign ?? (isArabic ? "بدون حملة" : "No campaign")}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gold/70">{isArabic ? tierLabels[row.evidenceTier].ar : tierLabels[row.evidenceTier].en}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.visits}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.registrations}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.applications}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-gold/80">{row.briefs}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/45">{displayRate(row.registrationRate)}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/45">{displayRate(row.applicationRate)}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/45">{displayRate(row.briefRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/[0.06] p-5 text-xs leading-6 text-white/30">
          {isArabic ? "هذه اللوحة تستخدم فقط أحداث marketing_events المسجلة فعليًا، وبحد أقصى آخر 5000 حدث مطابق للفترة. لا تعتبر الزيارة أو النقرة نتيجة تجارية ما لم يوجد حدث نتيجة موثق." : "This view uses recorded marketing_events only, capped at the latest 5,000 matching events in the selected period. A visit or click is not treated as a business outcome without a verified outcome event."}
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
