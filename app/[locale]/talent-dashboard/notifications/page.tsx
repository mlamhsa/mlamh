import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ApplicationNotification = {
  id: number | string;
  status: string | null;
  created_at: string | null;
  opportunities:
    | {
        title: string | null;
        opportunity_type: string | null;
      }
    | {
        title: string | null;
        opportunity_type: string | null;
      }[]
    | null;
};

type DisplayNotification = {
  id: string;
  message: string;
  read: boolean;
  created_at: string | null;
  reference_id: number | string | null;
  category: "application" | "system";
  status: string | null;
};

function NotificationIcon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "bell"
    | "all"
    | "unread"
    | "application"
    | "check"
    | "close"
    | "clock"
    | "arrow";
  className?: string;
}) {
  if (name === "bell") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M6.5 10a5.5 5.5 0 0 1 11 0v3.3l1.5 2.2H5l1.5-2.2V10Z"
          strokeLinejoin="round"
        />
        <path d="M10 18.5a2.2 2.2 0 0 0 4 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "all") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <path d="M8 7h11M8 12h11M8 17h11" strokeLinecap="round" />
        <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "unread") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <rect x="4" y="5.5" width="16" height="13" rx="2.5" />
        <path d="m5.5 7 6.5 5 6.5-5" strokeLinejoin="round" />
        <circle cx="18.5" cy="5.5" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name === "application") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <rect x="5" y="6" width="14" height="14" rx="2" />
        <path d="M9 6V4h6v2M8.5 11h7M8.5 15h5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.2 12 2.5 2.5 5.3-5.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatNotificationDate(value: string | null, locale: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getApplicationMessage(
  application: ApplicationNotification,
  isArabic: boolean
) {
  const opportunity = Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;

  const title =
    opportunity?.title || (isArabic ? "فرصة بدون عنوان" : "Untitled Opportunity");

  if (application.status === "accepted") {
    return isArabic
      ? `تم قبول طلبك في فرصة "${title}".`
      : `Your application for "${title}" was accepted.`;
  }

  if (application.status === "shortlisted") {
    return isArabic
      ? `تمت إضافة طلبك إلى القائمة المختصرة في فرصة "${title}".`
      : `Your application for "${title}" was shortlisted.`;
  }

  if (application.status === "rejected") {
    return isArabic
      ? `تم رفض طلبك في فرصة "${title}".`
      : `Your application for "${title}" was rejected.`;
  }

  if (application.status === "reviewing") {
    return isArabic
      ? `أصبح طلبك على فرصة "${title}" قيد المراجعة.`
      : `Your application for "${title}" is now under review.`;
  }

  return isArabic
    ? `تم استلام طلبك على فرصة "${title}".`
    : `Your application for "${title}" was received.`;
}

function getStatusIcon(status: string | null) {
  if (status === "accepted" || status === "shortlisted") return "check";
  if (status === "rejected") return "close";
  return "clock";
}

function getStatusClasses(status: string | null) {
  if (status === "accepted") {
    return {
      icon: "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200",
      badge: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200",
    };
  }

  if (status === "shortlisted") {
    return {
      icon: "border-violet-300/25 bg-violet-300/[0.08] text-violet-200",
      badge: "border-violet-300/20 bg-violet-300/[0.06] text-violet-200",
    };
  }

  if (status === "rejected") {
    return {
      icon: "border-red-300/25 bg-red-300/[0.08] text-red-200",
      badge: "border-red-300/20 bg-red-300/[0.06] text-red-200",
    };
  }

  if (status === "reviewing") {
    return {
      icon: "border-sky-300/25 bg-sky-300/[0.08] text-sky-200",
      badge: "border-sky-300/20 bg-sky-300/[0.06] text-sky-200",
    };
  }

  return {
    icon: "border-gold/25 bg-gold/[0.08] text-gold",
    badge: "border-gold/20 bg-gold/[0.06] text-gold",
  };
}

function getStatusLabel(status: string | null, isArabic: boolean) {
  if (status === "accepted") return isArabic ? "مقبول" : "Accepted";
  if (status === "shortlisted") return isArabic ? "القائمة المختصرة" : "Shortlisted";
  if (status === "rejected") return isArabic ? "مرفوض" : "Rejected";
  if (status === "reviewing") return isArabic ? "قيد المراجعة" : "Reviewing";
  return isArabic ? "تحديث" : "Update";
}

export default async function TalentNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/talent-login`);
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(
      `[TalentNotificationsPage talent] ${talentError.message}`
    );
  }

  /*
   * جدول notifications الحالي لا يحتوي user_id أو message في هذه النسخة
   * من قاعدة البيانات، لذلك نعتمد مؤقتًا على تحديثات طلبات الفرص نفسها
   * كمصدر موثوق للإشعارات إلى أن يتم توحيد مخطط جدول notifications.
   */
  const unreadCount = 0;

  const { data: applications, error: applicationsError } = talent
    ? await adminClient
        .from("opportunity_applications")
        .select(
          `
          id,
          status,
          created_at,
          opportunities (
            title,
            opportunity_type
          )
        `
        )
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
        .limit(15)
    : { data: [], error: null };

  if (applicationsError) {
    throw new Error(
      `[TalentNotificationsPage applications] ${applicationsError.message}`
    );
  }

  const notifications: DisplayNotification[] = (
    (applications ?? []) as ApplicationNotification[]
  ).map((application) => ({
    id: `application-${application.id}`,
    message: getApplicationMessage(application, isArabic),
    read: true,
    created_at: application.created_at,
    reference_id: application.id,
    category: "application",
    status: application.status,
  }));

  const applicationCount = notifications.filter(
    (notification) => notification.category === "application"
  ).length;


  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/${locale}/talent-dashboard`}
                className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
              >
                <span className={isArabic ? "rotate-180" : ""}>
                  <NotificationIcon name="arrow" className="h-4 w-4" />
                </span>
                {isArabic ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
              </Link>

              <p className="mt-8 text-[10px] uppercase tracking-[0.36em] text-gold">
                {isArabic ? "لوحة الموهبة" : "Talent Workspace"}
              </p>

              <h1 className="mt-3 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
                {isArabic ? "الإشعارات" : "Notifications"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
                {isArabic
                  ? "تابع آخر تحديثات طلباتك وحسابك، واعرف كل ما يحتاج إلى انتباهك من مكان واحد."
                  : "Track the latest updates to your applications and account from one place."}
              </p>
            </div>

            <Link
              href={`/${locale}/talent-dashboard/requests`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3.5 text-sm text-black transition hover:bg-gold-soft sm:w-auto"
            >
              <NotificationIcon name="application" className="h-4 w-4" />
              {isArabic ? "عرض طلباتي" : "View Applications"}
            </Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label={isArabic ? "كل الإشعارات" : "All Notifications"}
            value={notifications.length}
            icon="all"
            highlighted
          />

          <StatCard
            label={isArabic ? "غير المقروءة" : "Unread"}
            value={unreadCount}
            icon="unread"
          />

          <StatCard
            label={isArabic ? "تحديثات الطلبات" : "Application Updates"}
            value={applicationCount}
            icon="application"
            className="col-span-2 sm:col-span-1"
          />
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isArabic ? "مركز الإشعارات" : "Notification Center"}
              </p>

              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isArabic ? "آخر التحديثات" : "Latest Updates"}
              </h2>
            </div>

            <p className="text-xs text-white/35">
              {isArabic
                ? `${notifications.length} إشعار`
                : `${notifications.length} notification${
                    notifications.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 px-5 py-12 text-center sm:px-8 sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                <NotificationIcon name="bell" className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-2xl font-light">
                {isArabic ? "لا توجد إشعارات حاليًا" : "No notifications yet"}
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                {isArabic
                  ? "عند تحديث حالة طلباتك أو إضافة تنبيه جديد إلى حسابك، سيظهر هنا."
                  : "Updates to your applications and new account alerts will appear here."}
              </p>

              <Link
                href={`/${locale}/opportunities`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3 text-sm text-black transition hover:bg-gold-soft"
              >
                {isArabic ? "استعراض الفرص" : "Browse Opportunities"}
                <NotificationIcon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const classes = getStatusClasses(notification.status);
                const iconName = getStatusIcon(notification.status);

                return (
                  <article
                    key={notification.id}
                    className={`group rounded-[1.5rem] border p-4 transition hover:border-gold/25 sm:p-5 ${
                      notification.read
                        ? "border-white/10 bg-black/25"
                        : "border-gold/25 bg-gold/[0.045]"
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${classes.icon}`}
                        >
                          <NotificationIcon
                            name={iconName}
                            className="h-5 w-5"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${classes.badge}`}
                            >
                              {getStatusLabel(
                                notification.status,
                                isArabic
                              )}
                            </span>

                            {!notification.read ? (
                              <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-gold">
                                {isArabic ? "جديد" : "New"}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-3 text-base font-light leading-7 text-white sm:text-lg">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-xs text-white/35">
                            {formatNotificationDate(
                              notification.created_at,
                              locale
                            )}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/${locale}/talent-dashboard/requests`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        {isArabic ? "عرض الطلبات" : "View Applications"}
                        <NotificationIcon name="arrow" className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlighted = false,
  className = "",
}: {
  label: string;
  value: number;
  icon: "all" | "unread" | "application";
  highlighted?: boolean;
  className?: string;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:border-gold/25 sm:p-5 ${
        highlighted
          ? "border-gold/25 bg-gold/[0.06]"
          : "border-white/10 bg-white/[0.025]"
      } ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
        <NotificationIcon name={icon} />
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-2 text-3xl font-light sm:text-4xl">{value}</p>
    </article>
  );
}
