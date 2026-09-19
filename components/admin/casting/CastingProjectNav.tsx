"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getAdminLanguage, withAdminLanguage } from "@/lib/admin/i18n";

type CastingProjectNavProps = {
  projectId: number;
};

export function CastingProjectNav({ projectId }: CastingProjectNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = getAdminLanguage(searchParams.get("lang"));
  const isArabic = language === "ar";

  const items = [
    {
      href: `/admin/casting/${projectId}`,
      labelAr: "المشروع",
      labelEn: "Project",
      exact: true,
    },
    {
      href: `/admin/casting/${projectId}/applications`,
      labelAr: "الفرز",
      labelEn: "Screening",
    },
    {
      href: `/admin/casting/${projectId}/supply`,
      labelAr: "المطابقة",
      labelEn: "Matching",
    },
    {
      href: `/admin/casting/${projectId}/files`,
      labelAr: "الملفات",
      labelEn: "Files",
    },
    {
      href: `/admin/casting/${projectId}/sales`,
      labelAr: "المبيعات",
      labelEn: "Sales",
    },
  ];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="sticky top-16 z-30 border-b border-white/[0.065] bg-[#070707]/92 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8"
    >
      <nav
        className="mx-auto flex max-w-[1540px] gap-1.5 overflow-x-auto"
        aria-label={isArabic ? "تنقل مشروع الكاستينغ" : "Casting project navigation"}
      >
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={withAdminLanguage(item.href, language)}
              aria-current={active ? "page" : undefined}
              className={[
                "whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition",
                active
                  ? "border-gold/25 bg-gold/[0.08] text-gold"
                  : "border-transparent text-white/45 hover:border-white/[0.08] hover:bg-white/[0.03] hover:text-white/80",
              ].join(" ")}
            >
              {isArabic ? item.labelAr : item.labelEn}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
