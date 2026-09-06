import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildCommandCenterOverview } from "@/lib/intelligence/core/overview";

export const metadata = {
  title: "AI Command Center — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

function statusLabel(
  isArabic: boolean,
  operationalStatus: "active" | "not_activated",
) {
  if (operationalStatus === "active") {
    return isArabic ? "مفعّل" : "Active";
  }
  return isArabic ? "غير مفعّل" : "Not activated";
}

export default async function AdminIntelligencePage({ searchParams }: PageProps) {
  await requireAdminAccess();

  const { lang = "ar" } = await searchParams;
  const isArabic = lang !== "en";
  const overview = await buildCommandCenterOverview();

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="MLAMH AI Command Center"
        description={
          isArabic
            ? "طبقة ذكاء تشغيلية مستقلة للقراءة والتحليل فقط. لا توجد أي إجراءات إنتاجية تلقائية مفعّلة."
            : "An isolated operational intelligence layer for read-only analysis. No automated production actions are enabled."
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.055] px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold">
            SHADOW INTELLIGENCE MODE
          </p>
          <p className="mt-1 text-xs text-white/45">
            {isArabic
              ? "قراءة · تحليل · توصيات — بدون كتابة على MLAMH Core"
              : "Read · analyze · recommend — no writes to MLAMH Core"}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-medium text-emerald-200">
          READ ONLY
        </span>
      </div>

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={isArabic ? "ملفات المواهب" : "Talent profiles"}
          value={overview.marketplace.talentProfiles}
        />
        <AdminStatCard
          label={isArabic ? "المواهب المؤهلة" : "Qualified talents"}
          value={overview.marketplace.qualifiedTalents}
        />
        <AdminStatCard
          label={isArabic ? "الفرص المنشورة" : "Published opportunities"}
          value={overview.marketplace.publishedOpportunities}
        />
        <AdminStatCard
          label={isArabic ? "طلبات التقديم" : "Applications"}
          value={overview.marketplace.applications}
        />
      </AdminGrid>

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label={isArabic ? "الناشرون" : "Publishers"}
          value={overview.marketplace.publishers}
        />
        <AdminStatCard
          label={isArabic ? "طلبات مقبولة" : "Accepted applications"}
          value={overview.marketplace.acceptedApplications}
        />
        <AdminStatCard
          label={isArabic ? "محادثات نشطة" : "Active conversations"}
          value={overview.marketplace.activeConversations}
        />
      </AdminGrid>

      <div className="mb-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">
              Market Intelligence
            </p>
            <h2 className="mt-1 text-xl font-light text-white">
              {isArabic ? "حالة الأسواق" : "Market status"}
            </h2>
          </div>
          <p className="text-xs text-white/30">
            {isArabic
              ? "السعودية فقط مفعّلة تشغيليًا حاليًا"
              : "Saudi Arabia is currently the only operational market"}
          </p>
        </div>

        <AdminGrid className="md:grid-cols-2 xl:grid-cols-4">
          {overview.markets.map((market) => (
            <AdminCard key={market.countryCode}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-white/35">
                    <span>{market.countryCode}</span>
                    <span>·</span>
                    <span>{market.currency}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-light text-white">
                    {isArabic ? market.nameAr : market.nameEn}
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    market.isOperational
                      ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200"
                      : "border-white/[0.08] bg-white/[0.03] text-white/35"
                  }`}
                >
                  {statusLabel(isArabic, market.operationalStatus)}
                </span>
              </div>

              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <p className="text-xs text-white/35">
                  {market.isOperational
                    ? isArabic
                      ? "بيانات تشغيلية فعلية متاحة"
                      : "Live operational data available"
                    : isArabic
                      ? "موجود في البنية فقط — لا تشغيل حي"
                      : "Architecture-ready only — no live operations"}
                </p>
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      </div>

      <AdminGrid className="mb-8 lg:grid-cols-2">
        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">
            Critical Signals
          </p>
          <h2 className="mt-2 text-lg font-light text-white">
            {isArabic ? "الإشارات المهمة" : "Priority signals"}
          </h2>

          <div className="mt-5 space-y-3">
            {overview.criticalSignals.length ? (
              overview.criticalSignals.map((signal) => (
                <div
                  key={signal.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-white/75">{signal.type}</span>
                    <span className="text-[10px] uppercase tracking-wider text-amber-200/75">
                      {signal.severity}
                    </span>
                  </div>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-white/35">
                    {JSON.stringify(signal.facts, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm text-white/35">
                {isArabic
                  ? "لا توجد إشارات حرجة مؤكدة ضمن نطاق Shadow V1 الحالي."
                  : "No confirmed critical signals in the current Shadow V1 scope."}
              </p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">
            Intelligence Coverage
          </p>
          <h2 className="mt-2 text-lg font-light text-white">
            {isArabic ? "فجوات البيانات الحالية" : "Current data gaps"}
          </h2>

          <div className="mt-5 space-y-3">
            {overview.dataGaps.map((gap) => (
              <div
                key={gap.key}
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
              >
                <p className="text-xs font-medium text-white/60">{gap.key}</p>
                <p className="mt-1 text-xs leading-5 text-white/35">
                  {gap.description}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </AdminGrid>

      <p className="pb-2 text-[11px] text-white/25">
        {isArabic ? "آخر توليد: " : "Generated: "}
        <span dir="ltr">{overview.generatedAt}</span>
      </p>
    </AdminPageContainer>
  );
}
