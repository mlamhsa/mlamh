import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

const eventLabels: Record<string, { ar: string; en: string }> = {
  page_view: { ar: "زيارات قابلة للإسناد", en: "Attributed visits" },
  registration_completed: { ar: "تسجيلات مكتملة", en: "Completed registrations" },
  application_submitted: { ar: "طلبات تقديم", en: "Applications submitted" },
  brief_received: { ar: "طلبات عمل مستلمة", en: "Briefs received" },
};

function sourceLabel(value: string, isArabic: boolean) {
  if (!isArabic) return value;
  const labels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    google: "Google",
    direct: "مباشر",
    organic: "بحث عضوي",
    referral: "إحالة",
    email: "البريد الإلكتروني",
  };
  return labels[value.toLowerCase()] ?? value;
}

export default async function MarketingAnalyticsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_events")
    .select("id,event_name,source,medium,campaign,content,entity_type,entity_id,occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(500);

  const events = data ?? [];
  const count = (name: string) => events.filter((event) => event.event_name === name).length;
  const sources = Array.from(new Set(events.map((event) => event.source).filter((source): source is string => Boolean(source))));
  const visits = count("page_view");
  const registrations = count("registration_completed");
  const applications = count("application_submitted");
  const briefs = count("brief_received");
  const registrationRate = visits > 0 ? Math.round((registrations / visits) * 100) : 0;
  const applicationRate = registrations > 0 ? Math.round((applications / registrations) * 100) : 0;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={isArabic ? "MLAMH · قياس النمو" : "MLAMH · GROWTH MEASUREMENT"}
      title={isArabic ? "أداء التسويق" : "Marketing Performance"}
      description={isArabic ? "صورة تنفيذية لما يتحول من وصول إلى تسجيل ثم تقديم وطلب عمل، اعتمادًا على الأحداث المسجلة فعليًا فقط." : "An executive view of how attributed traffic moves into registrations, applications and briefs, using recorded events only."}
    />

    {error ? <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm leading-6 text-amber-100/80">{isArabic ? "بيانات الإسناد غير متاحة حاليًا، لذلك لن تعرض اللوحة أرقامًا تقديرية أو مختلقة." : "Attribution data is currently unavailable, so the dashboard will not show estimated or fabricated numbers."}</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-4">
      {Object.entries(eventLabels).map(([name, label]) => <AdminStatCard key={name} label={isArabic ? label.ar : label.en} value={count(name)} />)}
    </AdminGrid>

    <div className="mb-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "مسار التحويل" : "CONVERSION FLOW"}</p>
          <h2 className="mt-1 text-lg text-white">{isArabic ? "من الزيارة إلى الطلب" : "From visit to demand"}</h2>
        </div>
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
          <div className="bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "تحويل الزيارة إلى تسجيل" : "Visit → registration"}</p><p className="mt-2 text-3xl font-light text-white">{registrationRate}%</p><p className="mt-2 text-xs text-white/30">{registrations} / {visits || 0}</p></div>
          <div className="bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "تحويل التسجيل إلى تقديم" : "Registration → application"}</p><p className="mt-2 text-3xl font-light text-white">{applicationRate}%</p><p className="mt-2 text-xs text-white/30">{applications} / {registrations || 0}</p></div>
        </div>
        <div className="border-t border-white/[0.06] p-5 text-xs leading-6 text-white/35">{isArabic ? `تم الحساب من آخر ${events.length} حدث تسويقي مسجل. النسب تصبح أكثر موثوقية مع نمو حجم البيانات.` : `Calculated from the latest ${events.length} recorded marketing events. Rates become more reliable as data volume grows.`}</div>
      </AdminCard>

      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "مصادر النمو" : "GROWTH SOURCES"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "من أين يأتي الجمهور؟" : "Where is the audience coming from?"}</h2></div><span className="text-xs tabular-nums text-white/30">{sources.length}</span></div>
        <div className="mt-5 flex flex-wrap gap-2">{sources.length === 0 ? <span className="text-sm leading-6 text-white/40">{isArabic ? "لا توجد مصادر إسناد مسجلة حتى الآن." : "No attribution sources recorded yet."}</span> : sources.map((source) => <span key={source} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">{sourceLabel(source, isArabic)}</span>)}</div>
        <div className="mt-6 border-t border-white/[0.07] pt-5"><p className="text-xs text-white/35">{isArabic ? "طلبات العمل المستلمة" : "Briefs received"}</p><p className="mt-2 text-3xl font-light text-gold">{briefs}</p></div>
      </AdminCard>
    </div>
  </AdminPageContainer>;
}
