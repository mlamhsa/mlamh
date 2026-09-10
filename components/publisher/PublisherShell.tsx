"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Props = {
  locale: string;
  isRtl: boolean;
  children: ReactNode;
};

type DashboardCounts = {
  applicants: number;
  messages: number;
  notifications: number;
};

type DashboardCountsResponse = Partial<DashboardCounts> & {
  publisherId?: string | number | null;
};

const EMPTY_COUNTS: DashboardCounts = {
  applicants: 0,
  messages: 0,
  notifications: 0,
};

export default function PublisherShell({ locale, isRtl, children }: Props) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/publisher-dashboard`;

  const [counts, setCounts] = useState<DashboardCounts>(EMPTY_COUNTS);
  const [publisherId, setPublisherId] = useState<string | number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeRequestRef = useRef<AbortController | null>(null);
  const loggingOutRef = useRef(false);
  const realtimeRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCounts = useCallback(async () => {
    if (loggingOutRef.current) return;

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const response = await fetch("/api/publisher/dashboard-counts", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          setCounts(EMPTY_COUNTS);
          setPublisherId(null);
        }
        return;
      }

      const data = (await response.json()) as DashboardCountsResponse;
      if (controller.signal.aborted) return;

      setPublisherId(data.publisherId ?? null);
      setCounts({
        applicants:
          typeof data.applicants === "number" ? Math.max(0, data.applicants) : 0,
        messages:
          typeof data.messages === "number" ? Math.max(0, data.messages) : 0,
        notifications:
          typeof data.notifications === "number"
            ? Math.max(0, data.notifications)
            : 0,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.warn("[PublisherShell] Unable to refresh dashboard counts.");
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    void refreshCounts();
  }, [pathname, refreshCounts]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    function scheduleRefresh() {
      if (realtimeRefreshTimer.current) {
        clearTimeout(realtimeRefreshTimer.current);
      }
      realtimeRefreshTimer.current = setTimeout(() => {
        void refreshCounts();
      }, 160);
    }

    const channel = supabase.channel(
      `publisher-dashboard:${publisherId ?? "resolving"}`,
    );

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "opportunity_applications" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        scheduleRefresh,
      );

    if (publisherId !== null) {
      const id = String(publisherId);
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "opportunities",
            filter: `publisher_id=eq.${id}`,
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `publisher_id=eq.${id}`,
          },
          scheduleRefresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${id}`,
          },
          scheduleRefresh,
        );
    }

    channel.subscribe();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void refreshCounts();
      }
    }

    function handleOnline() {
      void refreshCounts();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      if (realtimeRefreshTimer.current) {
        clearTimeout(realtimeRefreshTimer.current);
        realtimeRefreshTimer.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      void supabase.removeChannel(channel);
    };
  }, [publisherId, refreshCounts]);

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
      badge: counts.applicants,
    },
    {
      href: `${dashboardHref}/featured`,
      label: isRtl ? "التمييز" : "Featured",
      icon: <Sparkles size={18} />,
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
      label: isRtl ? "ملف الشركة" : "Company Profile",
      icon: <Building2 size={18} />,
      badge: 0,
    },
    {
      href: `${dashboardHref}/verification`,
      label: isRtl ? "التوثيق" : "Verification",
      icon: <BadgeCheck size={18} />,
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
    loggingOutRef.current = true;
    activeRequestRef.current?.abort();
    setCounts(EMPTY_COUNTS);
    setPublisherId(null);

    const { error } = await supabase.auth.signOut();
    if (error) {
      loggingOutRef.current = false;
      console.warn("[PublisherShell] Sign-out failed:", error.message);
      return;
    }

    window.location.assign(`/${locale}/login`);
  }

  const sidebar = (
    <div className="rounded-[2rem] border border-white/10 bg-black/90 p-5 backdrop-blur-xl lg:p-6">
      <Link href={dashboardHref} className="block border-b border-white/10 pb-6">
        <p className="text-3xl font-light tracking-wide text-gold">MLAMH</p>
        <p className="mt-3 text-xs uppercase tracking-[0.28em] text-white/35">
          {isRtl ? "لوحة الجهة" : "Publisher Dashboard"}
        </p>
      </Link>

      <nav className="mt-6 space-y-2">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${
                active
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "border-white/10 text-white/60 hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <span className={active ? "text-gold" : "text-white/35"}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {item.badge > 0 ? (
                <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-semibold text-black">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300 transition hover:bg-red-500/10"
        >
          <LogOut size={16} />
          {isRtl ? "تسجيل الخروج" : "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="fixed top-24 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/85 text-white shadow-xl backdrop-blur-xl transition hover:border-gold/35 hover:text-gold lg:hidden"
        style={isRtl ? { right: 16 } : { left: 16 }}
        aria-label={isRtl ? "فتح قائمة لوحة الجهة" : "Open publisher dashboard menu"}
        aria-expanded={mobileNavOpen}
      >
        <Menu size={21} aria-hidden="true" />
      </button>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={isRtl ? "إغلاق القائمة" : "Close menu"}
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            className={`absolute inset-y-0 w-[min(88vw,360px)] overflow-y-auto bg-black p-4 shadow-2xl ${
              isRtl ? "right-0 border-l border-white/10" : "left-0 border-r border-white/10"
            }`}
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-gold/35 hover:text-gold"
                aria-label={isRtl ? "إغلاق القائمة" : "Close menu"}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-28 md:px-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:pt-32">
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:h-fit">{sidebar}</aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}
