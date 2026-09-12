import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentHeader from "@/components/talent/TalentHeader";
import TalentProfileReviewSubmitButton from "@/components/talent/TalentProfileReviewSubmitButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTalent } from "@/lib/auth/require-talent";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type WorkflowState =
  | "not_submitted"
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected";

function normalizeApplicationStatus(status?: string | null) {
  if (
    status === "reviewing" ||
    status === "shortlisted" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    return status;
  }
  return "pending";
}

export default async function TalentDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const adminClient = createAdminClient();
  const { user, profile, talent } = await requireTalent(locale);

  if (!talent) {
    return (
      <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            {isRtl ? "ملف الموهبة" : "Talent profile"}
          </p>
          <h1 className="mt-4 text-3xl font-light sm:text-4xl">
            {isRtl ? "ابدأ بإكمال ملفك" : "Start by completing your profile"}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
            {isRtl
              ? "أكمل البيانات الأساسية والصورة الشخصية حتى يصبح ملفك جاهزًا للمراجعة."
              : "Complete your core details and profile photo to get your profile ready for review."}
          </p>
          <a
            href={`/${locale}/talent-dashboard/profile`}
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gold px-7 text-sm font-semibold text-black"
          >
            {isRtl ? "إكمال الملف" : "Complete profile"}
          </a>
        </div>
      </main>
    );
  }

  const [applicationsResult, savedResult, conversationsResult, notificationsResult] = await Promise.all([
    adminClient
      .from("opportunity_applications")
      .select("id, status, created_at")
      .eq("talent_id", talent.id)
      .order("created_at", { ascending: false }),
    adminClient
      .from("saved_opportunities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    adminClient
      .from("conversations")
      .select("id")
      .eq("talent_id", talent.id),
    adminClient
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_type", "talent")
      .eq("recipient_id", String(talent.id))
      .eq("is_read", false),
  ]);

  const applications = applicationsResult.data ?? [];
  const totalApplications = applications.length;
  const savedCount = savedResult.count ?? 0;
  const unreadNotificationsCount = notificationsResult.count ?? 0;
  const conversationIds = (conversationsResult.data ?? []).map((item) => item.id);

  let unreadMessagesCount = 0;
  if (conversationIds.length > 0) {
    const unreadMessagesResult = await adminClient
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_user_id", user.id)
      .is("read_at", null);
    unreadMessagesCount = unreadMessagesResult.count ?? 0;
  }

  const counts = applications.reduce(
    (acc, application) => {
      const status = normalizeApplicationStatus(application.status);
      acc[status] += 1;
      return acc;
    },
    { pending: 0, reviewing: 0, shortlisted: 0, accepted: 0, rejected: 0 } as Record<string, number>,
  );

  const profileCompletion = calculateProfileCompletion(talent);
  const readinessTalent = {
    ...talent,
    phone: String(profile.phone ?? "").trim(),
    data_accuracy_contact_consent: profile.data_accuracy_contact_consent === true,
  };
  const profileReadiness = getTalentProfileReadiness(readinessTalent);
  const missingRequirements = profileReadiness.requirements.filter((requirement) => !requirement.completed);
  const incompleteItems = missingRequirements.length;
  const readinessPercent = Math.round(
    ((profileReadiness.requirements.length - incompleteItems) / Math.max(profileReadiness.requirements.length, 1)) * 100,
  );

  const rawApprovalStatus = profile.approval_status ?? "not_submitted";
  const workflowState: WorkflowState =
    rawApprovalStatus === "approved"
      ? "approved"
      : rawApprovalStatus === "pending" || rawApprovalStatus === "submitted"
        ? "pending"
        : rawApprovalStatus === "changes_requested"
          ? "changes_requested"
          : rawApprovalStatus === "rejected"
            ? "rejected"
            : "not_submitted";

  const talentName =
    locale === "ar"
      ? talent.name_ar ?? talent.name_en ?? "موهبة"
      : talent.name_en ?? talent.name_ar ?? "Talent";

  const workflow = {
    not_submitted: profileReadiness.isReady
      ? {
          eyebrow: isRtl ? "جاهز للمراجعة" : "Ready for review",
          title: isRtl ? "ملفك جاهز للإرسال" : "Your profile is ready to submit",
          description: isRtl
            ? "اكتملت المتطلبات الأساسية. أرسل ملفك الآن ليتم مراجعته واعتماده."
            : "Your required details are complete. Submit your profile now for review and approval.",
          action: isRtl ? "إرسال للمراجعة" : "Submit for review",
          href: null,
          submit: true,
          tone: "border-emerald-400/20 bg-emerald-400/[0.045]",
          badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
        }
      : {
          eyebrow: isRtl ? "خطوتك التالية" : "Your next step",
          title: isRtl
            ? incompleteItems === 1
              ? "باقي خطوة واحدة لإرسال ملفك"
              : `باقي ${incompleteItems} خطوات لإرسال ملفك`
            : incompleteItems === 1
              ? "One step left to submit your profile"
              : `${incompleteItems} steps left to submit your profile`,
          description: isRtl
            ? "أكمل فقط المتطلبات الأساسية المتبقية. البيانات المهنية الإضافية اختيارية."
            : "Complete only the remaining required items. Extra professional details are optional.",
          action: isRtl ? "إكمال الملف" : "Complete profile",
          href: `/${locale}/talent-dashboard/profile`,
          submit: false,
          tone: "border-gold/20 bg-gold/[0.045]",
          badge: "border-gold/25 bg-gold/10 text-gold",
        },
    pending: {
      eyebrow: isRtl ? "قيد المراجعة" : "Under review",
      title: isRtl ? "ملفك لدى فريق ملامح" : "Your profile is being reviewed",
      description: isRtl
        ? "لا تحتاج لاتخاذ أي إجراء الآن. يمكنك استعراض الفرص وحفظ المناسب لك."
        : "No action is needed right now. You can browse and save opportunities while you wait.",
      action: isRtl ? "استعراض الفرص" : "Browse opportunities",
      href: `/${locale}/opportunities`,
      submit: false,
      tone: "border-amber-400/20 bg-amber-400/[0.045]",
      badge: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    },
    changes_requested: {
      eyebrow: isRtl ? "مطلوب تعديل" : "Changes required",
      title: isRtl ? "راجع التعديلات المطلوبة" : "Review the requested changes",
      description: isRtl
        ? "عدّل المطلوب فقط ثم أعد إرسال الملف للمراجعة."
        : "Update only what was requested, then submit your profile again.",
      action: isRtl ? "تعديل الملف" : "Edit profile",
      href: `/${locale}/talent-dashboard/profile`,
      submit: false,
      tone: "border-orange-400/20 bg-orange-400/[0.045]",
      badge: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    },
    approved: {
      eyebrow: isRtl ? "ملف معتمد" : "Approved profile",
      title: isRtl ? "أنت جاهز للفرص" : "You're ready for opportunities",
      description: isRtl
        ? "ملفك معتمد. اكتشف الفرص المناسبة وابدأ التقديم مباشرة."
        : "Your profile is approved. Discover relevant opportunities and start applying.",
      action: isRtl ? "استعراض الفرص" : "Browse opportunities",
      href: `/${locale}/opportunities`,
      submit: false,
      tone: "border-emerald-400/20 bg-emerald-400/[0.045]",
      badge: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    },
    rejected: {
      eyebrow: isRtl ? "تحتاج مراجعة" : "Needs review",
      title: isRtl ? "راجع ملفك قبل المحاولة التالية" : "Review your profile before trying again",
      description: isRtl
        ? "راجع بياناتك وصورتك المهنية قبل إعادة إرسال الملف."
        : "Review your details and profile photo before submitting again.",
      action: isRtl ? "مراجعة الملف" : "Review profile",
      href: `/${locale}/talent-dashboard/profile`,
      submit: false,
      tone: "border-red-400/20 bg-red-400/[0.045]",
      badge: "border-red-400/25 bg-red-400/10 text-red-300",
    },
  }[workflowState];

  const primaryMetric =
    workflowState === "approved"
      ? {
          label: isRtl ? "قوة الملف" : "Profile strength",
          value: `${profileCompletion}%`,
          meta: isRtl ? "حسّن المطابقة" : "Improve matching",
          href: `/${locale}/talent-dashboard/profile/details`,
          emphasis: true,
        }
      : workflowState === "pending"
        ? {
            label: isRtl ? "حالة الملف" : "Profile status",
            value: isRtl ? "قيد المراجعة" : "In review",
            meta: isRtl ? "لا يلزم إجراء" : "No action needed",
            href: `/${locale}/talent-dashboard/profile`,
            emphasis: true,
          }
        : {
            label: isRtl ? "جاهزية الاعتماد" : "Approval readiness",
            value: `${readinessPercent}%`,
            meta: profileReadiness.isReady
              ? isRtl ? "مكتمل" : "Complete"
              : isRtl ? `${incompleteItems} متبقي` : `${incompleteItems} remaining`,
            href: `/${locale}/talent-dashboard/profile`,
            emphasis: true,
          };

  const metricCards = [
    primaryMetric,
    {
      label: isRtl ? "طلباتي" : "Applications",
      value: String(totalApplications),
      meta: counts.accepted > 0
        ? isRtl ? `${counts.accepted} مقبول` : `${counts.accepted} accepted`
        : isRtl ? "جميع الطلبات" : "All applications",
      href: `/${locale}/talent-dashboard/applications`,
      emphasis: false,
    },
    {
      label: isRtl ? "الرسائل" : "Messages",
      value: String(unreadMessagesCount),
      meta: unreadMessagesCount > 0
        ? isRtl ? "غير مقروءة" : "Unread"
        : isRtl ? "لا جديد" : "All caught up",
      href: `/${locale}/talent-dashboard/messages`,
      emphasis: unreadMessagesCount > 0,
    },
  ];

  const quickActions =
    workflowState === "approved"
      ? [
          {
            eyebrow: isRtl ? "ابدأ الآن" : "Start now",
            title: isRtl ? "اكتشف الفرص" : "Discover opportunities",
            description: isRtl ? "تصفح الفرص المناسبة وابدأ التقديم مباشرة." : "Browse relevant opportunities and start applying.",
            href: `/${locale}/opportunities`,
            primary: true,
          },
          {
            eyebrow: isRtl ? "تابع" : "Track",
            title: isRtl ? "طلباتك" : "Your applications",
            description: isRtl ? "راجع حالة طلباتك وما وصل إلى القائمة المختصرة." : "Review your applications and shortlist progress.",
            href: `/${locale}/talent-dashboard/applications`,
            primary: false,
          },
          {
            eyebrow: unreadMessagesCount > 0 ? (isRtl ? "يحتاج انتباهك" : "Needs attention") : (isRtl ? "طوّر" : "Improve"),
            title: unreadMessagesCount > 0 ? (isRtl ? "لديك رسائل جديدة" : "You have new messages") : (isRtl ? "قوة الملف" : "Profile strength"),
            description: unreadMessagesCount > 0
              ? (isRtl ? `${unreadMessagesCount} رسالة غير مقروءة بانتظارك.` : `${unreadMessagesCount} unread messages are waiting for you.`)
              : (isRtl ? `قوة ملفك الحالية ${profileCompletion}٪. حسّن بياناتك المهنية لرفع جودة المطابقة.` : `Your profile strength is ${profileCompletion}%. Improve professional details for better matching.`),
            href: unreadMessagesCount > 0 ? `/${locale}/talent-dashboard/messages` : `/${locale}/talent-dashboard/profile/details`,
            primary: unreadMessagesCount > 0,
          },
        ]
      : workflowState === "pending"
        ? [
            {
              eyebrow: isRtl ? "أثناء المراجعة" : "While you wait",
              title: isRtl ? "استكشف الفرص" : "Explore opportunities",
              description: isRtl ? "يمكنك تصفح الفرص وحفظ المناسب لك حتى اكتمال المراجعة." : "Browse and save relevant opportunities while your profile is reviewed.",
              href: `/${locale}/opportunities`,
              primary: true,
            },
            {
              eyebrow: isRtl ? "جهّز ملفك" : "Get ready",
              title: isRtl ? "معرض الأعمال" : "Portfolio",
              description: isRtl ? "أضف أفضل صورك وأعمالك حتى يكون ملفك أقوى بعد الاعتماد." : "Add your strongest work so your profile is ready after approval.",
              href: `/${locale}/talent-dashboard/gallery`,
              primary: false,
            },
            {
              eyebrow: isRtl ? "الحالة" : "Status",
              title: isRtl ? "متابعة الملف" : "Profile review",
              description: isRtl ? "لا يلزم أي إجراء حاليًا. يمكنك مراجعة حالة الملف في أي وقت." : "No action is required. You can review your profile status at any time.",
              href: `/${locale}/talent-dashboard/profile`,
              primary: false,
            },
          ]
        : [
            {
              eyebrow: isRtl ? "الأولوية" : "Priority",
              title: isRtl ? "أكمل ملفك" : "Complete your profile",
              description: isRtl ? "ابدأ بالمتطلبات الأساسية المتبقية حتى يصبح الملف جاهزًا للمراجعة." : "Finish the remaining required details so your profile can be submitted for review.",
              href: `/${locale}/talent-dashboard/profile`,
              primary: true,
            },
            {
              eyebrow: isRtl ? "بعدها" : "Then",
              title: isRtl ? "جهّز معرض الأعمال" : "Build your portfolio",
              description: isRtl ? "أضف أفضل الصور والأعمال التي تعرّف الناشرين عليك بسرعة." : "Add your strongest photos and work so publishers can evaluate you quickly.",
              href: `/${locale}/talent-dashboard/gallery`,
              primary: false,
            },
            {
              eyebrow: isRtl ? "استكشف" : "Explore",
              title: isRtl ? "تعرّف على الفرص" : "Browse opportunities",
              description: isRtl ? "شاهد نوع الفرص الموجودة وما الذي يبحث عنه الناشرون." : "See available opportunities and what publishers are looking for.",
              href: `/${locale}/opportunities`,
              primary: false,
            },
          ];

  const activeApplications = counts.reviewing + counts.pending;
  const applicationSummary =
    counts.accepted > 0
      ? isRtl
        ? `لديك ${counts.accepted} طلب مقبول. افتح طلباتك لمراجعة الخطوة التالية.`
        : `You have ${counts.accepted} accepted application${counts.accepted === 1 ? "" : "s"}. Open your applications for the next step.`
      : counts.shortlisted > 0
        ? isRtl
          ? `لديك ${counts.shortlisted} طلب في القائمة المختصرة.`
          : `${counts.shortlisted} application${counts.shortlisted === 1 ? " is" : "s are"} shortlisted.`
        : activeApplications > 0
          ? isRtl
            ? `${activeApplications} من طلباتك ما زالت قيد المراجعة.`
            : `${activeApplications} application${activeApplications === 1 ? " is" : "s are"} still in review.`
          : isRtl
            ? "راجع نتائج طلباتك السابقة من صفحة طلباتي."
            : "Review your previous application results from Applications.";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:py-10">
        <div className="flex flex-col gap-6 xl:flex-row">
          <aside className="hidden xl:block xl:w-80 xl:flex-shrink-0">
            <div className="sticky top-28">
              <TalentSidebar
                locale={locale}
                totalApplications={totalApplications}
                notificationCount={unreadNotificationsCount}
                unreadMessagesCount={unreadMessagesCount}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-5">
            <TalentHeader locale={locale} talentName={talentName} />

            <section className={`overflow-hidden rounded-[2rem] border ${workflow.tone}`}>
              <div className="p-6 sm:p-8 lg:p-9">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 max-w-3xl">
                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${workflow.badge}`}>
                      {workflow.eyebrow}
                    </span>
                    <h1 className="mt-5 text-3xl font-light leading-tight sm:text-4xl">
                      {workflow.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                      {workflow.description}
                    </p>
                  </div>

                  {workflow.submit ? (
                    <TalentProfileReviewSubmitButton
                      locale={locale}
                      label={workflow.action}
                      wrapperClassName="w-full sm:w-auto"
                      buttonClassName="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gold px-7 text-sm font-semibold text-black transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    />
                  ) : workflow.href ? (
                    <a
                      href={workflow.href}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gold px-7 text-sm font-semibold text-black transition hover:opacity-90 sm:w-auto"
                    >
                      {workflow.action}
                    </a>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              {metricCards.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-[1.5rem] border p-4 transition sm:p-5 ${item.emphasis ? "border-gold/20 bg-gold/[0.035] hover:bg-gold/[0.055]" : "border-white/10 bg-white/[0.025] hover:border-gold/25 hover:bg-gold/[0.035]"}`}
                >
                  <p className="text-xs text-white/45">{item.label}</p>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <strong className="text-2xl font-light text-white sm:text-3xl">{item.value}</strong>
                    <span className="text-[11px] text-white/35">{item.meta}</span>
                  </div>
                </a>
              ))}
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-gold/70">{isRtl ? "ماذا تفعل الآن؟" : "What to do next"}</p>
                  <h2 className="mt-1 text-xl font-light">{isRtl ? "خطواتك التالية" : "Your next actions"}</h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickActions.map((item) => (
                  <a
                    key={`${item.eyebrow}-${item.title}`}
                    href={item.href}
                    className={`rounded-[1.5rem] border p-5 transition ${item.primary ? "border-gold/25 bg-gold/[0.055] hover:bg-gold/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-gold/25"}`}
                  >
                    <p className="text-xs text-gold/70">{item.eyebrow}</p>
                    <h3 className="mt-2 text-lg font-light">{item.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-white/40">{item.description}</p>
                  </a>
                ))}
              </div>
            </section>

            {totalApplications > 0 ? (
              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-gold/70">{isRtl ? "طلباتك" : "Your applications"}</p>
                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[11px] text-white/55">
                        {isRtl ? `${totalApplications} طلب` : `${totalApplications} total`}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-light">{isRtl ? "أين وصلت طلباتك؟" : "Where your applications stand"}</h2>
                    <p className="mt-2 max-w-2xl text-xs leading-6 text-white/45 sm:text-sm">{applicationSummary}</p>
                  </div>
                  <a
                    href={`/${locale}/talent-dashboard/applications`}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.045] px-4 text-xs font-medium text-gold transition hover:bg-gold/[0.08]"
                  >
                    {isRtl ? "عرض التفاصيل" : "View details"}
                  </a>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  <div className={`rounded-2xl border p-3 text-center sm:p-4 ${activeApplications > 0 ? "border-amber-400/20 bg-amber-400/[0.035]" : "border-white/8 bg-black/20"}`}>
                    <strong className="text-2xl font-light">{activeApplications}</strong>
                    <p className="mt-1 text-[11px] text-white/40">{isRtl ? "قيد المراجعة" : "In review"}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 text-center sm:p-4 ${counts.shortlisted > 0 ? "border-gold/20 bg-gold/[0.035]" : "border-white/8 bg-black/20"}`}>
                    <strong className={counts.shortlisted > 0 ? "text-2xl font-light text-gold" : "text-2xl font-light"}>{counts.shortlisted}</strong>
                    <p className="mt-1 text-[11px] text-white/40">{isRtl ? "قائمة مختصرة" : "Shortlisted"}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 text-center sm:p-4 ${counts.accepted > 0 ? "border-emerald-400/20 bg-emerald-400/[0.04]" : "border-white/8 bg-black/20"}`}>
                    <strong className={counts.accepted > 0 ? "text-2xl font-light text-emerald-300" : "text-2xl font-light"}>{counts.accepted}</strong>
                    <p className="mt-1 text-[11px] text-white/40">{isRtl ? "مقبول" : "Accepted"}</p>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
