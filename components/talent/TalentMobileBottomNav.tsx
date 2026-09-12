"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  Home,
  MessageSquareText,
  UserRound,
} from "lucide-react";

type Props = {
  locale: string;
  totalApplications?: number;
  unreadMessagesCount?: number;
};

export default function TalentMobileBottomNav({
  locale,
  totalApplications = 0,
  unreadMessagesCount = 0,
}: Props) {
  const pathname = usePathname();
  const isArabic = locale === "ar";
  const dashboardHref = `/${locale}/talent-dashboard`;

  const items = [
    {
      href: dashboardHref,
      label: isArabic ? "الرئيسية" : "Home",
      icon: Home,
      exact: true,
    },
    {
      href: `/${locale}/opportunities`,
      label: isArabic ? "الفرص" : "Opportunities",
      icon: CalendarDays,
      exact: false,
    },
    {
      href: `${dashboardHref}/applications`,
      label: isArabic ? "طلباتي" : "Applications",
      icon: BriefcaseBusiness,
      exact: false,
      badge: totalApplications > 0 ? totalApplications : undefined,
    },
    {
      href: `${dashboardHref}/messages`,
      label: isArabic ? "الرسائل" : "Messages",
      icon: MessageSquareText,
      exact: false,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      href: `${dashboardHref}/profile`,
      label: isArabic ? "ملفي" : "Profile",
      icon: UserRound,
      exact: false,
    },
  ];

  return (
    <nav
      aria-label={isArabic ? "التنقل الرئيسي للموهبة" : "Talent primary navigation"}
      dir={isArabic ? "rtl" : "ltr"}
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-black/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-18px_45px_rgba(0,0,0,.45)] backdrop-blur-xl xl:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
                active
                  ? "bg-gold/10 text-gold"
                  : "text-white/45 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2 : 1.7} aria-hidden="true" />
                {item.badge ? (
                  <span className="absolute -end-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[8px] font-bold leading-none text-black">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </span>
              <span className="max-w-full truncate text-[10px] font-medium leading-none sm:text-[11px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
