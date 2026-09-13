"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Zap } from "lucide-react";

export default function OpportunityModeNav({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const root = `/${locale}/opportunities`;
  const quickPath = `${root}/quick`;
  const castingPath = `${root}/casting`;

  const shouldShow = pathname === root || pathname === quickPath || pathname === castingPath;
  if (!shouldShow) return null;

  const isRoot = pathname === root;
  const quickActive = pathname === quickPath;
  const castingActive = pathname === castingPath;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={
        isRoot
          ? "mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:absolute lg:inset-x-0 lg:top-20 lg:z-40 lg:px-6 lg:pt-0"
          : "mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-6 lg:pt-28"
      }
    >
      <div className="rounded-[1.5rem] border border-white/10 bg-black/85 p-2 shadow-xl backdrop-blur-xl sm:inline-flex sm:rounded-full">
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            href={quickPath}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-medium transition sm:px-6 ${
              quickActive
                ? "bg-gold text-black"
                : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-gold/30 hover:text-gold"
            }`}
          >
            <Zap size={15} />
            {isRtl ? "طلبات الآن" : "Quick Requests"}
          </Link>

          <Link
            href={castingPath}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-medium transition sm:px-6 ${
              castingActive
                ? "bg-gold text-black"
                : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-gold/30 hover:text-gold"
            }`}
          >
            <BriefcaseBusiness size={15} />
            {isRtl ? "فرص الكاستينغ" : "Casting Opportunities"}
          </Link>
        </div>

        {isRoot ? (
          <p className="px-3 pb-1 pt-2 text-center text-[10px] leading-5 text-white/30 sm:hidden">
            {isRtl ? "اختر نوع الفرص التي تريد استعراضها." : "Choose the type of opportunities you want to browse."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
