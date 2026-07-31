import Link from "next/link";
import {
  ArrowUpRight,
  UserRound,
} from "lucide-react";

type TalentHeaderProps = {
  locale: string;
  talentName: string;
};

export default function TalentHeader({
  locale,
  talentName,
}: TalentHeaderProps) {
  const isRtl = locale === "ar";

  return (
    <header className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-5 sm:p-6 md:rounded-[2.25rem] md:px-8 md:py-7">
      <div className="flex flex-col gap-5 pt-4 lg:flex-row lg:items-end lg:justify-between lg:pt-6">
        <div className="min-w-0">

          <h1 className="mt-3 break-words text-3xl font-light leading-[1.15] sm:mt-4 sm:text-4xl md:text-5xl">
            {isRtl ? `مرحباً، ${talentName}` : `Welcome, ${talentName}`}
          </h1>

          <p className="mt-2.5 max-w-2xl text-sm leading-7 text-white/50 sm:mt-3">
            {isRtl
              ? "تابع ملفك، طلباتك، وفرصك القادمة من مكان واحد."
              : "Manage your profile, applications, and next opportunities from one place."}
          </p>
        </div>

        <div className="grid w-full gap-2.5 sm:grid-cols-2 lg:w-auto">
          <Link
            href={`/${locale}/talent-dashboard/profile`}
            className="arabic-safe inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-gold px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-black transition duration-300 hover:bg-[#e0bd73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:text-xs sm:tracking-[0.18em]"
          >
            <UserRound size={16} aria-hidden="true" />
            {isRtl ? "إكمال الملف" : "Complete Profile"}
          </Link>

          <Link
            href={`/${locale}/opportunities`}
            className="arabic-safe inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/15 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white/70 transition duration-300 hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:text-xs sm:tracking-[0.18em]"
          >
            {isRtl ? "استعراض الفرص" : "Browse Opportunities"}

            <ArrowUpRight
              size={16}
              aria-hidden="true"
              className={isRtl ? "-scale-x-100" : undefined}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}