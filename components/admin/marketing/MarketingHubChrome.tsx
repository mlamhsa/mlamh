"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { MarketingHubNav } from "@/components/admin/marketing/MarketingHubNav";
import {
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";

type MarketingHubHealth = {
  approvals: number;
  overdue: number;
  enrichment: number;
  creative: number;
  failed: number;
  briefs: number;
};

export function MarketingHubChrome({
  schedulerConfigured,
  health,
  children,
}: {
  schedulerConfigured: boolean;
  health: MarketingHubHealth;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const language = getAdminLanguage(searchParams.get("lang"));
  const isArabic = language === "ar";
  const blockers = health.overdue + health.failed;

  const items = [
    {
      href: "/admin/marketing/approvals",
      labelAr: "قراراتك",
      labelEn: "Your decisions",
      value: health.approvals,
      accent: health.approvals > 0,
    },
    {
      href: "/admin/marketing/follow-ups",
      labelAr: "متابعات متأخرة",
      labelEn: "Overdue follow-ups",
      value: health.overdue,
      danger: health.overdue > 0,
    },
    {
      href: "/admin/marketing/leads",
      labelAr: "تجهيز العملاء",
      labelEn: "Lead enrichment",
      value: health.enrichment,
    },
    {
      href: "/admin/marketing/creative",
      labelAr: "تصاميم قيد الإنتاج",
      labelEn: "Creative in progress",
      value: health.creative,
    },
    {
      href: "/admin/marketing/social",
      labelAr: "نشر يحتاج إصلاح",
      labelEn: "Publishing issues",
      value: health.failed,
      danger: health.failed > 0,
    },
    {
      href: "/admin/marketing/briefs",
      labelAr: "Briefs جاهزة",
      labelEn: "Ready briefs",
      value: health.briefs,
      accent: health.briefs > 0,
    },
  ];

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      {!schedulerConfigured ? (
        <div className="mx-4 mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.045] px-4 py-3 text-xs text-amber-100/75 sm:mx-6 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <span className="font-medium text-amber-100">
              {isArabic
                ? "المجدول التلقائي · يحتاج إعداد"
                : "Autonomous scheduler · Setup required"}
            </span>
            <span className="mt-1 block text-amber-100/45 sm:ms-2 sm:mt-0 sm:inline">
              {isArabic
                ? "أدوات الذكاء الاصطناعي متاحة، لكن الدورات المجدولة ستبقى مقفلة بأمان حتى يكتمل إعداد مصادقة Cron على الخادم."
                : "AI tools remain available, but scheduled cycles stay safely locked until server-side cron authentication is configured."}
            </span>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
        </div>
      ) : null}

      <div className="px-4 pt-5 sm:px-6 sm:pt-6">
        <MarketingHubNav />
      </div>

      <div className="mx-4 mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20 sm:mx-6">
        <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <HealthLink
              key={item.href}
              href={withAdminLanguage(item.href, language)}
              label={isArabic ? item.labelAr : item.labelEn}
              value={item.value}
              accent={item.accent}
              danger={item.danger}
            />
          ))}
        </div>

        <div
          className={`border-t px-4 py-2.5 text-[11px] leading-5 ${
            blockers > 0
              ? "border-amber-300/10 bg-amber-300/[0.025] text-amber-100/60"
              : "border-white/[0.05] text-white/30"
          }`}
        >
          {blockers > 0
            ? isArabic
              ? `الأولوية التشغيلية: معالجة ${blockers} عائق فعلي قبل زيادة حجم المهام.`
              : `Operational priority: resolve ${blockers} blocker${blockers === 1 ? "" : "s"} before increasing workload.`
            : isArabic
              ? "لا توجد أعطال نشر أو متابعات متأخرة حاليًا — ركّز على القرارات والمخرجات الجاهزة."
              : "No publishing failures or overdue follow-ups right now — focus on decisions and ready outputs."}
        </div>
      </div>

      {children}
    </div>
  );
}

function HealthLink({
  href,
  label,
  value,
  accent = false,
  danger = false,
}: {
  href: string;
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="min-w-0 bg-black/30 px-3 py-3 transition hover:bg-white/[0.025] sm:px-4"
    >
      <p className="text-[10px] leading-4 text-white/35">{label}</p>
      <p
        className={`mt-1 text-xl ${
          danger ? "text-red-100" : accent ? "text-gold" : "text-white/80"
        }`}
      >
        {value}
      </p>
    </Link>
  );
}
