import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { COUNTRY_CODES, COUNTRY_REGISTRY } from "@/lib/markets/countries";
import { MARKET_CONFIG, type MarketFeature } from "@/lib/markets/config";

export const metadata = {
  title: "Markets — MLAMH Admin",
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

const FEATURE_LABELS: Record<
  MarketFeature,
  { ar: string; en: string }
> = {
  talentRegistration: {
    ar: "تسجيل المواهب",
    en: "Talent Registration",
  },
  publisherRegistration: {
    ar: "تسجيل الناشرين",
    en: "Publisher Registration",
  },
  opportunityCreation: {
    ar: "إنشاء الفرص",
    en: "Opportunity Creation",
  },
  applications: {
    ar: "طلبات التقديم",
    en: "Applications",
  },
  publicTalentDirectory: {
    ar: "دليل المواهب العام",
    en: "Public Talent Directory",
  },
  publicOpportunities: {
    ar: "الفرص العامة",
    en: "Public Opportunities",
  },
  search: {
    ar: "البحث والاكتشاف",
    en: "Search & Discovery",
  },
  payments: {
    ar: "المدفوعات",
    en: "Payments",
  },
  seoIndexing: {
    ar: "الفهرسة SEO",
    en: "SEO Indexing",
  },
};

const STATUS_LABELS = {
  active: { ar: "نشط", en: "Active" },
  prepared: { ar: "مجهز وغير مفعّل", en: "Prepared / Disabled" },
  future: { ar: "مستقبلي", en: "Future" },
} as const;

export default async function AdminMarketsPage({ searchParams }: PageProps) {
  await requireAdminAccess();

  const { lang = "ar" } = await searchParams;
  const isArabic = lang !== "en";

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "الأسواق" : "Markets"}
        description={
          isArabic
            ? "عرض حالة الأسواق وميزات كل سوق. هذه الصفحة للقراءة فقط ولا تقوم بأي تفعيل أو تعديل على الإنتاج."
            : "Market status and feature readiness. This page is read-only and cannot activate or modify production markets."
        }
      />

      <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80">
        {isArabic
          ? "حماية تشغيلية: تفعيل السوق منفصل عن وجود الدولة في النظام، ولا توجد أي أزرار حفظ أو تفعيل في هذه المرحلة."
          : "Operational safeguard: market activation is independent from country existence, and no save or activation controls are available at this stage."}
      </div>

      <AdminGrid className="md:grid-cols-2 xl:grid-cols-3">
        {COUNTRY_CODES.map((countryCode) => {
          const market = MARKET_CONFIG[countryCode];
          const country = COUNTRY_REGISTRY[countryCode];
          const enabledFeatures = Object.values(market.features).filter(Boolean).length;
          const totalFeatures = Object.keys(market.features).length;

          return (
            <AdminCard key={countryCode}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs font-semibold tracking-wider text-white/70">
                      {countryCode}
                    </span>
                    <span className="text-xs text-white/35">{market.currency}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-light text-white">
                    {isArabic ? country.nameAr : country.nameEn}
                  </h2>
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    market.status === "active"
                      ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200"
                      : market.status === "prepared"
                        ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-100/80"
                        : "border-white/[0.08] bg-white/[0.035] text-white/45"
                  }`}
                >
                  {isArabic
                    ? STATUS_LABELS[market.status].ar
                    : STATUS_LABELS[market.status].en}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-y border-white/[0.07] py-3 text-xs">
                <span className="text-white/40">
                  {isArabic ? "الميزات المفعلة" : "Enabled features"}
                </span>
                <span className="font-medium tabular-nums text-white/75">
                  {enabledFeatures}/{totalFeatures}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {(Object.keys(market.features) as MarketFeature[]).map((feature) => {
                  const enabled = market.features[feature];

                  return (
                    <div
                      key={feature}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <span className="text-xs text-white/55">
                        {isArabic ? FEATURE_LABELS[feature].ar : FEATURE_LABELS[feature].en}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          enabled ? "text-emerald-300" : "text-white/30"
                        }`}
                      >
                        {enabled
                          ? isArabic
                            ? "مفعّل"
                            : "Enabled"
                          : isArabic
                            ? "متوقف"
                            : "Disabled"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </AdminCard>
          );
        })}
      </AdminGrid>
    </AdminPageContainer>
  );
}
