import Link from "next/link";

import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildTalentSupplyIntelligenceOverview } from "@/lib/intelligence/talent-supply/overview";

export const metadata = {
  title: "Talent Supply Intelligence — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

const statusLabels = {
  covered: { ar: "تغطية أساسية", en: "Baseline covered" },
  constrained: { ar: "ضغط على العرض", en: "Supply pressure" },
  no_supply: { ar: "لا يوجد عرض مؤهل", en: "No qualified supply" },
  reserve: { ar: "عرض احتياطي", en: "Reserve supply" },
  insufficient_data: { ar: "بيانات غير مكتملة", en: "Insufficient data" },
} as const;

export default async function TalentSupplyIntelligencePage({ searchParams }: PageProps) {
  await requireAdminAccess();

  const { lang = "ar" } = await searchParams;
  const isArabic = lang !== "en";
  const language = isArabic ? "ar" : "en";
  const overview = await buildTalentSupplyIntelligenceOverview();
  const coverage = overview.coverage;
  const pressureSegments = coverage.segments.filter((segment) =>
    ["no_supply", "constrained"].includes(segment.status),
  );

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "ذكاء عرض المواهب" : "Talent Supply Intelligence"}
        description={
          isArabic
            ? "قراءة تشغيلية حتمية للعرض المؤهل مقابل طلبات الكاستينغ المفتوحة في السعودية. هذا القسم لا ينفذ تواصلًا أو استقطابًا تلقائيًا."
            : "A deterministic operating view of qualified supply versus open casting-pipeline demand in Saudi Arabia. This workspace does not execute outreach or acquisition automatically."
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.055] px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold">SHADOW · SAUDI LIVE DATA</p>
          <p className="mt-1 text-xs text-white/45">
            {isArabic
              ? "مقارنة Role + City فقط — وليست مطابقة Brief كاملة أو وعدًا بتوفر المواهب."
              : "Role + City baseline only — not full brief matching and not a promise of talent availability."}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-medium text-emerald-200">
          READ ONLY
        </span>
      </div>

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={isArabic ? "مواهب مؤهلة في السعودية" : "Qualified Saudi supply"}
          value={coverage.qualifiedTalentCount}
        />
        <AdminStatCard
          label={isArabic ? "طلب مواهب في المسار المفتوح" : "Open pipeline demand"}
          value={coverage.openDemandCount}
        />
        <AdminStatCard
          label={isArabic ? "مشاريع Casting مفتوحة" : "Open casting projects"}
          value={coverage.openProjectCount}
        />
        <AdminStatCard
          label={isArabic ? "قطاعات تحتاج متابعة" : "Segments needing attention"}
          value={pressureSegments.length}
        />
      </AdminGrid>

      <AdminCard className="mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Supply Coverage Matrix</p>
            <h2 className="mt-2 text-xl font-light text-white">
              {isArabic ? "الطلب مقابل العرض المؤهل حسب المدينة والفئة" : "Pipeline demand vs qualified supply by city and role"}
            </h2>
          </div>
          <Link
            href={`/admin/intelligence/casting?lang=${language}`}
            className="text-xs font-medium text-gold hover:underline"
          >
            {isArabic ? "فتح المطابقة الدقيقة للـBrief ←" : "Open exact brief analysis →"}
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-white/[0.07] bg-white/[0.025] text-xs text-white/35">
              <tr>
                <th className="px-4 py-3 text-start">{isArabic ? "الفئة" : "Role"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "المدينة" : "City"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "عرض مؤهل" : "Qualified supply"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "طلب المسار" : "Pipeline demand"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "المشاريع" : "Projects"}</th>
                <th className="px-4 py-3 text-start">{isArabic ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {coverage.segments.length ? (
                coverage.segments.map((segment) => {
                  const label = statusLabels[segment.status];
                  const needsAttention = ["no_supply", "constrained"].includes(segment.status);
                  return (
                    <tr key={`${segment.role}:${segment.city}`} className="text-white/65">
                      <td className="px-4 py-3 capitalize text-white/80">{segment.role}</td>
                      <td className="px-4 py-3 capitalize">{segment.city}</td>
                      <td className="px-4 py-3" dir="ltr">{segment.qualifiedSupply}</td>
                      <td className="px-4 py-3" dir="ltr">{segment.pipelineDemand}</td>
                      <td className="px-4 py-3" dir="ltr">{segment.openProjects}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] ${
                            needsAttention
                              ? "border-amber-300/20 bg-amber-300/[0.07] text-amber-100/80"
                              : "border-white/[0.08] bg-white/[0.03] text-white/45"
                          }`}
                        >
                          {isArabic ? label.ar : label.en}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/35">
                    {isArabic ? "لا توجد بيانات كافية لبناء مصفوفة العرض حاليًا." : "Not enough data to build a supply matrix yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminGrid className="mb-8 lg:grid-cols-2">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Pressure Signals</p>
          <h2 className="mt-2 text-lg font-light text-white">
            {isArabic ? "أين نحتاج انتباهًا؟" : "Where does supply need attention?"}
          </h2>
          <div className="mt-5 space-y-3">
            {overview.signals.length ? (
              overview.signals.slice(0, 8).map((signal) => (
                <div key={signal.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white/75">
                      {String(signal.facts.role)} · {String(signal.facts.city)}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-amber-200/75">{signal.severity}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/40" dir="ltr">
                    supply {String(signal.facts.qualifiedSupply)} · demand {String(signal.facts.pipelineDemand)}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-white/35">
                {isArabic ? "لا توجد ضغوط أساسية مؤكدة في البيانات الحالية." : "No confirmed baseline supply pressure in the current data."}
              </p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Recommended Actions</p>
          <h2 className="mt-2 text-lg font-light text-white">
            {isArabic ? "توصيات تحتاج قرارًا بشريًا" : "Recommendations requiring human judgment"}
          </h2>
          <div className="mt-5 space-y-3">
            {overview.recommendations.length ? (
              overview.recommendations.slice(0, 8).map((recommendation) => (
                <div key={recommendation.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <p className="text-sm font-medium text-white/75">{recommendation.title}</p>
                  <p className="mt-2 text-xs leading-6 text-white/40">{recommendation.summary}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-white/35">
                {isArabic ? "لا توجد توصيات تصعيدية في النطاق الحالي." : "No escalation recommendations in the current scope."}
              </p>
            )}
          </div>
        </AdminCard>
      </AdminGrid>

      <p className="text-xs text-white/25">
        {isArabic
          ? "ملاحظة: هذه المصفوفة مؤشر تخطيطي فقط. Supply Gap الدقيق يبقى من محرك المطابقة لكل Brief لأنه يطبق الجنس والتوفر والمتطلبات الصلبة وبقية القيود."
          : "Note: this matrix is a planning indicator only. Exact Supply Gap remains brief-specific because the matching engine applies gender, availability, hard requirements, and the rest of the constraints."}
      </p>
    </AdminPageContainer>
  );
}
