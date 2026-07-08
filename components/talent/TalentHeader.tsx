import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  UserRound,
} from "lucide-react";

export default function TalentHeader({
  locale,
  talentName,
  profileCompletion,
  pendingCount,
  reviewingCount,
}: any) {
  const isRtl = locale === "ar";

  return (
    <header className="mb-12 overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-7 md:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "مساحة الموهبة" : "Talent Workspace"}
          </p>

          <h1 className="mt-4 text-4xl font-light leading-tight md:text-6xl">
            {isRtl ? `مرحباً، ${talentName}` : `Welcome, ${talentName}`}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            {isRtl
              ? "تابع ملفك، طلباتك، وفرصك القادمة من مكان واحد."
              : "Manage your profile, applications, and next opportunities from one place."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/talent-dashboard/profile`}
            className="inline-flex items-center gap-3 rounded-full bg-gold px-6 py-4 text-xs font-medium uppercase tracking-[0.22em] text-black transition hover:bg-[#e0bd73]"
          >
            <UserRound size={16} />
            {isRtl ? "إكمال الملف" : "Complete Profile"}
          </Link>

          <Link
            href={`/${locale}/opportunities`}
            className="inline-flex items-center gap-3 rounded-full border border-white/15 px-6 py-4 text-xs uppercase tracking-[0.22em] text-white/70 transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <HeaderMetric
          icon={<BriefcaseBusiness size={18} />}
          label={isRtl ? "طلبات جديدة" : "New applications"}
          value={pendingCount}
        />

        <HeaderMetric
          icon={<Clock3 size={18} />}
          label={isRtl ? "قيد المراجعة" : "Under review"}
          value={reviewingCount}
        />

        <HeaderMetric
          icon={<CheckCircle2 size={18} />}
          label={isRtl ? "اكتمال الملف" : "Profile completion"}
          value={`${profileCompletion}%`}
          highlighted
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        highlighted
          ? "border-gold/30 bg-gold/[0.08]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="mb-4 inline-flex rounded-full border border-gold/20 bg-gold/[0.06] p-3 text-gold">
        {icon}
      </div>

      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-light text-white">{value}</p>
    </div>
  );
}