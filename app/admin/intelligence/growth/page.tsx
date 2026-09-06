import Link from "next/link";

import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildGrowthIntelligence } from "@/lib/intelligence/growth/service";

export const metadata = {
  title: "Growth Intelligence — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };

function rate(value: number | null) {
  return value === null ? "N/A" : `${value}%`;
}

function stateCopy(isArabic: boolean, state: string) {
  const labels: Record<string, { ar: string; en: string }> = {
    insufficient_data: { ar: "بيانات غير كافية", en: "Insufficient data" },
    registration_leak: { ar: "تسرب قبل التسجيل", en: "Registration leak" },
    activation_leak: { ar: "تسرب بعد التسجيل", en: "Activation leak" },
    demand_gap: { ar: "فجوة في جانب الطلب", en: "Demand gap" },
    healthy: { ar: "الحلقة تتحرك", en: "Loop moving" },
  };
  const value = labels[state];
  return value ? (isArabic ? value.ar : value.en) : state;
}

export default async function GrowthIntelligencePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang = "ar" } = await searchParams;
  const isArabic = lang !== "en";
  const language = isArabic ? "ar" : "en";
  const intelligence = await buildGrowthIntelligence();
  const { funnel } = intelligence;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow="GROWTH INTELLIGENCE"
        title={isArabic ? "ذكاء النمو" : "Growth Intelligence"}
        description={
          isArabic
            ? "قراءة تشغيلية حتمية لآخر 30 يومًا من أحداث النمو المسجلة: الوصول، التسجيل، التفعيل والطلب. لا تنفيذ خارجي ولا أرقام مولدة بالذكاء الاصطناعي."
            : "A deterministic 30-day read of recorded growth events across acquisition, registration, activation, and demand. No external execution and no AI-generated source-of-truth metrics."
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.055] px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold">SHADOW MODE · SA ONLY</p>
          <p className="mt-1 text-xs text-white/45">
            {isArabic ? "Exact recorded counts · توصية فقط" : "Exact recorded counts · recommendation only"}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-medium text-emerald-200">
          READ ONLY
        </span>
      </div>

      <AdminGrid className="mb-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={isArabic ? "زيارات منسوبة" : "Attributed visits"} value={funnel.visits} />
        <AdminStatCard label={isArabic ? "تسجيلات مكتملة" : "Registrations"} value={funnel.registrations} />
        <AdminStatCard label={isArabic ? "طلبات تقديم" : "Applications"} value={funnel.applications} />
        <AdminStatCard label={isArabic ? "Briefs مستلمة" : "Briefs received"} value={funnel.briefs} />
      </AdminGrid>

      <div className="mb-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <AdminCard className="overflow-hidden">
          <div className="border-b border-white/[0.07] p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">DETERMINISTIC FUNNEL</p>
            <h2 className="mt-1 text-lg text-white">{isArabic ? "مسار التحويل" : "Conversion flow"}</h2>
          </div>
          <div className="grid gap-px bg-white/[0.06] sm:grid-cols-3">
            <div className="bg-black/20 p-5">
              <p className="text-xs text-white/35">{isArabic ? "زيارة ← تسجيل" : "Visit → registration"}</p>
              <p className="mt-2 text-3xl font-light text-white">{rate(funnel.registrationRate)}</p>
            </div>
            <div className="bg-black/20 p-5">
              <p className="text-xs text-white/35">{isArabic ? "تسجيل ← تقديم" : "Registration → application"}</p>
              <p className="mt-2 text-3xl font-light text-white">{rate(funnel.applicationActivationRate)}</p>
            </div>
            <div className="bg-black/20 p-5">
              <p className="text-xs text-white/35">{isArabic ? "زيارة ← Brief" : "Visit → brief"}</p>
              <p className="mt-2 text-3xl font-light text-gold">{rate(funnel.briefRate)}</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-gold/20 bg-gold/[0.035] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/65">OPERATING SIGNAL</p>
          <h2 className="mt-2 text-xl font-light text-white">{stateCopy(isArabic, funnel.state)}</h2>
          <p className="mt-4 text-xs leading-6 text-white/45">
            {isArabic
              ? "الحالة أعلاه مشتقة من قواعد ثابتة فوق الأحداث المسجلة، وليست رأيًا أو تصنيفًا من نموذج لغوي."
              : "The state above is derived from fixed rules over recorded events; it is not a language-model opinion or classification."}
          </p>
        </AdminCard>
      </div>

      <AdminCard className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">RECOMMENDED NEXT ACTION</p>
            <h2 className="mt-2 text-lg text-white">{intelligence.recommendation.title}</h2>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[10px] uppercase tracking-wider text-amber-100/75">
            HUMAN DECISION
          </span>
        </div>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-white/55">{intelligence.recommendation.summary}</p>
        <p className="mt-3 text-xs text-white/30">
          {isArabic ? "لا يتم إرسال Outreach أو تشغيل حملة من هذه الشاشة." : "No outreach or campaign execution occurs from this workspace."}
        </p>
      </AdminCard>

      <AdminCard className="mb-6 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">DATA GAPS</p>
        <div className="mt-4 space-y-3">
          {intelligence.dataGaps.map((gap) => (
            <div key={gap.key} className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
              <p className="text-xs font-medium text-white/70">{gap.key}</p>
              <p className="mt-1 text-xs leading-5 text-white/35">{gap.description}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href={`/admin/intelligence?lang=${language}`} className="text-gold hover:underline">
          {isArabic ? "← العودة إلى AI Command Center" : "← Back to AI Command Center"}
        </Link>
        <Link href={`/admin/marketing/analytics?lang=${language}`} className="text-white/45 hover:text-gold">
          {isArabic ? "فتح تحليلات Marketing Hub" : "Open Marketing Hub analytics"}
        </Link>
      </div>
    </AdminPageContainer>
  );
}
