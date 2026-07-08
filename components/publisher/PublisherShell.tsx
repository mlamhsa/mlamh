"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  LogOut,
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

export default function PublisherShell({
  locale,
  isRtl,
  children,
}: Props) {
  const pathname = usePathname();

  const items = [
    {
      href: `/${locale}/publisher-dashboard`,
      label: isRtl ? "الرئيسية" : "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: `/${locale}/publisher-dashboard/opportunities`,
      label: isRtl ? "الفرص" : "Opportunities",
      icon: <BriefcaseBusiness size={18} />,
    },
    {
      href: `/${locale}/publisher-dashboard/applicants`,
      label: isRtl ? "المتقدمون" : "Applicants",
      icon: <UsersRound size={18} />,
    },
    {
      href: `/${locale}/publisher-dashboard/profile`,
      label: isRtl ? "ملف الشركة" : "Company Profile",
      icon: <Building2 size={18} />,
    },
    {
      href: `/${locale}/publisher-dashboard/settings`,
      label: isRtl ? "الإعدادات" : "Settings",
      icon: <Settings size={18} />,
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = `/${locale}/login`;
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">

        <aside className="sticky top-6 h-fit rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">

          <Link
            href={`/${locale}/publisher-dashboard`}
            className="block border-b border-white/10 pb-6"
          >
            <p className="text-3xl font-light tracking-wide text-gold">
              MLAMH
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.28em] text-white/35">
              {isRtl ? "لوحة الشركة" : "Publisher Dashboard"}
            </p>
          </Link>

          <nav className="mt-6 space-y-2">
            {items.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition ${
                    active
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-transparent text-white/60 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <span
                    className={
                      active ? "text-gold" : "text-white/35"
                    }
                  >
                    {item.icon}
                  </span>

                  <span className="text-sm">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-3 border-t border-white/10 pt-6">

            <Link
              href={`/${locale}/opportunities/new`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-gold bg-gold/10 px-5 py-4 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
            >
              <Plus size={16} />
              {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut size={16} />
              {isRtl ? "تسجيل الخروج" : "Sign Out"}
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