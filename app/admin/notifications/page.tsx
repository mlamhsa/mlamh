import {
  AdminCard,
  AdminEmptyState,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";

import {
  markAdminNotificationReadAction,
  markAllAdminNotificationsReadAction,
} from "@/lib/actions/admin-notification-actions";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Notifications — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic =
  "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
    q?: string;
    recipient?: string;
    status?: string;
  }>;
};

type NotificationRecord = {
  id: number | string;

  event_id:
    | number
    | string
    | null;

  recipient_type:
    | string
    | null;

  recipient_id:
    | string
    | number
    | null;

  title:
    | string
    | null;

  body:
    | string
    | null;

  is_read:
    | boolean
    | null;

  created_at:
    | string
    | null;
};

function isUnread(
  notification: NotificationRecord,
) {
  return (
    notification.is_read !== true
  );
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function recipientLabel(
  type?: string | null,
) {
  switch (
    type?.toUpperCase()
  ) {
    case "TALENT":
      return "موهبة";

    case "PUBLISHER":
      return "ناشر";

    case "ADMIN":
      return "إدارة";

    default:
      return (
        type ||
        "غير محدد"
      );
  }
}

function buildHref({
  lang,
  q,
  recipient,
  status,
}: {
  lang?: string;
  q?: string;
  recipient?: string;
  status?: string;
}) {
  const params =
    new URLSearchParams();

  if (lang) {
    params.set(
      "lang",
      lang,
    );
  }

  if (q) {
    params.set(
      "q",
      q,
    );
  }

  if (recipient) {
    params.set(
      "recipient",
      recipient,
    );
  }

  if (status) {
    params.set(
      "status",
      status,
    );
  }

  const query =
    params.toString();

  return query
    ? `/admin/notifications?${query}`
    : "/admin/notifications";
}

export default async function AdminNotificationsPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const {
    lang = "ar",
    q,
    recipient,
    status,
  } = await searchParams;

  const adminClient =
    createAdminClient();

  const {
    data,
    error,
  } = await adminClient
    .from("notifications")
    .select(`
      id,
      event_id,
      recipient_type,
      recipient_id,
      title,
      body,
      is_read,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: false,
      },
    )
    .limit(300);

  if (error) {
    throw new Error(
      `[AdminNotificationsPage] ${error.message}`,
    );
  }

  const notifications =
    (data ??
      []) as NotificationRecord[];

  const cleanSearch =
    q?.trim().toLowerCase() ??
    "";

  const filteredNotifications =
    notifications.filter(
      (notification) => {
        if (
          recipient &&
          notification.recipient_type
            ?.toUpperCase() !==
            recipient.toUpperCase()
        ) {
          return false;
        }

        const unread =
          isUnread(
            notification,
          );

        if (
          status === "unread" &&
          !unread
        ) {
          return false;
        }

        if (
          status === "read" &&
          unread
        ) {
          return false;
        }

        if (!cleanSearch) {
          return true;
        }

        const haystack = [
          notification.title,
          notification.body,
          notification.recipient_type,
          notification.recipient_id,
          notification.event_id,
        ]
          .filter(
            (
              value,
            ) =>
              value !== null &&
              value !== undefined,
          )
          .join(" ")
          .toLowerCase();

        return haystack.includes(
          cleanSearch,
        );
      },
    );

  const total =
    notifications.length;

  const unread =
    notifications.filter(
      isUnread,
    ).length;

  const read =
    total - unread;

  const talentNotifications =
    notifications.filter(
      (notification) =>
        notification.recipient_type
          ?.toUpperCase() ===
        "TALENT",
    ).length;

  const publisherNotifications =
    notifications.filter(
      (notification) =>
        notification.recipient_type
          ?.toUpperCase() ===
        "PUBLISHER",
    ).length;

  const adminNotifications =
    notifications.filter(
      (notification) =>
        notification.recipient_type
          ?.toUpperCase() ===
        "ADMIN",
    ).length;

  const unreadAdminNotifications =
    notifications.filter(
      (notification) =>
        notification.recipient_type
          ?.toUpperCase() ===
          "ADMIN" &&
        isUnread(notification),
    ).length;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="إدارة الإشعارات"
        description="مراقبة إشعارات المنصة للمواهب والناشرين والإدارة ومتابعة حالة قراءتها."
      />

      {unreadAdminNotifications >
      0 ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.04] p-4">
          <div>
            <p className="text-sm text-gold">
              لديك{" "}
              {
                unreadAdminNotifications
              }{" "}
              إشعارًا إداريًا غير مقروء
            </p>

            <p className="mt-1 text-xs text-white/35">
              يمكنك تحديد جميع إشعارات الإدارة كمقروءة دفعة واحدة.
            </p>
          </div>

          <form
            action={
              markAllAdminNotificationsReadAction
            }
          >
            <button
              type="submit"
              className="rounded-full border border-gold/30 bg-gold/[0.05] px-5 py-2.5 text-xs text-gold transition hover:bg-gold hover:text-black"
            >
              تحديد الكل كمقروء
            </button>
          </form>
        </div>
      ) : null}

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard
          label="إجمالي الإشعارات"
          value={total}
          active={
            !recipient &&
            !status
          }
          href={buildHref({
            lang,
            q,
          })}
        />

        <AdminStatCard
          label="غير مقروء"
          value={unread}
          active={
            status ===
            "unread" &&
            !recipient
          }
          href={buildHref({
            lang,
            q,
            status:
              "unread",
          })}
        />

        <AdminStatCard
          label="مقروء"
          value={read}
          active={
            status ===
            "read" &&
            !recipient
          }
          href={buildHref({
            lang,
            q,
            status:
              "read",
          })}
        />

        <AdminStatCard
          label="المواهب"
          value={
            talentNotifications
          }
          active={
            recipient ===
            "TALENT"
          }
          href={buildHref({
            lang,
            q,
            recipient:
              "TALENT",
          })}
        />

        <AdminStatCard
          label="الناشرون"
          value={
            publisherNotifications
          }
          active={
            recipient ===
            "PUBLISHER"
          }
          href={buildHref({
            lang,
            q,
            recipient:
              "PUBLISHER",
          })}
        />

        <AdminStatCard
          label="الإدارة"
          value={
            adminNotifications
          }
          active={
            recipient ===
            "ADMIN"
          }
          href={buildHref({
            lang,
            q,
            recipient:
              "ADMIN",
          })}
        />
      </AdminGrid>

      <form
        method="GET"
        className="mb-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5"
      >
        <input
          type="hidden"
          name="lang"
          value={lang}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="ابحث في عنوان أو محتوى الإشعار..."
            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/30"
          />

          <select
            name="recipient"
            defaultValue={
              recipient ?? ""
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
          >
            <option value="">
              كل المستلمين
            </option>

            <option value="TALENT">
              المواهب
            </option>

            <option value="PUBLISHER">
              الناشرون
            </option>

            <option value="ADMIN">
              الإدارة
            </option>
          </select>

          <select
            name="status"
            defaultValue={
              status ?? ""
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
          >
            <option value="">
              كل الحالات
            </option>

            <option value="unread">
              غير مقروء
            </option>

            <option value="read">
              مقروء
            </option>
          </select>

          <button
            type="submit"
            className="rounded-2xl border border-gold/35 bg-gold/[0.05] px-7 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            بحث
          </button>
        </div>
      </form>

      {filteredNotifications.length ===
      0 ? (
        <AdminEmptyState message="لا توجد إشعارات مطابقة." />
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(
            (
              notification,
            ) => {
              const unreadNotification =
                isUnread(
                  notification,
                );

              const isAdminNotification =
                notification.recipient_type
                  ?.toUpperCase() ===
                "ADMIN";

              return (
                <AdminCard
                  key={
                    notification.id
                  }
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] ${
                            unreadNotification
                              ? "border-gold/30 bg-gold/[0.08] text-gold"
                              : "border-white/10 bg-white/[0.03] text-white/40"
                          }`}
                        >
                          {unreadNotification
                            ? "غير مقروء"
                            : "مقروء"}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] ${
                            isAdminNotification
                              ? "border-amber-400/25 bg-amber-400/[0.06] text-amber-300"
                              : "border-white/[0.08] text-white/45"
                          }`}
                        >
                          {recipientLabel(
                            notification.recipient_type,
                          )}
                        </span>

                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                          Notification #
                          {
                            notification.id
                          }
                        </span>
                      </div>

                      <h2 className="text-xl font-light text-white">
                        {notification.title ||
                          "إشعار بدون عنوان"}
                      </h2>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/55">
                        {notification.body ||
                          "لا يوجد محتوى."}
                      </p>

                      <div className="mt-5 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                            المستلم
                          </p>

                          <p className="mt-1 text-xs text-white/55">
                            {recipientLabel(
                              notification.recipient_type,
                            )}
                            {" · "}
                            {String(
                              notification.recipient_id ??
                                "—",
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                            Event
                          </p>

                          <p className="mt-1 text-xs text-white/55">
                            {String(
                              notification.event_id ??
                                "—",
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                            التاريخ
                          </p>

                          <p className="mt-1 text-xs text-white/55">
                            {formatDate(
                              notification.created_at,
                            )}
                          </p>
                        </div>
                      </div>

                      {isAdminNotification &&
                      unreadNotification ? (
                        <form
                          action={
                            markAdminNotificationReadAction
                          }
                          className="mt-5 border-t border-white/[0.06] pt-4"
                        >
                          <input
                            type="hidden"
                            name="notification_id"
                            value={
                              notification.id
                            }
                          />

                          <button
                            type="submit"
                            className="rounded-full border border-gold/25 bg-gold/[0.04] px-4 py-2 text-[10px] text-gold transition hover:bg-gold/10"
                          >
                            تحديد كمقروء
                          </button>
                        </form>
                      ) : null}
                    </div>

                    {unreadNotification ? (
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold" />
                    ) : null}
                  </div>
                </AdminCard>
              );
            },
          )}
        </div>
      )}
    </AdminPageContainer>
  );
}