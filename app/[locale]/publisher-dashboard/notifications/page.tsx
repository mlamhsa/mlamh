import Link from "next/link";
import { redirect } from "next/navigation";

import { markPublisherNotificationsReadAction } from "@/lib/actions/notification-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type NotificationRecord = {
  id: number | string;
  title: string | null;
  body: string | null;
  created_at: string | null;
  read_at?: string | null;
  is_read?: boolean | null;
};

function formatNotificationDate(
  value: string | null,
  locale: string,
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function isNotificationUnread(
  notification: NotificationRecord,
) {
  if (
    typeof notification.is_read === "boolean"
  ) {
    return notification.is_read === false;
  }

  if ("read_at" in notification) {
    return notification.read_at === null;
  }

  return false;
}

export default async function PublisherNotificationsPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `[PublisherNotificationsPage profile] ${profileError.message}`,
    );
  }

  if (!profile || profile.account_type !== "publisher") {
    redirect(`/${locale}/login`);
  }

  const { data: publisher, error: publisherError } =
    await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (publisherError) {
    throw new Error(
      `[PublisherNotificationsPage publisher] ${publisherError.message}`,
    );
  }

  if (!publisher) {
    redirect(`/${locale}/join/publisher`);
  }

  const { data, error } = await adminClient
    .from("notifications")
    .select("*")
    .eq("recipient_type", "publisher")
    .eq("recipient_id", publisher.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `[PublisherNotificationsPage notifications] ${error.message}`,
    );
  }

  const notifications =
    (data ?? []) as NotificationRecord[];

  const unreadCount = notifications.filter(
    isNotificationUnread,
  ).length;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
          <Link
            href={`/${locale}/publisher-dashboard`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isArabic
              ? "← العودة إلى لوحة التحكم"
              : "← Back to Dashboard"}
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isArabic ? "الإشعارات" : "Notifications"}
              </p>

              <h1 className="mt-3 text-4xl font-light sm:text-5xl">
                {isArabic
                  ? "إشعارات الشركة"
                  : "Company Notifications"}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                {isArabic
                  ? "تابع آخر التحديثات المتعلقة بالفرص والمتقدمين والمحادثات."
                  : "Follow the latest updates related to opportunities, applicants, and conversations."}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {isArabic ? "الإجمالي" : "Total"}
                </p>
                <p className="mt-1 text-2xl font-light">
                  {notifications.length}
                </p>
              </div>

              <div className="rounded-2xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {isArabic ? "غير مقروء" : "Unread"}
                </p>
                <p className="mt-1 text-2xl font-light text-gold">
                  {unreadCount}
                </p>
              </div>

              {unreadCount > 0 ? (
                <form
                  action={
                    markPublisherNotificationsReadAction
                  }
                >
                  <input
                    type="hidden"
                    name="locale"
                    value={locale}
                  />

                  <button
                    type="submit"
                    className="rounded-2xl border border-gold/35 bg-gold/[0.08] px-5 py-4 text-xs text-gold transition hover:bg-gold hover:text-black"
                  >
                    {isArabic
                      ? "تعليم الكل كمقروء"
                      : "Mark all as read"}
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => {
                const unread =
                  isNotificationUnread(notification);

                return (
                  <article
                    key={notification.id}
                    className={`relative p-5 sm:p-6 ${
                      unread ? "bg-gold/[0.035]" : ""
                    }`}
                  >
                    {unread ? (
                      <span className="absolute end-5 top-6 h-2.5 w-2.5 rounded-full bg-gold" />
                    ) : null}

                    <div className="pe-8">
                      <h2
                        className={`text-lg ${
                          unread
                            ? "font-medium text-white"
                            : "font-light text-white/80"
                        }`}
                      >
                        {notification.title ||
                          (isArabic
                            ? "إشعار جديد"
                            : "New notification")}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">
                        {notification.body ||
                          (isArabic
                            ? "لا توجد تفاصيل إضافية."
                            : "No additional details.")}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <time className="text-[10px] text-white/30">
                          {formatNotificationDate(
                            notification.created_at,
                            locale,
                          )}
                        </time>

                        {unread ? (
                          <span className="rounded-full border border-gold/20 bg-gold/[0.06] px-2 py-1 text-[9px] text-gold">
                            {isArabic
                              ? "غير مقروء"
                              : "Unread"}
                          </span>
                        ) : (
                          <span className="text-[9px] text-white/25">
                            {isArabic
                              ? "مقروء"
                              : "Read"}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-2xl text-gold">
                  ♢
                </div>

                <h2 className="mt-5 text-2xl font-light">
                  {isArabic
                    ? "لا توجد إشعارات حتى الآن"
                    : "No notifications yet"}
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/40">
                  {isArabic
                    ? "ستظهر هنا إشعارات الفرص والمتقدمين والرسائل الجديدة عند توفرها."
                    : "Notifications about opportunities, applicants, and new messages will appear here."}
                </p>

                <Link
                  href={`/${locale}/publisher-dashboard`}
                  className="mt-6 inline-flex rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-sm text-gold transition hover:bg-gold hover:text-black"
                >
                  {isArabic
                    ? "العودة إلى لوحة التحكم"
                    : "Back to Dashboard"}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
