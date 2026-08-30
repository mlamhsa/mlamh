import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "MLAMH Marketing Hub — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

async function getOverviewMetrics() {
  const adminClient = createAdminClient();

  const [
    talentRegistrations,
    completedTalentProfiles,
    approvedTalents,
    talentApplications,
    publisherRegistrations,
    opportunitiesCreated,
    opportunitiesPublished,
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "talent"),
    adminClient
      .from("talents")
      .select("id", { count: "exact", head: true })
      .gte("profile_completion", 100),
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "talent")
      .eq("approval_status", "approved"),
    adminClient
      .from("opportunity_applications")
      .select("id", { count: "exact", head: true }),
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "publisher"),
    adminClient
      .from("opportunities")
      .select("id", { count: "exact", head: true }),
    adminClient
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
  ]);

  const result = {
    talentRegistrations: talentRegistrations.count ?? 0,
    completedTalentProfiles: completedTalentProfiles.count ?? 0,
    approvedTalents: approvedTalents.count ?? 0,
    talentApplications: talentApplications.count ?? 0,
    publisherRegistrations: publisherRegistrations.count ?? 0,
    opportunitiesCreated: opportunitiesCreated.count ?? 0,
    opportunitiesPublished: opportunitiesPublished.count ?? 0,
  };

  const errors = [
    talentRegistrations.error,
    completedTalentProfiles.error,
    approvedTalents.error,
    talentApplications.error,
    publisherRegistrations.error,
    opportunitiesCreated.error,
    opportunitiesPublished.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("[MarketingHubOverview]", errors);
  }

  return result;
}

export default async function MarketingHubOverviewPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const metrics = await getOverviewMetrics();

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="MLAMH Marketing Hub"
        description={
          isArabic
            ? "مركز قيادة وتشغيل النمو والتسويق في ملامح. الأرقام المتاحة أدناه تقرأ مباشرة من بيانات المنصة الحالية، وما لم يتم ربطه بعد يظهر بوضوح دون بيانات افتراضية."
            : "MLAMH's growth and marketing operating center. Available metrics below are read directly from current platform data; unavailable sources are shown as not connected rather than mocked."
        }
      />

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={isArabic ? "تسجيلات المواهب" : "Talent Registrations"} value={metrics.talentRegistrations} />
        <AdminStatCard label={isArabic ? "ملفات مواهب مكتملة" : "Completed Talent Profiles"} value={metrics.completedTalentProfiles} />
        <AdminStatCard label={isArabic ? "مواهب معتمدة" : "Approved Talents"} value={metrics.approvedTalents} />
        <AdminStatCard label={isArabic ? "طلبات المواهب" : "Talent Applications"} value={metrics.talentApplications} />
        <AdminStatCard label={isArabic ? "تسجيلات الناشرين" : "Publisher Registrations"} value={metrics.publisherRegistrations} />
        <AdminStatCard label={isArabic ? "الفرص المنشأة" : "Opportunities Created"} value={metrics.opportunitiesCreated} />
        <AdminStatCard label={isArabic ? "الفرص المنشورة" : "Opportunities Published"} value={metrics.opportunitiesPublished} />
      </AdminGrid>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminCard className="p-5 xl:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70">Sprint 001</p>
          <h2 className="mt-2 text-xl font-light text-white">
            {isArabic ? "أهداف النمو الحالية" : "Current growth goals"}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              [isArabic ? "تسجيلات المواهب" : "Talent registrations", metrics.talentRegistrations, 100],
              [isArabic ? "ملفات مكتملة" : "Complete profiles", metrics.completedTalentProfiles, 70],
              [isArabic ? "مواهب معتمدة" : "Approved talents", metrics.approvedTalents, 40],
              [isArabic ? "طلبات" : "Applications", metrics.talentApplications, 100],
            ].map(([label, value, target]) => {
              const numericValue = Number(value);
              const numericTarget = Number(target);
              const percentage = Math.min(100, Math.round((numericValue / numericTarget) * 100));

              return (
                <div key={String(label)} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/65">{label}</span>
                    <span className="tabular-nums text-gold">{numericValue} / {numericTarget}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold/70">
            {isArabic ? "حالة المصادر" : "Data sources"}
          </p>
          <h2 className="mt-2 text-xl font-light text-white">
            {isArabic ? "الاتصالات الخارجية" : "External connections"}
          </h2>
          <div className="mt-5 space-y-3 text-sm">
            {["Instagram / Facebook", "WhatsApp", "LinkedIn", "Email", "Slack", "Notion"].map((name) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
                <span className="text-white/60">{name}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/35">
                  {isArabic ? "غير متصل" : "Not connected"}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminPageContainer>
  );
}
