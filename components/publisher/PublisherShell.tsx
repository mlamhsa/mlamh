"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
  UsersRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Props = {
  locale: string;
  isRtl: boolean;
  children: ReactNode;
};

type DashboardCounts = {
  messages: number;
  notifications: number;
};

const EMPTY_COUNTS: DashboardCounts = {
  messages: 0,
  notifications: 0,
};

export default function PublisherShell({
  locale,
  isRtl,
  children,
}: Props) {
  const pathname = usePathname();

  const [counts, setCounts] =
    useState<DashboardCounts>(EMPTY_COUNTS);

  const activeRequestRef =
    useRef<AbortController | null>(null);

  const dashboardHref =
    `/${locale}/publisher-dashboard`;

  const refreshCounts = useCallback(async () => {
    /*
     * إلغاء الطلب السابق إن كان لا يزال يعمل.
     * هذا يمنع تداخل طلبات العداد عند التنقل
     * أو أثناء تحديث Turbopack.
     */
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const response = await fetch(
        "/api/publisher/dashboard-counts",
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        /*
         * عدم تحويل أخطاء المصادقة المؤقتة إلى
         * شاشة خطأ داخل وضع التطوير.
         */
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404
        ) {
          setCounts(EMPTY_COUNTS);
        }

        return;
      }

      const data =
        (await response.json()) as Partial<DashboardCounts>;

      if (controller.signal.aborted) {
        return;
      }

      setCounts({
        messages:
          typeof data.messages === "number"
            ? Math.max(0, data.messages)
            : 0,

        notifications:
          typeof data.notifications === "number"
            ? Math.max(0, data.notifications)
            : 0,
      });
    } catch (error) {
      /*
       * AbortError طبيعي عند:
       * - التنقل بين الصفحات
       * - تحديث Turbopack
       * - إلغاء الطلب السابق
       */
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      /*
       * أثناء التطوير قد ينقطع fetch لجزء من الثانية
       * بينما يعيد Next.js تجميع الملفات.
       * لا نستخدم console.error هنا حتى لا تظهر
       * شاشة Runtime Error الحمراء.
       */
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[PublisherShell] Dashboard counts request was interrupted.",
        );

        return;
      }

      console.warn(
        "[PublisherShell] Unable to refresh dashboard counts.",
      );
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void refreshCounts();

    const intervalId = window.setInterval(() => {
      /*
       * لا نرسل الطلب عندما تكون الصفحة مخفية
       * أو عندما لا يوجد اتصال بالإنترنت.
       */
      if (
        document.visibilityState === "visible" &&
        navigator.onLine
      ) {
        void refreshCounts();
      }
    }, 30000);

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine
      ) {
        void refreshCounts();
      }
    }

    function handleOnline() {
      void refreshCounts();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        "online",
        handleOnline,
      );

      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [pathname, refreshCounts]);

  const items = [
    {
      href: dashboardHref,
      label: isRtl ? "الرئيسية" : "Dashboard",
      icon: <LayoutDashboard size={18} />,
      exact: true,
      badge: 0,
    },
    {
      href: `${dashboardHref}/opportunities`,
      label: isRtl ? "الفرص" : "Opportunities",
      icon: <BriefcaseBusiness size={18} />,
      badge: 0,
    },
    {
      href: `${dashboardHref}/applicants`,
      label: isRtl ? "المتقدمون" : "Applicants",
      icon: <UsersRound size={18} />,
      badge: 0,
    },
    {
      href: `${dashboardHref}/messages`,
      label: isRtl ? "الرسائل" : "Messages",
      icon: <MessageSquare size={18} />,
      badge: counts.messages,
    },
    {
      href: `${dashboardHref}/notifications`,
      label: isRtl ? "الإشعارات" : "Notifications",
      icon: <Bell size={18} />,
      badge: counts.notifications,
    },
    {
      href: `${dashboardHref}/profile`,
      label: isRtl
        ? "ملف الشركة"
        : "Company Profile",
      icon: <Building2 size={18} />,
      badge: 0,
    },
    {
      href: `${dashboardHref}/settings`,
      label: isRtl ? "الإعدادات" : "Settings",
      icon: <Settings size={18} />,
      badge: 0,
    },
  ];

  async function handleLogout() {
    activeRequestRef.current?.abort();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.warn(
        "[PublisherShell] Sign-out failed:",
        error.message,
      );

      return;
    }

    window.location.assign(`/${locale}/login`);
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 md:px-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:pt-32">
        <aside className="mb-6 rounded-[2rem] border border-white/10 bg-black/80 p-5 backdrop-blur-xl lg:sticky lg:top-28 lg:mb-0 lg:h-fit lg:p-6">
          <Link
            href={dashboardHref}
            className="hidden border-b border-white/10 pb-6 lg:block"
          >
            <p className="text-3xl font-light tracking-wide text-gold">
              MLAMH
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.28em] text-white/35">
              {isRtl
                ? "لوحة الشركة"
                : "Publisher Dashboard"}
            </p>
          </Link>

          <nav className="grid grid-cols-2 gap-2 lg:mt-6 lg:block lg:space-y-2">
            {items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`,
                  );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center transition lg:justify-start lg:px-4 lg:py-4 ${
                    active
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-white/10 text-white/60 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span
                    className={
                      active
                        ? "text-gold"
                        : "text-white/35"
                    }
                  >
                    {item.icon}
                  </span>

                  <span className="text-xs lg:text-sm">
                    {item.label}
                  </span>

                  {item.badge > 0 ? (
                    <span className="absolute end-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-semibold text-black lg:static lg:ms-auto">
                      {item.badge > 99
                        ? "99+"
                        : item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 lg:mt-8 lg:pt-6">
            <Link
              href={`/${locale}/opportunities/new`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gold bg-gold/10 px-5 py-4 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
            >
              <Plus size={16} />

              {isRtl
                ? "إنشاء فرصة"
                : "Create Opportunity"}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut size={16} />

              {isRtl
                ? "تسجيل الخروج"
                : "Sign Out"}
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          {children}
        </section>
      </div>
    </main>
  );
}