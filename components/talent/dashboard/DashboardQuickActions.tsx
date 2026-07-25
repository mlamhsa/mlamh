import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  UserRound,
} from "lucide-react";

type DashboardQuickActionsProps = {
  locale: string;
  isRtl: boolean;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  totalApplications: number;
  profileCompletion: number;
};

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: typeof Bell;
  count?: number;
};

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

export default function DashboardQuickActions({
  locale,
  isRtl,
  unreadMessagesCount,
  unreadNotificationsCount,
  totalApplications,
  profileCompletion,
}: DashboardQuickActionsProps) {
  const safeUnreadMessagesCount = formatCount(unreadMessagesCount);
  const safeUnreadNotificationsCount = formatCount(
    unreadNotificationsCount,
  );
  const safeTotalApplications = formatCount(totalApplications);
  const safeProfileCompletion = clampPercentage(profileCompletion);

  const quickActions: QuickAction[] = [
    {
      label: isRtl ? "الرسائل" : "Messages",
      description: isRtl
        ? safeUnreadMessagesCount > 0
          ? `${safeUnreadMessagesCount} غير مقروءة`
          : "عرض المحادثات"
        : safeUnreadMessagesCount > 0
          ? `${safeUnreadMessagesCount} unread`
          : "View conversations",
      href: `/${locale}/talent-dashboard/messages`,
      icon: MessageSquareText,
      count: safeUnreadMessagesCount,
    },
    {
      label: isRtl ? "الإشعارات" : "Notifications",
      description: isRtl
        ? safeUnreadNotificationsCount > 0
          ? `${safeUnreadNotificationsCount} جديدة`
          : "لا توجد إشعارات جديدة"
        : safeUnreadNotificationsCount > 0
          ? `${safeUnreadNotificationsCount} new`
          : "No new notifications",
      href: `/${locale}/talent-dashboard/notifications`,
      icon: Bell,
      count: safeUnreadNotificationsCount,
    },
    {
      label: isRtl ? "طلباتي" : "Applications",
      description: isRtl
        ? `${safeTotalApplications} طلب`
        : `${safeTotalApplications} applications`,
      href: `/${locale}/talent-dashboard/applications`,
      icon: BriefcaseBusiness,
    },
    {
      label: isRtl ? "الملف الشخصي" : "Profile",
      description: isRtl
        ? `مكتمل بنسبة ${safeProfileCompletion}%`
        : `${safeProfileCompletion}% complete`,
      href: `/${locale}/talent-dashboard/profile`,
      icon: UserRound,
    },
  ];

  return (
    <section aria-labelledby="quick-actions-title">
      <div className="mb-3">
        <p className="arabic-safe text-[10px] uppercase tracking-[0.24em] text-gold">
          {isRtl ? "وصول سريع" : "Quick Access"}
        </p>

        <h2
          id="quick-actions-title"
          className="mt-1.5 text-xl font-light text-white sm:text-2xl"
        >
          {isRtl ? "الإجراءات السريعة" : "Quick actions"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;
          const hasCount =
            typeof action.count === "number" && action.count > 0;
          const isProfileAction = action.href.endsWith("/profile");

          return (
            <Link
              key={action.href}
              href={action.href}
              aria-label={`${action.label}: ${action.description}`}
              className="group relative flex min-h-[104px] min-w-0 flex-col justify-between overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.025] p-3.5 outline-none transition duration-200 hover:border-gold/25 hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:min-h-[112px] sm:p-4"
            >
              <div className="flex items-start justify-between gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-white/60 transition group-hover:border-gold/25 group-hover:text-gold sm:h-10 sm:w-10"
                >
                  <Icon size={17} />
                </span>

                {hasCount ? (
                  <span
                    aria-label={
                      isRtl
                        ? `${action.count} عناصر جديدة`
                        : `${action.count} new items`
                    }
                    className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 py-1 text-[9px] font-medium leading-none text-black sm:min-w-6 sm:px-2 sm:text-[10px]"
                  >
                    {(action.count ?? 0) > 99 ? "99+" : action.count}
                  </span>
                ) : (
                  <ArrowIcon
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 text-white/20 transition group-hover:text-white/50"
                  />
                )}
              </div>

              <div className="mt-3 min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {action.label}
                </p>

                <p className="mt-0.5 line-clamp-2 text-[11px] leading-5 text-white/35 sm:text-xs">
                  {action.description}
                </p>

                {isProfileAction ? (
                  <div
                    className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-label={
                      isRtl
                        ? "نسبة اكتمال الملف"
                        : "Profile completion"
                    }
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={safeProfileCompletion}
                  >
                    <div
                      className="h-full rounded-full bg-gold transition-[width] duration-500"
                      style={{
                        width: `${safeProfileCompletion}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
