"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ role }: { role: "publisher" | "talent" }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <aside className="w-64 min-h-screen border-r border-white/10 p-6">
      <div className="text-gold text-sm tracking-[0.3em] mb-10">
        MALAMIH
      </div>

      <nav className="space-y-3 text-sm">
        {/* مشتركة */}
        <Link
          href={`/${role}/dashboard`}
          className={`block p-2 rounded-lg ${
            isActive("dashboard") ? "bg-white/10 text-white" : "text-white/60"
          }`}
        >
          Dashboard
        </Link>

        {/* Publisher */}
        {role === "publisher" && (
          <>
            <Link
              href="/publisher-dashboard/opportunities"
              className={`block p-2 rounded-lg ${
                isActive("opportunities")
                  ? "bg-white/10 text-white"
                  : "text-white/60"
              }`}
            >
              Opportunities
            </Link>

            <Link
              href="/publisher-dashboard/applicants"
              className={`block p-2 rounded-lg ${
                isActive("applicants")
                  ? "bg-white/10 text-white"
                  : "text-white/60"
              }`}
            >
              Applicants
            </Link>

            <Link
              href="/publisher-dashboard/profile"
              className={`block p-2 rounded-lg ${
                isActive("profile")
                  ? "bg-white/10 text-white"
                  : "text-white/60"
              }`}
            >
              Company Profile
            </Link>
          </>
        )}

        {/* Talent */}
        {role === "talent" && (
          <>
            <Link
              href="/talent-dashboard/opportunities"
              className={`block p-2 rounded-lg ${
                isActive("opportunities")
                  ? "bg-white/10 text-white"
                  : "text-white/60"
              }`}
            >
              Opportunities
            </Link>

            <Link
              href="/talent-dashboard/profile"
              className={`block p-2 rounded-lg ${
                isActive("profile")
                  ? "bg-white/10 text-white"
                  : "text-white/60"
              }`}
            >
              My Profile
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}