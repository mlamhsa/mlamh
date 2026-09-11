import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MessageCircle,
  XCircle,
} from "lucide-react";

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
    | { title: string | null; opportunity_type: string | null }
    | { title: string | null; opportunity_type: string | null }[]
    | null;
};

type NotificationEvent = {
  event_type: string | null;
  metadata: Record<string, unknown> | null;
};

type DatabaseNotification = {
  id: number | string;
  title: string | null;
  body: string | null;
  is_read: boolean | null;
  created_at: string | null;
  events: NotificationEvent | NotificationEvent[] | null;
};

type Category = "application" | "message" | "invitation" | "booking" | "system";

type DisplayNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | null;
  href: string;
  category: Category;
  status: string | null;
};

const BOOKING_EVENTS = new Set([
  "booking_proposed",
  "booking_updated",
  "booking_confirmed",
  "booking_changes_requested",
  "booking_completion_confirmed",
  "booking_completed",
  "managed_casting_booking_proposed",
  "managed_booking_confirmed",
  "managed_booking_changes_requested",
  "managed_booking_talent_completed",
  "managed_booking_completed",
]);

function relatedEvent(value: DatabaseNotification["events"]): NotificationEvent | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function applicationMessage(application: ApplicationNotification, isArabic: boolean) {
  const opportunity = Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;
  const title = opportunity?.title || (isArabic ? "فرصة بدون عنوان" : "Untitled Opportunity");

  if (application.status === "accepted") {
    return isArabic ? `تم قبول طلبك في فرصة «${title}».` : `Your application for “${title}” was accepted.`;
  }
  if (application.status === "shortlisted") {
    return isArabic ? `تمت إضافة طلبك إلى القائمة المختصرة في فرصة «${title}».` : `Your application for “${title}” was shortlisted.`;
  }
  if (application.status === "rejected") {
    return isArabic ? `تم رفض طلبك في فرصة «${title}».` : `Your application for “${title}” was rejected.`;
  }
  if (application.status === "reviewing") {
    return isArabic ? `أصبح طلبك على فرصة «${title}» قيد المراجعة.` : `Your application for “${title}” is under review.`;
  }
  return isArabic ? `تم استلام طلبك على فرصة «${title}».` : `Your application for “${title}” was received.`;
}

function categoryLabel(category: Category, status: string | null, isArabic: boolean) {
  if (category === "booking") return isArabic ? "حجز" : "Booking";
  if (category === "message") return isArabic ? "رسالة" : "Message";
  if (category === "invitation") return isArabic ? "دعوة" : "Invitation";
  if (category === "application") {
    if (status === "accepted") return isArabic ? "مقبول" : "Accepted";
    if (status === "shortlisted") return isArabic ? "قائمة مختصرة" : "Shortlisted";
    if (status === "rejected") return isArabic ? "مرفوض" : "Rejected";
    if (status === "reviewing") return isArabic ? "قيد المراجعة" : "Reviewing";
    return isArabic ? "طلب" : "Application";
  }
  return isArabic ? "تنبيه" : "Update";
}

function actionLabel(category: Category, isArabic: boolean) {
  if (category === "booking") return isArabic ? "فتح الحجز" : "Open booking";
  if (category === "message") return isArabic ? "فتح المحادثة" : "Open conversation";
  if (category === "invitation") return isArabic ? "عرض الفرصة" : "View opportunity";
  if (category === "application") return isArabic ? "عرض الطلبات" : "View applications";
  return isArabic ? "عرض" : "View";
}

function CategoryIcon({ category, status }: { category: Category; status: string | null }) {
  if (category === "booking") return <CalendarCheck2 size={19} />;
  if (category === "message") return <MessageCircle size={19} />;
  if (category === "invitation") return <BriefcaseBusiness size={19} />;
  if (status === "accepted" || status === "shortlisted") return <CheckCircle2 size={19} />;
  if (status === "rejected") return <XCircle size={19} />;
  return <Clock3 size={19} />;
}

export default async function TalentNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const auth = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await auth.auth.getUser();
  if (userError || !user) redirect(`/${locale}/login`);

  const admin = createAdminClient();
  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) throw new Error(`[TalentNotificationsPage talent] ${talentError.message}`);
  if (!talent) redirect(`/${locale}/join/talent`);

  const [applicationsResult, databaseResult] = await Promise.all([
    admin
      .from("opportunity_applications")
      .select(`
        id,
        status,
        created_at,
        opportunities (
          title,
          opportunity_type
        )
      `)
      .eq("talent_id", talent.id)
      .order("created_at", { ascending: false })
      .limit(15),
    admin
      .from("notifications")
      .select(`
        id,
        title,
        body,
        is_read,
        created_at,
        events (
          event_type,
          metadata
        )
      `)
      .eq("recipient_type", "talent")
      .eq("recipient_id", String(talent.id))
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (applicationsResult.error) throw new Error(`[TalentNotificationsPage applications] ${applicationsResult.error.message}`);
  if (databaseResult.error) throw new Error(`[TalentNotificationsPage notifications] ${databaseResult.error.message}`);

  const applicationNotifications: DisplayNotification[] = ((applicationsResult.data ?? []) as ApplicationNotification[]).map((application) => ({
    id: `application-${application.id}`,
    title: isArabic ? "تحديث الطلب" : "Application update",
    message: applicationMessage(application, isArabic),
    read: true,
    createdAt: application.created_at,
    href: `/${locale}/talent-dashboard/applications`,
    category: "application",
    status: application.status,
  }));

  const databaseNotifications: DisplayNotification[] = ((databaseResult.data ?? []) as DatabaseNotification[]).map((notification) => {
    const event = relatedEvent(notification.events);
    const eventType = event?.event_type ?? null;
    const isBooking = Boolean(eventType && BOOKING_EVENTS.has(eventType));
    const isInvitation = eventType === "opportunity_invitation" || eventType === "managed_casting_invitation";
    const isMessage = eventType === "message_created" || notification.title?.trim().toLowerCase() === "new message";
    const conversationId = positiveInteger(event?.metadata?.conversationId);

    const category: Category = isBooking
      ? "booking"
      : isInvitation
        ? "invitation"
        : isMessage
          ? "message"
          : "system";

    let href = `/${locale}/talent-dashboard/applications`;
    if (isBooking || isInvitation) {
      href = `/${locale}/talent-dashboard/notifications/${notification.id}`;
    } else if (isMessage && conversationId) {
      href = `/${locale}/talent-dashboard/messages/${conversationId}`;
    } else if (category === "system") {
      href = `/${locale}/talent-dashboard/notifications/${notification.id}`;
    }

    return {
      id: `database-${notification.id}`,
      title: isMessage
        ? isArabic ? "رسالة جديدة" : "New message"
        : notification.title || (isArabic ? "تنبيه" : "Notification"),
      message: notification.body || (isArabic ? "لديك تحديث جديد." : "You have a new update."),
      read: notification.is_read ?? false,
      createdAt: notification.created_at,
      href,
      category,
      status: isBooking ? eventType : isInvitation ? "invited" : null,
    };
  });

  const notifications = [...applicationNotifications, ...databaseNotifications].sort((a, b) => {
    const first = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const second = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return second - first;
  });

  const unreadCount = notifications.filter((item) => !item.read).length;
  const bookingCount = notifications.filter((item) => item.category === "booking").length;
  const applicationCount = notifications.filter((item) => item.category === "application").length;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-24 pt-32 text-white sm:px-6 lg:pb-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
          <Link href={`/${locale}/talent-dashboard`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
            <ArrowLeft size={16} className={isArabic ? "rotate-180" : ""} />
            {isArabic ? "العودة إلى لوحة التحكم" : "Back to dashboard"}
          </Link>

          <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold">{isArabic ? "مركز الإشعارات" : "Notification Center"}</p>
              <h1 className="mt-3 text-4xl font-light sm:text-5xl">{isArabic ? "الإشعارات" : "Notifications"}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                {isArabic
                  ? "تابع الدعوات وتحديثات الطلبات والرسائل والحجوزات. كل إشعار ينقلك مباشرة إلى الإجراء المطلوب."
                  : "Track invitations, applications, messages, and bookings. Each notification opens the exact action that needs your attention."}
              </p>
            </div>

            <Link href={`/${locale}/talent-dashboard/messages`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft">
              <MessageCircle size={17} />
              {isArabic ? "فتح الرسائل" : "Open messages"}
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={isArabic ? "الإجمالي" : "Total"} value={notifications.length} />
          <Stat label={isArabic ? "غير المقروء" : "Unread"} value={unreadCount} />
          <Stat label={isArabic ? "الحجوزات" : "Bookings"} value={bookingCount} emphasis />
          <Stat label={isArabic ? "الطلبات" : "Applications"} value={applicationCount} />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          {notifications.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold"><Bell size={24} /></div>
                <h2 className="mt-5 text-2xl font-light">{isArabic ? "لا توجد إشعارات حاليًا" : "No notifications yet"}</h2>
                <p className="mt-3 text-sm leading-7 text-white/40">{isArabic ? "ستظهر هنا الدعوات وتحديثات طلباتك ورسائلك وحجوزاتك." : "Invitations, application updates, messages, and bookings will appear here."}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <article key={notification.id} className={notification.read ? "p-5 sm:p-6" : "bg-gold/[0.035] p-5 sm:p-6"}>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.07] text-gold">
                        <CategoryIcon category={notification.category} status={notification.status} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] text-white/55">
                            {categoryLabel(notification.category, notification.status, isArabic)}
                          </span>
                          {!notification.read ? <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-[10px] text-gold">{isArabic ? "جديد" : "New"}</span> : null}
                        </div>
                        <h2 className="mt-3 text-base font-medium sm:text-lg">{notification.title}</h2>
                        <p className="mt-1 max-w-3xl text-sm leading-7 text-white/45">{notification.message}</p>
                        <time className="mt-2 block text-[10px] text-white/30">{formatDate(notification.createdAt, locale)}</time>
                      </div>
                    </div>

                    <Link href={notification.href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] px-5 text-xs text-gold transition hover:bg-gold hover:text-black">
                      {actionLabel(notification.category, isArabic)}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border p-4 sm:p-5 ${emphasis ? "border-gold/25 bg-gold/[0.06]" : "border-white/10 bg-white/[0.025]"}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={emphasis ? "mt-2 text-3xl font-light text-gold" : "mt-2 text-3xl font-light"}>{value}</p>
    </div>
  );
}
