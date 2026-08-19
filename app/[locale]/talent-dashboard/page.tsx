import TalentSidebar from "@/components/talent/TalentSidebar";
import TalentHeader from "@/components/talent/TalentHeader";
import TalentProfileCard from "@/components/talent/TalentProfileCard";
import TalentApplications from "@/components/talent/TalentApplications";
import DashboardApplicationStats from "@/components/talent/dashboard/DashboardApplicationStats";
import DashboardQuickActions from "@/components/talent/dashboard/DashboardQuickActions";
import DashboardProfileReadiness from "@/components/talent/dashboard/DashboardProfileReadiness";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireTalent } from "@/lib/auth/require-talent";
import DashboardMessagesCard from "@/components/talent/dashboard/DashboardMessagesCard";
import { revalidatePath } from "next/cache";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import { submitTalentProfileReviewAction } from "@/lib/actions/submit-talent-profile-review";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
] as const;

function normalizeStatus(status?: string | null) {
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

function availabilityLabel(status?: string | null, isRtl = false) {
  if (status === "available_now") {
    return isRtl ? "متاح حالياً" : "Available now";
  }

  if (status === "available_this_week") {
    return isRtl
      ? "متاح هذا الأسبوع"
      : "Available this week";
  }

  if (status === "available_next_month") {
    return isRtl
      ? "متاح الشهر القادم"
      : "Available next month";
  }

  if (status === "available") {
    return isRtl ? "متاح" : "Available";
  }

  if (status === "busy") {
    return isRtl ? "مشغول" : "Busy";
  }

  if (status === "unavailable") {
    return isRtl ? "غير متاح" : "Unavailable";
  }

  return status ? status.replaceAll("_", " ") : "-";
}

export default async function TalentDashboardPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const adminClient = createAdminClient();

  const {
    user,
    profile,
    talent,
  } = await requireTalent(locale);
  
  if (!talent) {
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="min-h-screen bg-black text-white"
      >
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
  
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
            <span className="text-3xl">📋</span>
          </div>
  
          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "ملف الموهبة" : "Talent Profile"}
          </p>
  
          <h1 className="mt-5 text-4xl font-light">
            {isRtl
              ? "ملفك غير مكتمل"
              : "Your profile is incomplete"}
          </h1>
  
          <p className="mt-5 max-w-xl text-sm leading-8 text-white/60">
            {isRtl
              ? "تم إنشاء حسابك بنجاح. أكمل البيانات الأساسية لتتمكن من التقديم على الفرص."
              : "Your account has been created successfully. Complete the required information to start applying for opportunities."}
          </p>
  
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
  
            <a
  href={`/${locale}/talent-dashboard/profile`}
              className="rounded-2xl bg-gold px-8 py-4 text-black transition hover:opacity-90"
            >
              {isRtl
                ? "إكمال الملف"
                : "Complete Profile"}
            </a>
  
          </div>
  
        </div>
      </main>
    );
  }

  const {
    data: talentConversations,
    error: talentConversationsError,
  } = await adminClient
    .from("conversations")
    .select("id, application_id, updated_at, status")
    .eq("talent_id", talent.id)
    .order("updated_at", { ascending: false });

  if (talentConversationsError) {
    console.error("Talent dashboard conversations error:", {
      message: talentConversationsError.message,
      details: talentConversationsError.details,
      hint: talentConversationsError.hint,
      code: talentConversationsError.code,
    });
  }

  const conversations = talentConversations ?? [];
  const conversationIds = conversations.map(
    (conversation) => conversation.id
  );

  const {
    data: unreadMessages,
    error: unreadMessagesError,
  } =
    conversationIds.length > 0
      ? await adminClient
          .from("messages")
          .select("id, conversation_id")
          .in("conversation_id", conversationIds)
          .neq("sender_user_id", user.id)
          .is("read_at", null)
      : {
          data: [],
          error: null,
        };

  if (unreadMessagesError) {
    console.error("Talent dashboard unread messages error:", {
      message: unreadMessagesError.message,
      details: unreadMessagesError.details,
      hint: unreadMessagesError.hint,
      code: unreadMessagesError.code,
    });
  }

  const unreadMessagesCount = unreadMessages?.length ?? 0;
  const totalConversations = conversations.length;
  const conversationByApplicationId = new Map(
    conversations
      .filter((conversation) => conversation.application_id != null)
      .map((conversation) => [
        String(conversation.application_id),
        conversation.id,
      ]),
  );

  const {
    data: unreadNotifications,
    error: unreadNotificationsError,
  } = await adminClient
    .from("notifications")
    .select("id")
    .eq("recipient_type", "talent")
    .eq("recipient_id", String(talent.id))
    .eq("is_read", false);

  if (unreadNotificationsError) {
    console.error(
      "Talent dashboard notifications error:",
      unreadNotificationsError
    );
  }

  const unreadNotificationsCount =
    unreadNotifications?.length ?? 0;

    const {
      data: pendingProfileChangeRequest,
      error: pendingProfileChangeRequestError,
    } = await adminClient
      .from("talent_profile_change_requests")
      .select(`
        id,
        requested_name_ar,
        requested_name_en,
        requested_phone,
        requested_nationality_slug,
        created_at
      `)
      .eq("talent_id", talent.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  
    if (pendingProfileChangeRequestError) {
      console.error(
        "Talent dashboard pending profile change request error:",
        pendingProfileChangeRequestError,
      );
    }
  
    const hasPendingProfileChange =
      Boolean(pendingProfileChangeRequest);
      const {
        data: latestReviewDecision,
        error: latestReviewDecisionError,
      } = await adminClient
        .from("profile_review_history")
        .select(`
          id,
          decision,
          reason,
          created_at
        `)
        .eq("profile_id", profile.id)
        .eq("account_type", "talent")
        .eq("decision", "changes_requested")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();
      
      if (latestReviewDecisionError) {
        console.error(
          "Talent dashboard review decision error:",
          latestReviewDecisionError,
        );
      }
      
      const reviewChangeReason =
        String(
          latestReviewDecision?.reason ?? "",
        ).trim();
  const { data: applications, error: applicationsError } =
    await adminClient
      .from("opportunity_applications")
      .select(`
        id,
        status,
        created_at,
        opportunity_id,
        opportunities (
          id,
          title,
          city_ar,
          city_en,
          opportunity_type,
          status,
          created_at
        )
      `)
      .eq("talent_id", talent.id)
      .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error(
      "Talent dashboard applications error:",
      applicationsError
    );
  }

  const allApplications = applications ?? [];
  const totalApplications = allApplications.length;

  const counts = APPLICATION_STATUSES.reduce<Record<string, number>>(
    (accumulator, status) => {
      accumulator[status] = allApplications.filter(
        (application: { status: string | null }) =>
          normalizeStatus(application.status) === status
      ).length;

      return accumulator;
    },
    {}
  );

  const recentApplications = allApplications.slice(0, 5).map((application) => ({
    ...application,
    conversationId:
      conversationByApplicationId.get(String(application.id)) ?? null,
  }));

  const {
    data: savedOpportunities,
    error: savedOpportunitiesError,
  } = await adminClient
    .from("saved_opportunities")
    .select(`
      id,
      created_at,
      opportunity_id,
      opportunities (
        id,
        title,
        city_ar,
        city_en,
        opportunity_type,
        status,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  
  if (savedOpportunitiesError) {
    console.error(
      "Talent dashboard saved opportunities error:",
      savedOpportunitiesError
    );
  }
  
  const savedOpportunityItems = savedOpportunities ?? [];

  async function removeSavedOpportunity(formData: FormData) {
    "use server";
  
    const opportunityId = String(
      formData.get("opportunityId") ?? ""
    );
  
    if (!opportunityId) {
      return;
    }
  
    const {
      user: currentUser,
    } = await requireTalent(locale);
  
    const currentAdminClient = createAdminClient();
  
    const { error } = await currentAdminClient
      .from("saved_opportunities")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("opportunity_id", opportunityId);
  
    if (error) {
      console.error(
        "Talent dashboard remove saved opportunity error:",
        error
      );
    }
  
    revalidatePath(`/${locale}/talent-dashboard`);
  }

  const talentName =
    locale === "ar"
      ? talent.name_ar ?? talent.name_en ?? "موهبة"
      : talent.name_en ?? talent.name_ar ?? "Talent";

  const talentCity =
    locale === "ar"
      ? talent.city_ar ?? talent.city_en ?? "-"
      : talent.city_en ?? talent.city_ar ?? "-";

      const profileCompletion =
      calculateProfileCompletion(talent);
    
    const readinessTalent = {
      ...talent,
    
      name_ar:
        String(talent.name_ar ?? "").trim() ||
        String(
          pendingProfileChangeRequest?.requested_name_ar ?? "",
        ).trim(),
    
      name_en:
        String(talent.name_en ?? "").trim() ||
        String(
          pendingProfileChangeRequest?.requested_name_en ?? "",
        ).trim(),
    
        phone:
        String(profile.phone ?? "").trim() ||
        String(
          pendingProfileChangeRequest?.requested_phone ?? "",
        ).trim(),
    
      nationality_slug:
        String(talent.nationality_slug ?? "").trim() ||
        String(
          pendingProfileChangeRequest?.requested_nationality_slug ?? "",
        ).trim(),
    };
    
    const profileReadiness =
      getTalentProfileReadiness(readinessTalent);
    
    const isProfileReady =
      profileReadiness.isReady;

  const completionChecklist =
    profileReadiness.requirements.map(
      (requirement) => ({
        label: isRtl
          ? requirement.ar
          : requirement.en,
        done: requirement.completed,
      }),
    );

  const profileStatus = isProfileReady
    ? isRtl
      ? "جاهز"
      : "Ready"
    : isRtl
      ? "غير مكتمل"
      : "Incomplete";

  const availabilityStatus = availabilityLabel(
    talent.availability_status,
    isRtl
  );

  const reviewingCount = counts.reviewing ?? 0;
  const acceptedCount = counts.accepted ?? 0;
  const shortlistedCount = counts.shortlisted ?? 0;

  const incompleteItems = completionChecklist.filter(
    (item) => !item.done
  ).length;

  const notificationItems = [
    acceptedCount > 0
      ? isRtl
        ? `لديك ${acceptedCount} طلب مقبول.`
        : `You have ${acceptedCount} accepted application(s).`
      : null,

    shortlistedCount > 0
      ? isRtl
        ? `تمت إضافة ${shortlistedCount} طلب إلى القائمة المختصرة.`
        : `${shortlistedCount} application(s) were shortlisted.`
      : null,

    reviewingCount > 0
      ? isRtl
        ? `${reviewingCount} طلب قيد المراجعة حالياً.`
        : `${reviewingCount} application(s) are currently under review.`
      : null,

    unreadMessagesCount > 0
      ? isRtl
        ? `لديك ${unreadMessagesCount} رسالة غير مقروءة.`
        : `You have ${unreadMessagesCount} unread message(s).`
      : null,

    incompleteItems > 0
      ? isRtl
        ? `أكمل ${incompleteItems} قسم لتحسين ظهور ملفك.`
        : `Complete ${incompleteItems} section(s) to improve your profile.`
      : null,
  ].filter(Boolean) as string[];

  const approvalStatus =
  profile.approval_status ?? "not_submitted";

const workflowState:
  | "not_submitted"
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected" =
  approvalStatus === "approved"
    ? "approved"
    : approvalStatus === "pending" ||
        approvalStatus === "submitted"
      ? "pending"
      : approvalStatus === "changes_requested"
        ? "changes_requested"
        : approvalStatus === "rejected"
          ? "rejected"
          : "not_submitted";

const workflowContent = {
  not_submitted: {
    title: isRtl
      ? "ملفك جاهز للمراجعة"
      : "Your profile is ready for review",
    description: isRtl
      ? "يمكنك إرسال ملفك الآن إلى فريق ملامح لمراجعته واعتماده."
      : "You can now submit your profile to the MLAMH team for review and approval.",
    actionLabel: isRtl
      ? "إرسال الملف للمراجعة"
      : "Submit for review",
    actionHref: null,
    badge: isRtl
      ? "جاهز للإرسال"
      : "Ready to submit",
    badgeClass:
      "border-gold/25 bg-gold/10 text-gold",
    cardClass:
      "border-gold/15 bg-gold/[0.045]",
    actionType: "submit" as const,
  },
  pending: {
    title: isRtl
      ? "ملفك قيد المراجعة"
      : "Your profile is under review",
    description: isRtl
      ? "تم إرسال ملفك بنجاح إلى فريق ملامح. سنراجع البيانات قبل اعتماد الملف."
      : "Your profile has been submitted successfully. The MLAMH team will review it before approval.",
    actionLabel: null,
    actionHref: null,
    badge: isRtl
      ? "قيد المراجعة"
      : "Under review",
    badgeClass:
      "border-amber-400/25 bg-amber-400/10 text-amber-300",
    cardClass:
      "border-amber-400/15 bg-amber-400/[0.045]",
    actionType: "none" as const,
  },

  changes_requested: {
    title: isRtl
      ? "مطلوب تعديل الملف"
      : "Profile changes required",
    description: isRtl
      ? "راجع بيانات ملفك وأكمل التعديلات المطلوبة، ثم أعد إرساله للمراجعة."
      : "Review your profile, complete the requested changes, then submit it again for review.",
    actionLabel: isRtl
      ? "تعديل الملف"
      : "Edit profile",
    actionHref: `/${locale}/talent-dashboard/profile`,
    badge: isRtl
      ? "مطلوب تعديل"
      : "Changes required",
    badgeClass:
      "border-orange-400/25 bg-orange-400/10 text-orange-300",
    cardClass:
      "border-orange-400/15 bg-orange-400/[0.045]",
    actionType: "link" as const,
  },

  approved: {
    title: isRtl
      ? "ملفك معتمد وجاهز"
      : "Your profile is approved",
    description: isRtl
      ? "تم اعتماد ملفك، ويمكنك الآن تصفح الفرص والتقديم عليها."
      : "Your profile has been approved. You can now browse and apply to opportunities.",
    actionLabel: isRtl
      ? "استعراض الفرص"
      : "Browse opportunities",
    actionHref: `/${locale}/opportunities`,
    badge: isRtl
      ? "معتمد"
      : "Approved",
    badgeClass:
      "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    cardClass:
      "border-emerald-400/15 bg-emerald-400/[0.045]",
    actionType: "link" as const,
  },

  rejected: {
    title: isRtl
      ? "لم يتم اعتماد الملف"
      : "Profile not approved",
    description: isRtl
      ? "لم يتم اعتماد ملفك في المراجعة الحالية. راجع بيانات الملف قبل اتخاذ الخطوة التالية."
      : "Your profile was not approved in the current review. Review your profile before proceeding.",
    actionLabel: isRtl
      ? "مراجعة الملف"
      : "Review profile",
    actionHref: `/${locale}/talent-dashboard/profile`,
    badge: isRtl
      ? "غير معتمد"
      : "Not approved",
    badgeClass:
      "border-red-400/25 bg-red-400/10 text-red-300",
    cardClass:
      "border-red-400/15 bg-red-400/[0.045]",
    actionType: "link" as const,
  },
} as const;

const currentWorkflow =
  workflowContent[workflowState];

async function submitProfileForReview() {
  "use server";

  await submitTalentProfileReviewAction(
    locale,
  );

  revalidatePath(
    `/${locale}/talent-dashboard`,
  );
}
  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
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

<div className="min-w-0 flex-1 space-y-6">
<TalentHeader
  locale={locale}
  talentName={talentName}
/>

<section
  className={`rounded-[1.75rem] border p-5 sm:p-6 ${currentWorkflow.cardClass}`}
>
  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0">
      <span
        className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${currentWorkflow.badgeClass}`}
      >
        {currentWorkflow.badge}
      </span>

      <h2 className="mt-4 text-2xl font-light text-white sm:text-3xl">
        {currentWorkflow.title}
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
        {currentWorkflow.description}
      </p>
      {workflowState === "changes_requested" &&
reviewChangeReason ? (
  <div className="mt-4 rounded-2xl border border-orange-400/15 bg-black/20 px-4 py-4">
    <p className="text-[11px] text-orange-300/70">
      {isRtl
        ? "التعديلات المطلوبة"
        : "Requested changes"}
    </p>

    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/70">
      {reviewChangeReason}
    </p>
  </div>
) : null}
    </div>

    {currentWorkflow.actionType === "submit" ? (
      <form action={submitProfileForReview}>
        <button
          type="submit"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
        >
          {currentWorkflow.actionLabel}
        </button>
      </form>
    ) : currentWorkflow.actionType === "link" &&
      currentWorkflow.actionHref ? (
      <a
        href={currentWorkflow.actionHref}
        className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
      >
        {currentWorkflow.actionLabel}
      </a>
    ) : null}
  </div>
</section>

{hasPendingProfileChange ? (
  <section className="rounded-[1.75rem] border border-amber-400/20 bg-amber-400/[0.045] p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
          {isRtl ? "قيد المراجعة" : "Under review"}
        </span>

        <h2 className="mt-3 text-xl font-light text-white sm:text-2xl">
          {isRtl
            ? "لديك تعديل قيد المراجعة"
            : "You have a change under review"}
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
          {isRtl
            ? "ستبقى بياناتك الحالية معتمدة حتى تتم مراجعة التعديل. يمكنك استخدام المنصة والتقديم على الفرص بشكل طبيعي."
            : "Your current information remains active until the change is reviewed. You can continue using the platform and applying for opportunities normally."}
        </p>
      </div>

      <a
        href={`/${locale}/talent-dashboard/profile`}
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 px-5 text-sm text-amber-300 transition hover:bg-amber-400/10"
      >
        {isRtl ? "عرض التعديل" : "View change"}
      </a>
    </div>
  </section>
) : null}

<TalentProfileCard
  locale={locale}
  talent={talent}
  profileCompletion={profileCompletion}
  talentName={talentName}
  talentCity={talentCity}
  profileStatus={profileStatus}
  availabilityStatus={availabilityStatus}
/>

<TalentApplications
            locale={locale}
            isRtl={isRtl}
            recentApplications={recentApplications}
            notificationItems={notificationItems}
          />

<section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-gold/70">
          {isRtl ? "المفضلة" : "Saved"}
        </p>

        <h2 className="mt-2 text-xl font-light text-white sm:text-2xl">
          {isRtl ? "الفرص المحفوظة" : "Saved opportunities"}
        </h2>
      </div>

      <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs text-gold">
        {savedOpportunityItems.length}
      </span>
    </div>

    {savedOpportunityItems.length > 0 ? (
    <div className="grid gap-3 sm:grid-cols-2">
      {savedOpportunityItems.slice(0, 4).map((saved) => {
        const opportunity = Array.isArray(saved.opportunities)
          ? saved.opportunities[0]
          : saved.opportunities;

        if (!opportunity) {
          return null;
        }

        const city = isRtl
          ? opportunity.city_ar ?? opportunity.city_en ?? "-"
          : opportunity.city_en ?? opportunity.city_ar ?? "-";

        return (
          <div
  key={saved.id}
  className="group relative rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-gold/30 hover:bg-gold/[0.04]"
>
  <a
    href={`/${locale}/opportunities/${opportunity.id}`}
    className="absolute inset-0 z-0 rounded-2xl"
    aria-label={
      isRtl
        ? `عرض فرصة ${opportunity.title}`
        : `View ${opportunity.title}`
    }
  />

  <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4">
    <div className="min-w-0">
      <h3 className="truncate text-base text-white transition group-hover:text-gold">
        {opportunity.title}
      </h3>

      <p className="mt-2 text-xs text-white/45">
        {city}
      </p>
    </div>
  </div>

  <form
    action={removeSavedOpportunity}
    className="absolute left-4 top-4 z-20"
  >
    <input
  type="hidden"
  name="opportunityId"
  value={String(saved.opportunity_id)}
/>

    <button
      type="submit"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-lg text-gold transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
      title={
        isRtl
          ? "إزالة من المحفوظات"
          : "Remove from saved"
      }
      aria-label={
        isRtl
          ? "إزالة من المحفوظات"
          : "Remove from saved"
      }
    >
      ♥
    </button>
  </form>
</div>
        );
      })}
    </div>

) : (
  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center">
    <div className="text-2xl text-gold/60">♡</div>

    <p className="mt-3 text-sm text-white/55">
      {isRtl
        ? "لا توجد فرص محفوظة حتى الآن."
        : "You don't have any saved opportunities yet."}
    </p>

    <a
      href={`/${locale}/opportunities`}
      className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-gold/25 px-5 text-xs text-gold transition hover:bg-gold/10"
    >
      {isRtl ? "استعراض الفرص" : "Browse opportunities"}
    </a>
  </div>
)}
    {savedOpportunityItems.length > 4 ? (
      <div className="mt-5 border-t border-white/10 pt-4">
        <a
          href={`/${locale}/opportunities`}
          className="text-sm text-gold transition hover:text-gold/80"
        >
          {isRtl
            ? `لديك ${savedOpportunityItems.length} فرص محفوظة`
            : `You have ${savedOpportunityItems.length} saved opportunities`}
        </a>
      </div>
    ) : null}
  </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <DashboardApplicationStats
              locale={locale}
              isRtl={isRtl}
              totalApplications={totalApplications}
              counts={counts}
            />

<DashboardProfileReadiness
  locale={locale}
  isRtl={isRtl}
  incompleteItems={incompleteItems}
  profileCompletion={profileCompletion}
  completionChecklist={completionChecklist}
  isProfileReady={isProfileReady}
/>
          </section>

          

          <DashboardMessagesCard
  locale={locale}
  isRtl={isRtl}
  unreadMessagesCount={unreadMessagesCount}
  totalConversations={totalConversations}
/>

<DashboardQuickActions
  locale={locale}
  isRtl={isRtl}
  unreadMessagesCount={unreadMessagesCount}
  unreadNotificationsCount={unreadNotificationsCount}
  totalApplications={totalApplications}
  profileCompletion={profileCompletion}
/>
</div>
      </div>
    </div>
  </main>
  );
}