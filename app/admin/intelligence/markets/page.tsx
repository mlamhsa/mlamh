import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildCommandCenterOverview } from "@/lib/intelligence/core/overview";

export const metadata = {
  title: "Market Intelligence — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

function healthLabel(isArabic: boolean, state: string) {
  const labels: Record<string, { ar: string; en: string }> = {
    not_applicable: { ar: "غير متاح", en: "N/A" },
    cold: { ar: "بارد", en: "Cold" },
    developing: { ar: "قيد التطور", en: "Developing" },
    active: { ar: "نشط", en: "Active" },
    healthy: { ar: "صحي", en: "Healthy" },
  };
  return labels[state] ? (isArabic ? labels[state].ar : labels[state].en) : state;
}

export default async function MarketIntelligencePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang = "ar" } = await searchParams;
  const isArabic = lang !== "en";
  const overview = await buildCommandCenterOverview();
  const healthByCountry = new Map(overview.marketHealth.map((item) => [item.countryCode, item.health]));

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="MLAMH Market Intelligence"
        description={
          isArabic
            ? "قراءة تشغيلية حتمية للأسواق. السعودية فقط لها بيانات صحة حية؛ بقية الأسواق غير مفعلة ولا تحصل على درجات تشغيلية."
            : "Deterministic market operating intelligence. Only Saudi Arabia receives live health data; inactive markets never receive operating scores."
        }
      />

      <div className="mb-6 rounded-2xl border border-gold/20 bg-gold/[0.055] px-4 py-3 text-xs text-white/50">
        {isArabic
          ? "الدرجة الحالية هي مؤشر سيولة تشغيلي مبني على وجود العرض المؤهل، الناشرين، الفرص، الطلبات، الاختيارات والتواصل. ليست توقعًا ماليًا ولا تقييمًا مولدًا بالذكاء الاصطناعي."
          : "The current score is an operating-liquidity indicator based on observable qualified supply, publishers, opportunities, applications, selections and connections. It is not a financial forecast or an AI-generated rating."}
      </div>

      <AdminGrid className="md:grid-cols-2 xl:grid-cols-4">
        {overview.markets.map((market) => {
          const health = healthByCountry.get(market.countryCode);
          return (
            <AdminCard key={market.countryCode}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-white/35">{market.countryCode} · {market.currency}</p>
                  <h2 className="mt-2 text-lg font-light text-white">
                    {isArabic ? market.nameAr : market.nameEn}
                  </h2>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${market.isOperational ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200" : "border-white/[0.08] bg-white/[0.03] text-white/35"}`}>
                  {market.isOperational ? (isArabic ? "مفعّل" : "Active") : (isArabic ? "غير مفعّل" : "Not activated")}
                </span>
              </div>

              <div className="mt-5 border-t border-white/[0.07] pt-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Live Health</p>
                    <p className="mt-1 text-sm text-white/70">{healthLabel(isArabic, health?.state ?? "not_applicable")}</p>
                  </div>
                  <p className="text-3xl font-light text-white" dir="ltr">
                    {health?.score === null || health?.score === undefined ? "N/A" : health.score}
                  </p>
                </div>

                {health?.available ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/40">
                    <span>{isArabic ? "عرض مؤهل" : "Supply"}: {health.components.supplyPresent ? "✓" : "—"}</span>
                    <span>{isArabic ? "ناشرون" : "Publishers"}: {health.components.publisherPresent ? "✓" : "—"}</span>
                    <span>{isArabic ? "طلب" : "Demand"}: {health.components.demandPresent ? "✓" : "—"}</span>
                    <span>{isArabic ? "تقديمات" : "Applications"}: {health.components.applicationFlow ? "✓" : "—"}</span>
                    <span>{isArabic ? "اختيارات" : "Selections"}: {health.components.selectionFlow ? "✓" : "—"}</span>
                    <span>{isArabic ? "تواصل" : "Connections"}: {health.components.connectionFlow ? "✓" : "—"}</span>
                  </div>
                ) : (
                  <p className="mt-4 text-xs leading-5 text-white/30">
                    {isArabic ? "لا يتم حساب صحة حية لسوق غير مفعّل." : "Live health is intentionally not calculated for an inactive market."}
                  </p>
                )}
              </div>
            </AdminCard>
          );
        })}
      </AdminGrid>
    </AdminPageContainer>
  );
}
