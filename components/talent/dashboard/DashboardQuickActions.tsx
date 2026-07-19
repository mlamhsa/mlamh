import Link from "next/link";

type DashboardQuickActionsProps = {
  locale: string;
  isRtl: boolean;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  totalApplications: number;
  profileCompletion: number;
};

export default function DashboardQuickActions({
  locale,
  isRtl,
  unreadMessagesCount,
  unreadNotificationsCount,
  totalApplications,
  profileCompletion,
}: DashboardQuickActionsProps) {
  const quickActions = [
    {
      label: isRtl ? "الرسائل" : "Messages",
      description: isRtl
        ? unreadMessagesCount > 0
          ? `${unreadMessagesCount} غير مقروءة`
          : "عرض المحادثات"
        : unreadMessagesCount > 0
          ? `${unreadMessagesCount} unread`
          : "View conversations",
      href: `/${locale}/talent-dashboard/messages`,
      symbol: "✉",
      count: unreadMessagesCount,
    },
    {
      label: isRtl ? "الإشعارات" : "Notifications",
      description: isRtl
        ? unreadNotificationsCount > 0
          ? `${unreadNotificationsCount} جديدة`
          : "لا توجد إشعارات جديدة"
        : unreadNotificationsCount > 0
          ? `${unreadNotificationsCount} new`
          : "No new notifications",
      href: `/${locale}/talent-dashboard/notifications`,
      symbol: "◉",
      count: unreadNotificationsCount,
    },
    {
      label: isRtl ? "طلباتي" : "Applications",
      description: isRtl
        ? `${totalApplications} طلب`
        : `${totalApplications} applications`,
      href: `/${locale}/talent-dashboard/requests`,
      symbol: "□",
      count: 0,
    },
    {
      label: isRtl ? "الملف الشخصي" : "Profile",
      description: isRtl
        ? `مكتمل بنسبة ${profileCompletion}%`
        : `${profileCompletion}% complete`,
      href: `/${locale}/talent-dashboard/profile`,
      symbol: "○",
      count: 0,
    },
  ];

  return (
    <section aria-labelledby="quick-actions-title">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          {isRtl ? "وصول سريع" : "Quick Access"}
        </p>

        <h2
          id="quick-actions-title"
          className="mt-2 text-xl font-light text-white"
        >
          {isRtl ? "الإجراءات السريعة" : "Quick actions"}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.025] p-4 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/25 text-base text-white/60 transition group-hover:border-gold/25 group-hover:text-gold"
              >
                {action.symbol}
              </span>

              {action.count > 0 ? (
                <span className="min-w-6 rounded-full bg-gold px-2 py-1 text-center text-[10px] font-medium text-black">
                  {action.count > 99 ? "99+" : action.count}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="text-sm text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50"
                >
                  →
                </span>
              )}
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-white">{action.label}</p>
              <p className="mt-1 text-xs leading-5 text-white/35">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
