import {
  AdminBadge,
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  buildPublisherActivationFunnel,
  publisherActivationSummary,
  type PublisherActivationSnapshot,
} from "@/lib/marketing/growth/publisher-activation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

const submittedStatuses = [
  "pending",
  "approved",
  "changes_requested",
  "rejected",
];

function stepLabel(
  key: "registrations" | "profiles" | "submitted" | "approved",
  isArabic: boolean,
) {
  const labels = {
    registrations: ["اختيار حساب ناشر", "Publisher registrations"],
    profiles: ["إنشاء ملف ناشر", "Publisher profile created"],
    submitted: ["إرسال للمراجعة", "Submitted for review"],
    approved: ["اعتماد الحساب", "Approved"],
  } as const;

  return labels[key][isArabic ? 0 : 1];
}

export default async function PublisherGrowthPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [profilesResult, publishersResult, opportunitiesResult] = await Promise.all([
    db
      .from("profiles")
      .select("id,approval_status,created_at")
      .eq("account_type", "publisher"),
    db
      .from("publishers")
      .select("id,profile_id,created_at"),
    db
      .from("opportunities")
      .select("publisher_id,created_at")
      .not("publisher_id", "is", null),
  ]);

  const profiles = profilesResult.data ?? [];
  const publishers = publishersResult.data ?? [];
  const opportunities = opportunitiesResult.data ?? [];

  const publisherByProfileId = new Map(
    publishers.map((publisher) => [Number(publisher.profile_id), publisher]),
  );
  const publishersWithOpportunity = new Set(
    opportunities
      .map((opportunity) => Number(opportunity.publisher_id))
      .filter((publisherId) => Number.isInteger(publisherId) && publisherId > 0),
  );

  const lifetime: PublisherActivationSnapshot = {
    registrations: profiles.length,
    profiles: profiles.filter((profile) => publisherByProfileId.has(Number(profile.id))).length,
    submitted: profiles.filter((profile) => submittedStatuses.includes(profile.approval_status ?? "")).length,
    approved: profiles.filter((profile) => profile.approval_status === "approved").length,
    opportunityPublishers: publishers.filter((publisher) => publishersWithOpportunity.has(Number(publisher.id))).length,
  };

  const recentProfiles = profiles.filter((profile) => profile.created_at && profile.created_at >= since);
  const recentPublisherIds = new Set(
    recentProfiles
      .map((profile) => publisherByProfileId.get(Number(profile.id))?.id)
      .filter((publisherId): publisherId is number => typeof publisherId === "number"),
  );
  const recentOpportunityPublishers = new Set(
    opportunities
      .filter((opportunity) => opportunity.created_at && opportunity.created_at >= since)
      .map((opportunity) => Number(opportunity.publisher_id))
      .filter((publisherId) => recentPublisherIds.has(publisherId)),
  );

  const recent: PublisherActivationSnapshot = {
    registrations: recentProfiles.length,
    profiles: recentProfiles.filter((profile) => publisherByProfileId.has(Number(profile.id))).length,
    submitted: recentProfiles.filter((profile) => submittedStatuses.includes(profile.approval_status ?? "")).length,
    approved: recentProfiles.filter((profile) => profile.approval_status === "approved").length,
    opportunityPublishers: recentOpportunityPublishers.size,
  };

  const lifetimeSummary = publisherActivationSummary(lifetime);
  const recentSummary = publisherActivationSummary(recent);
  const recentFunnel = buildPublisherActivationFunnel(recent);
  const bottleneck = recentSummary.biggestBottleneck;
  const loadError = profilesResult.error || publishersResult.error || opportunitiesResult.error;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "نمو الناشرين" : "Publisher Growth"}
        description={
          isArabic
            ? "قياس مسار الناشر من اختيار الحساب إلى إنشاء الملف والإرسال والاعتماد، ثم قياس من وصل فعليًا إلى إنشاء فرصة."
            : "Measure publisher progression from account selection through profile creation, submission and approval, then whether approved supply reaches real opportunity creation."
        }
      />

      {loadError ? (
        <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm text-amber-100/80">
          {isArabic
            ? "تعذر تحميل جزء من بيانات نمو الناشرين، لذلك لن تعرض الصفحة أرقامًا تقديرية بدل البيانات المسجلة."
            : "Some publisher growth data is unavailable, so this page will not substitute estimated metrics for recorded evidence."}
        </AdminCard>
      ) : null}

      <AdminGrid className="mb-6 md:grid-cols-3 xl:grid-cols-5">
        <AdminStatCard label={isArabic ? "حسابات ناشر" : "Publisher accounts"} value={lifetime.registrations} />
        <AdminStatCard label={isArabic ? "إنشاء الملف" : "Profile creation"} value={`${lifetimeSummary.profileRate}%`} />
        <AdminStatCard label={isArabic ? "ملف ← إرسال" : "Profile → submitted"} value={`${lifetimeSummary.submissionRate}%`} />
        <AdminStatCard label={isArabic ? "إرسال ← اعتماد" : "Submitted → approved"} value={`${lifetimeSummary.approvalRate}%`} />
        <AdminStatCard label={isArabic ? "اعتماد ← نشر فرصة" : "Approved → opportunity"} value={`${lifetimeSummary.opportunityActivation}%`} />
      </AdminGrid>

      <div className="mb-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <AdminCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg text-white">{isArabic ? "Cohort آخر 7 أيام" : "Last 7 days cohort"}</h2>
              <p className="mt-1 text-xs leading-5 text-white/35">
                {isArabic
                  ? "نقيس الحسابات التي بدأت خلال آخر 7 أيام وما وصلت إليه حتى الآن، بدل خلطها مع تاريخ المنصة كله."
                  : "Tracks accounts that started in the last 7 days and how far they have progressed so far instead of mixing them with lifetime history."}
              </p>
            </div>
            <AdminBadge variant="muted">7D</AdminBadge>
          </div>

          <div className="mt-5 space-y-3">
            {recentFunnel.map((step, index) => (
              <div
                key={step.key}
                className="grid grid-cols-[1fr_auto_auto] gap-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"
              >
                <span className="text-white/65">{stepLabel(step.key, isArabic)}</span>
                <span className="tabular-nums text-white">{step.value}</span>
                <span className="w-14 text-end text-gold/70">
                  {index === 0 || step.conversionFromPrevious === null
                    ? "—"
                    : `${step.conversionFromPrevious}%`}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <div className="text-xs uppercase tracking-[.16em] text-gold/60">
            {isArabic ? "إشارة الطلب" : "DEMAND ACTIVATION SIGNAL"}
          </div>
          <h2 className="mt-3 text-lg text-white">
            {bottleneck
              ? isArabic
                ? `أكبر تسرب حالي: ${stepLabel(bottleneck.key, true)}`
                : `Largest current leak: ${stepLabel(bottleneck.key, false)}`
              : isArabic
                ? "لا توجد بيانات كافية بعد"
                : "Not enough data yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            {bottleneck?.dropoffFromPrevious !== null && bottleneck?.dropoffFromPrevious !== undefined
              ? isArabic
                ? `التسرب التقريبي من الخطوة السابقة ${bottleneck.dropoffFromPrevious}%. نصلح هذه النقطة قبل زيادة Outreach أو جلب زيارات إضافية.`
                : `Approximate drop-off from the previous step is ${bottleneck.dropoffFromPrevious}%. Fix this point before scaling outreach or adding more traffic.`
              : isArabic
                ? "نحتاج عددًا كافيًا من حسابات الناشرين الجديدة قبل اعتماد توصية CRO."
                : "We need enough new publisher accounts before a CRO recommendation is defensible."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <div className="text-xs text-white/35">{isArabic ? "اعتماد 7 أيام" : "7D approval activation"}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{recentSummary.approvalActivation}%</div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <div className="text-xs text-white/35">{isArabic ? "ناشرون أنشؤوا فرصة" : "Publishers with opportunity"}</div>
              <div className="mt-2 text-2xl font-semibold text-gold">{recent.opportunityPublishers}</div>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard className="border-white/[0.08] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <AdminBadge variant="gold">{isArabic ? "CRO BASELINE" : "CRO BASELINE"}</AdminBadge>
          <span className="text-xs text-white/35">
            {isArabic
              ? "إنشاء فرصة نشاط لاحق للاعتماد وليس خطوة خطية داخل Funnel؛ لذلك يظهر كمؤشر Activation مستقل ولا نستخدمه لحساب Drop-off بين الخطوات."
              : "Opportunity creation is post-approval activity rather than a linear funnel step, so it is reported as an independent activation metric and excluded from step drop-off math."}
          </span>
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
