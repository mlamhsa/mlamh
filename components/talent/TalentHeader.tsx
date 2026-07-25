import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  UserRound,
} from "lucide-react";

type TalentHeaderProps = {
  locale: string;
  talentName: string;
  profileCompletion: number;
  pendingCount: number;
  reviewingCount: number;
};

type HeaderMetricProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  highlighted?: boolean;
  progress?: number;
  className?: string;
};

export default function TalentHeader({
  locale,
  talentName,
  profileCompletion,
  pendingCount,
  reviewingCount,
}: TalentHeaderProps) {
  const isRtl = locale === "ar";
  const safeProfileCompletion = Math.min(
    100,
    Math.max(0, Math.round(profileCompletion)),
  );

  return (
    <header className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-4 sm:p-6 md:rounded-[2.25rem] md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="arabic-safe text-[10px] uppercase tracking-[0.24em] text-gold sm:text-xs sm:tracking-[0.32em]">
            {isRtl ? "مساحة الموهبة" : "Talent Workspace"}
          </p>

          <h1 className="mt-2.5 break-words text-3xl font-light leading-tight sm:mt-3 sm:text-4xl md:text-5xl">
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

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 md:grid-cols-3 md:gap-3">
        <HeaderMetric
          icon={<BriefcaseBusiness size={17} aria-hidden="true" />}
          label={isRtl ? "طلبات جديدة" : "New applications"}
          value={pendingCount}
        />

        <HeaderMetric
          icon={<Clock3 size={17} aria-hidden="true" />}
          label={isRtl ? "قيد المراجعة" : "Under review"}
          value={reviewingCount}
        />

        <HeaderMetric
          icon={<CheckCircle2 size={17} aria-hidden="true" />}
          label={isRtl ? "اكتمال الملف" : "Profile completion"}
          value={`${safeProfileCompletion}%`}
          highlighted
          progress={safeProfileCompletion}
          className="col-span-2 md:col-span-1"
        />
      </div>
    </header>
  );
}

function HeaderMetric({
  icon,
  label,
  value,
  highlighted = false,
  progress,
  className = "",
}: HeaderMetricProps) {
  return (
    <div
      className={`min-w-0 rounded-[1.25rem] border p-3.5 sm:rounded-[1.4rem] sm:p-4 ${
        highlighted
          ? "border-gold/30 bg-gold/[0.08]"
          : "border-white/10 bg-black/20"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="arabic-safe break-words text-[9px] uppercase leading-5 tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
            {label}
          </p>

          <p className="mt-1.5 text-2xl font-light leading-none text-white sm:mt-2 sm:text-3xl">
            {value}
          </p>
        </div>

        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold sm:h-10 sm:w-10">
          {icon}
        </div>
      </div>

      {typeof progress === "number" ? (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={label}
        >
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
