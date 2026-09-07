import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildTalentActivationFunnel, talentActivationSummary, type TalentActivationSnapshot } from "@/lib/marketing/growth/talent-activation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

const submittedStatuses = ["pending", "approved", "changes_requested", "rejected"];

function stepLabel(key: keyof TalentActivationSnapshot, isArabic: boolean) {
  const labels = {
    registrations: ["تسجيل", "Registration"],
    completed: ["ملف مكتمل", "Profile complete"],
    submitted: ["تم الإرسال", "Submitted"],
    approved: ["معتمد", "Approved"],
    applications: ["طلبات تقديم", "Applications"],
  } as const;
  return labels[key][isArabic ? 0 : 1];
}

export default async function TalentGrowthPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [registrations, complete, submitted, approved, applications, recentRegistrations, recentComplete, recentSubmitted, recentApproved, recentApplications, profileRecoveryReminders, incompleteRegistrationReminders] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent"),
    db.from("talents").select("id", { count: "exact", head: true }).gte("profile_completion", 100),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").in("approval_status", submittedStatuses),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").eq("approval_status", "approved"),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").gte("created_at", since),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").gte("created_at", since).not("profile_completed_at", "is", null),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").gte("created_at", since).in("approval_status", submittedStatuses),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").gte("created_at", since).eq("approval_status", "approved"),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }).gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "talent_profile_recovery_reminder_sent").gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "incomplete_registration_reminder_sent").gte("created_at", since),
  ]);

  const lifetime: TalentActivationSnapshot = {
    registrations: registrations.count ?? 0,
    completed: complete.count ?? 0,
    submitted: submitted.count ?? 0,
    approved: approved.count ?? 0,
    applications: applications.count ?? 0,
  };
  const recent: TalentActivationSnapshot = {
    registrations: recentRegistrations.count ?? 0,
    completed: recentComplete.count ?? 0,
    submitted: recentSubmitted.count ?? 0,
    approved: recentApproved.count ?? 0,
    applications: recentApplications.count ?? 0,
  };
  const lifetimeSummary = talentActivationSummary(lifetime);
  const recentSummary = talentActivationSummary(recent);
  const lifetimeFunnel = buildTalentActivationFunnel(lifetime);
  const recentFunnel = buildTalentActivationFunnel(recent);
  const bottleneck = recentSummary.biggestBottleneck;
  const recoverySignals = {
    incompleteRegistration: incompleteRegistrationReminders.count ?? 0,
    profileRecovery: profileRecoveryReminders.count ?? 0,
  };

  return <AdminPageContainer>
    <AdminPageHeader
      title={isArabic ? "نمو المواهب" : "Talent Growth"}
      description={isArabic ? "قياس عملي من التسجيل إلى اكتمال الملف والإرسال والاعتماد، مع Cohort آخر 7 أيام لتحديد أكبر نقطة تسرب قبل زيادة الإنفاق أو الحملات." : "Operational measurement from registration through profile completion, submission and approval, with a 7-day cohort to identify the biggest leak before increasing acquisition effort."}
    />

    <div className="mb-4 flex flex-wrap items-center gap-2">
      <AdminBadge variant="gold">{isArabic ? "Lifetime" : "Lifetime"}</AdminBadge>
      <span className="text-xs text-white/35">{isArabic ? "الطلبات تمثل نشاط التقديم، وليست خطوة Cohort حصرية لنفس المسجلين." : "Applications represent application activity, not an exclusive same-user cohort step."}</span>
    </div>
    <AdminGrid className="mb-6 md:grid-cols-3 xl:grid-cols-5">
      <AdminStatCard label={isArabic ? "التسجيلات" : "Registrations"} value={lifetime.registrations} />
      <AdminStatCard label={isArabic ? "اكتمال الملف" : "Completion rate"} value={`${lifetimeSummary.completionRate}%`} />
      <AdminStatCard label={isArabic ? "إرسال بعد الاكتمال" : "Complete → submitted"} value={`${lifetimeSummary.submissionRate}%`} />
      <AdminStatCard label={isArabic ? "اعتماد بعد الإرسال" : "Submitted → approved"} value={`${lifetimeSummary.approvalRate}%`} />
      <AdminStatCard label={isArabic ? "Activation إلى اعتماد" : "Approval activation"} value={`${lifetimeSummary.approvalActivation}%`} />
    </AdminGrid>

    <div className="mb-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg text-white">{isArabic ? "Cohort آخر 7 أيام" : "Last 7 days cohort"}</h2><p className="mt-1 text-xs text-white/35">{isArabic ? "التسجيلات الجديدة وما وصلت إليه من اكتمال وإرسال واعتماد حتى الآن." : "New registrations and how far they have progressed through completion, submission and approval so far."}</p></div><AdminBadge variant="muted">7D</AdminBadge></div>
        <div className="mt-5 space-y-3">{recentFunnel.map((step, index) => <div key={step.key} className="grid grid-cols-[1fr_auto_auto] gap-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"><span className="text-white/65">{stepLabel(step.key, isArabic)}</span><span className="tabular-nums text-white">{step.value}</span><span className="w-14 text-end text-gold/70">{index === 0 || step.conversionFromPrevious === null ? "—" : `${step.conversionFromPrevious}%`}</span></div>)}</div>
      </AdminCard>

      <AdminCard className="p-5">
        <div className="text-xs uppercase tracking-[.16em] text-gold/60">{isArabic ? "إشارة التفعيل" : "ACTIVATION SIGNAL"}</div>
        <h2 className="mt-3 text-lg text-white">{bottleneck ? (isArabic ? `أكبر تسرب حالي: ${stepLabel(bottleneck.key, true)}` : `Largest current leak: ${stepLabel(bottleneck.key, false)}`) : (isArabic ? "لا توجد بيانات كافية بعد" : "Not enough data yet")}</h2>
        <p className="mt-2 text-sm leading-6 text-white/45">{bottleneck?.dropoffFromPrevious !== null && bottleneck?.dropoffFromPrevious !== undefined ? (isArabic ? `التسرب التقريبي من الخطوة السابقة ${bottleneck.dropoffFromPrevious}%. هذا هو أول موضع نراجعه قبل محاولة جلب زيارات أكثر.` : `Approximate drop-off from the previous step is ${bottleneck.dropoffFromPrevious}%. Review this point before trying to buy or generate more traffic.`) : (isArabic ? "نحتاج حجمًا كافيًا من التسجيلات الجديدة حتى تصبح توصية التحسين قابلة للدفاع." : "We need enough new registrations before an optimization recommendation is defensible.")}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "اكتمال 7 أيام" : "7D completion"}</div><div className="mt-2 text-2xl font-semibold text-white">{recentSummary.completionRate}%</div></div>
          <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "Activation 7 أيام" : "7D approval activation"}</div><div className="mt-2 text-2xl font-semibold text-white">{recentSummary.approvalActivation}%</div></div>
        </div>
      </AdminCard>
    </div>

    <AdminCard className="mb-6 p-5">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg text-white">{isArabic ? "استعادة التفعيل" : "Activation recovery"}</h2><p className="mt-1 text-xs text-white/35">{isArabic ? "نستخدم مسارات الاستعادة الموجودة أصلًا بدل إنشاء Lifecycle موازٍ." : "Existing recovery paths are reused instead of creating a parallel lifecycle system."}</p></div><AdminBadge variant="muted">7D</AdminBadge></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "تذكيرات إكمال التسجيل" : "Incomplete-registration reminders"}</div><div className="mt-2 text-2xl font-semibold text-white">{recoverySignals.incompleteRegistration}</div></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "تذكيرات استعادة ملف الموهبة" : "Talent-profile recovery reminders"}</div><div className="mt-2 text-2xl font-semibold text-white">{recoverySignals.profileRecovery}</div></div></div>
    </AdminCard>

    <AdminCard className="p-5"><h2 className="text-lg text-white">{isArabic ? "المسار التراكمي" : "Lifetime conversion funnel"}</h2><div className="mt-5 space-y-3">{lifetimeFunnel.map((step, index) => <div key={step.key} className="grid grid-cols-[1fr_auto_auto] gap-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"><span className="text-white/65">{stepLabel(step.key, isArabic)}</span><span className="tabular-nums text-white">{step.value}</span><span className="w-14 text-end text-gold/70">{index === 0 || step.conversionFromPrevious === null ? "—" : `${step.conversionFromPrevious}%`}</span></div>)}</div></AdminCard>

    <AdminCard className="mt-6 border-amber-300/15 bg-amber-300/[0.025] p-5">
      <div className="text-sm font-medium text-amber-100">{isArabic ? "Role clarity monitoring" : "Role clarity monitoring"}</div>
      <p className="mt-2 text-sm leading-6 text-white/45">{isArabic ? "إصلاح منع اختيار Publisher بالخطأ أصبح جزءًا من المنتج، لكن هذه الصفحة لن تدّعي أن المشكلة اختفت. نحتاج Event مخصص لقياس اختيار الدور وتصحيحه حتى نتابع المعدل تاريخيًا؛ إلى أن تتوفر Telemetry موثوقة تبقى هذه النقطة فجوة قياس وليست رقمًا مخمنًا." : "The guard against accidental Publisher selection is part of the product, but this page will not claim the issue has disappeared. A dedicated role-selection/correction event is still needed for historical measurement; until reliable telemetry exists, this remains a measurement gap rather than a guessed metric."}</p>
    </AdminCard>
  </AdminPageContainer>;
}
