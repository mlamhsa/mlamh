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
import { TalentProfileService } from "@/lib/services/talent/TalentProfileService";

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

function profileStatusLabel(status?: string | null, isRtl = false) {
  if (status === "approved") {
    return isRtl ? "معتمد" : "Approved";
  }

  if (status === "pending") {
    return isRtl ? "بانتظار الاعتماد" : "Pending approval";
  }

  if (status === "rejected") {
    return isRtl ? "غير معتمد" : "Not approved";
  }

  if (status === "draft") {
    return isRtl ? "مسودة" : "Draft";
  }

  return status ? status.replaceAll("_", " ") : "-";
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

function hasAnsweredBoolean(value: unknown) {
  return value !== null && value !== undefined;
}

export default async function TalentDashboardPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const adminClient = createAdminClient();

  const { user, talent } = await requireTalent(locale);

  if (!talent) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "لوحة الموهبة" : "Talent Dashboard"}
          </p>

          <h1 className="mt-5 text-4xl font-light">
            {isRtl
              ? "لم يتم العثور على بروفايل موهبة"
              : "Talent profile not found"}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">
            {isRtl
              ? "لا يوجد سجل موهبة مرتبط بالحساب الحالي."
              : "No talent profile is linked to the current account."}
          </p>
        </div>
      </main>
    );
  }

  const {
    data: talentConversations,
    error: talentConversationsError,
  } = await adminClient
    .from("conversations")
    .select("id, updated_at, status")
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

  const recentApplications = allApplications.slice(0, 5);

  const talentName =
    locale === "ar"
      ? talent.name_ar ?? talent.name_en ?? "موهبة"
      : talent.name_en ?? talent.name_ar ?? "Talent";

  const talentCity =
    locale === "ar"
      ? talent.city_ar ?? talent.city_en ?? "-"
      : talent.city_en ?? talent.city_ar ?? "-";

  const profileCompletion =
    TalentProfileService.calculateCompletion(talent);

  const identityComplete = Boolean(
    (talent.name_ar || talent.name_en) &&
      talent.image_url &&
      talent.category_slug &&
      talent.gender &&
      talent.city_slug
  );

  const measurementsComplete = Boolean(
    talent.height_cm &&
      talent.weight_kg &&
      talent.eye_color &&
      talent.hair_color &&
      talent.hair_type &&
      talent.skin_color &&
      talent.clothing_size &&
      talent.shoe_size
  );

  const experienceComplete = Boolean(
    talent.experience_years !== null &&
      talent.experience_years !== undefined &&
      hasAnsweredBoolean(talent.ready_to_travel) &&
      hasAnsweredBoolean(talent.has_passport) &&
      hasAnsweredBoolean(talent.has_car) &&
      hasAnsweredBoolean(talent.work_outside_city) &&
      hasAnsweredBoolean(talent.work_outside_country)
  );

  const mediaComplete = Boolean(
    talent.video_intro &&
      talent.showreel_url &&
      talent.portfolio_url
  );

  const completionChecklist = [
    {
      label: isRtl
        ? "الهوية والمعلومات الأساسية"
        : "Identity and basic information",
      done: identityComplete,
    },
    {
      label: isRtl
        ? "المقاسات والمظهر"
        : "Measurements and appearance",
      done: measurementsComplete,
    },
    {
      label: isRtl
        ? "الخبرة والجاهزية للعمل"
        : "Experience and work readiness",
      done: experienceComplete,
    },
    {
      label: isRtl
        ? "الفيديو والأعمال السابقة"
        : "Media and portfolio",
      done: mediaComplete,
    },
  ];

  const profileStatus = profileStatusLabel(
    talent.status,
    isRtl
  );

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
    />
  </div>
</aside>

<div className="min-w-0 flex-1 space-y-6">
<TalentHeader
  locale={locale}
  talentName={talentName}
/>

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