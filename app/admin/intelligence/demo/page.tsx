import Link from "next/link";

import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildInvestorDemoSnapshot } from "@/lib/intelligence/demo/investor";

export const metadata = {
  title: "Investor Demo — MLAMH AI Command Center",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string; project?: string }>;
};

function formatMetric(value: number | null, unit: "percent" | "ratio") {
  if (value === null) return "N/A";
  return unit === "percent" ? `${value}%` : value.toFixed(1);
}

export default async function InvestorDemoPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang = "ar", project } = await searchParams;
  const isArabic = lang !== "en";
  const language = isArabic ? "ar" : "en";
  const requestedProject = project ? Number(project) : null;
  const snapshot = await buildInvestorDemoSnapshot(
    Number.isInteger(requestedProject) && (requestedProject ?? 0) > 0 ? requestedProject : null,
  );

  const metricLabels: Record<string, { ar: string; en: string }> = {
    qualified_talent_rate: { ar: "نسبة العرض المؤهل", en: "Qualified talent rate" },
    application_acceptance_rate: { ar: "معدل قبول التقديمات", en: "Application acceptance" },
    applications_per_opportunity: { ar: "التقديمات لكل فرصة", en: "Applications per opportunity" },
    conversation_followthrough_rate: { ar: "الانتقال إلى محادثة", en: "Conversation follow-through" },
  };

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "Investor Demo Mode" : "Investor Demo Mode"}
        description={
          isArabic
            ? "عرض استثماري مُعقّم يعمل فوق محركات MLAMH الحقيقية. لا تظهر أسماء العملاء أو المواهب ولا يتم تنفيذ أي إجراء إنتاجي."
            : "A sanitized investor-facing view powered by MLAMH's real engines. Client and talent identities are hidden and no production action is executed."
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold">LIVE ENGINE · SANITIZED OUTPUT</p>
          <p className="mt-1 text-xs text-white/45">
            {isArabic
              ? "السعودية · Shadow Mode · قراءة وتحليل فقط"
              : "Saudi Arabia · Shadow Mode · Read and analyze only"}
          </p>
        </div>
        <Link href={`/admin/intelligence?lang=${language}`} className="text-xs text-gold hover:underline">
          {isArabic ? "العودة إلى Command Center" : "Back to Command Center"}
        </Link>
      </div>

      <AdminCard className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">Investor Story</p>
        <h2 className="mt-2 text-2xl font-light text-white">
          {isArabic
            ? "من بيانات السوق إلى قرار تشغيل — بدون كشف بيانات حساسة"
            : "From marketplace data to an operating decision — without exposing sensitive data"}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-white/45">
          {isArabic
            ? "هذا العرض يثبت أن MLAMH لا يضيف واجهة AI فوق النظام فقط؛ بل يعيد استخدام محرك التأهيل ومحرك العرض وسياسة السوق والحلقة التشغيلية لإنتاج قراءة قابلة للتدقيق."
            : "This view demonstrates that MLAMH is not adding an AI skin on top of the platform; it reuses qualification, supply, market policy and operating-loop engines to produce auditable intelligence."}
        </p>
      </AdminCard>

      <div className="mb-8">
        <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-gold/70">Core Marketplace Loop</p>
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["Supply", snapshot.executive.operatingLoop.supplyAvailable],
            ["Demand", snapshot.executive.operatingLoop.demandAvailable],
            ["Applications", snapshot.executive.operatingLoop.applicationsAvailable],
            ["Selections", snapshot.executive.operatingLoop.selectionsAvailable],
            ["Connections", snapshot.executive.operatingLoop.connectionsAvailable],
          ].map(([label, active]) => (
            <div
              key={String(label)}
              className={`rounded-2xl border p-4 ${
                active
                  ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                  : "border-white/[0.08] bg-white/[0.025]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">{String(label)}</p>
              <p className={`mt-3 text-sm font-medium ${active ? "text-emerald-200" : "text-white/35"}`}>
                {active ? (isArabic ? "موجود" : "Present") : (isArabic ? "غير متحقق" : "Not present")}
              </p>
            </div>
          ))}
        </div>
      </div>

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.executive.metrics.map((metric) => {
          const label = metricLabels[metric.key];
          return (
            <AdminStatCard
              key={metric.key}
              label={isArabic ? label.ar : label.en}
              value={formatMetric(metric.value, metric.unit)}
            />
          );
        })}
      </AdminGrid>

      <AdminCard className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">Casting Intelligence</p>
            <h2 className="mt-2 text-xl font-light text-white">
              {snapshot.scenario?.label ?? (isArabic ? "لا يوجد سيناريو Casting متاح" : "No casting scenario available")}
            </h2>
          </div>
          {snapshot.scenario ? (
            <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
              snapshot.scenario.status === "covered"
                ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200"
                : "border-amber-400/25 bg-amber-400/[0.08] text-amber-200"
            }`}>
              {snapshot.scenario.status === "covered"
                ? isArabic ? "العرض يغطي الطلب" : "Supply covered"
                : isArabic ? "فجوة عرض" : "Supply gap"}
            </span>
          ) : null}
        </div>

        {snapshot.scenario ? (
          <>
            <AdminGrid className="mt-6 md:grid-cols-3">
              <AdminStatCard label={isArabic ? "المطلوب" : "Needed"} value={snapshot.scenario.totalNeeded} />
              <AdminStatCard label={isArabic ? "القابل للإرسال" : "Sendable"} value={snapshot.scenario.totalSendable} />
              <AdminStatCard label={isArabic ? "الفجوة" : "Gap"} value={snapshot.scenario.totalMissing} />
            </AdminGrid>

            <div className="mt-6 space-y-3">
              {snapshot.scenario.roles.map((role) => (
                <div key={role.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div>
                      <p className="text-[10px] text-white/30">{role.label}</p>
                      <p className="mt-1 text-sm text-white/70">{isArabic ? "دور مُعقّم" : "Sanitized role"}</p>
                    </div>
                    <div><p className="text-[10px] text-white/30">Needed</p><p className="mt-1 text-sm text-white/70">{role.needed}</p></div>
                    <div><p className="text-[10px] text-white/30">Qualified</p><p className="mt-1 text-sm text-white/70">{role.qualified}</p></div>
                    <div><p className="text-[10px] text-white/30">Sendable</p><p className="mt-1 text-sm text-white/70">{role.sendable}</p></div>
                    <div><p className="text-[10px] text-white/30">Gap</p><p className="mt-1 text-sm text-white/70">{role.missing}</p></div>
                  </div>
                  {role.topBlockers.length ? (
                    <div className="mt-4 border-t border-white/[0.06] pt-3">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">Top deterministic blockers</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {role.topBlockers.map((blocker) => (
                          <span key={blocker.reason} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/45">
                            {blocker.reason} · {blocker.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-white/35">
            {isArabic
              ? "لم يتم اختراع سيناريو بديل. عند توفر مشروع Casting سيتم تشغيل نفس المحرك الحي عليه وإظهار المخرجات بشكل مُعقّم."
              : "No substitute scenario is invented. When a casting project exists, the same live engine will analyze it and expose only sanitized output."}
          </p>
        )}
      </AdminCard>

      <AdminGrid className="mb-8 lg:grid-cols-2">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Executive Priority</p>
          <h2 className="mt-2 text-lg font-light text-white">{isArabic ? "أولوية التشغيل الحالية" : "Current operating priority"}</h2>
          <div className="mt-4 space-y-3">
            {snapshot.executive.priorities.length ? snapshot.executive.priorities.slice(0, 3).map((priority) => (
              <div key={priority.key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-sm text-white/70">{isArabic ? priority.titleAr : priority.title}</p>
                <p className="mt-1 text-xs leading-5 text-white/35">{isArabic ? priority.summaryAr : priority.summary}</p>
              </div>
            )) : (
              <p className="text-sm text-white/35">{isArabic ? "لا توجد أولوية حتمية إضافية حاليًا." : "No additional deterministic priority is currently identified."}</p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Proof of Architecture</p>
          <h2 className="mt-2 text-lg font-light text-white">{isArabic ? "ما الذي يثبته هذا العرض؟" : "What this demo proves"}</h2>
          <div className="mt-4 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
            <p>✓ Talent Qualification Engine</p>
            <p>✓ Talent Supply Engine</p>
            <p>✓ Market Policy Boundary</p>
            <p>✓ Deterministic Metrics</p>
            <p>✓ Sanitized Output</p>
            <p>✓ No Core Writes</p>
            <p>✓ No External Execution</p>
            <p>✓ Saudi-only operational boundary</p>
          </div>
        </AdminCard>
      </AdminGrid>

      <p className="pb-2 text-[11px] text-white/25">
        {isArabic ? "توليد العرض: " : "Generated: "}
        <span dir="ltr">{snapshot.generatedAt}</span>
      </p>
    </AdminPageContainer>
  );
}
