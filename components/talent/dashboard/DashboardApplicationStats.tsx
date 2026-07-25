import ApplicationCard from "@/components/talent/ApplicationCard";

type DashboardApplicationStatsProps = {
  locale: string;
  isRtl: boolean;
  totalApplications: number;
  counts: Record<string, number>;
};

type ApplicationStatusKey =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected";

function sanitizeCount(value: number | undefined) {
  if (!Number.isFinite(value) || (value ?? 0) <= 0) {
    return 0;
  }

  return Math.floor(value ?? 0);
}

export default function DashboardApplicationStats({
  locale,
  isRtl,
  totalApplications,
  counts,
}: DashboardApplicationStatsProps) {
  const baseHref = `/${locale}/talent-dashboard/applications`;

  const safeTotalApplications = sanitizeCount(totalApplications);

  const statusCounts: Record<ApplicationStatusKey, number> = {
    pending: sanitizeCount(counts.pending),
    reviewing: sanitizeCount(counts.reviewing),
    shortlisted: sanitizeCount(counts.shortlisted),
    accepted: sanitizeCount(counts.accepted),
    rejected: sanitizeCount(counts.rejected),
  };

  const cards = [
    {
      key: "all",
      label: isRtl ? "الإجمالي" : "Total",
      value: safeTotalApplications,
      href: baseHref,
      description: isRtl ? "جميع الطلبات" : "All applications",
    },
    {
      key: "pending",
      label: isRtl ? "جديد" : "Pending",
      value: statusCounts.pending,
      href: `${baseHref}?status=pending`,
      description: isRtl ? "بانتظار المراجعة" : "Awaiting review",
    },
    {
      key: "reviewing",
      label: isRtl ? "قيد المراجعة" : "Reviewing",
      value: statusCounts.reviewing,
      href: `${baseHref}?status=reviewing`,
      description: isRtl ? "تتم مراجعته الآن" : "Currently under review",
    },
    {
      key: "shortlisted",
      label: isRtl ? "القائمة المختصرة" : "Shortlisted",
      value: statusCounts.shortlisted,
      href: `${baseHref}?status=shortlisted`,
      description: isRtl ? "ضمن القائمة المختصرة" : "On the shortlist",
    },
    {
      key: "accepted",
      label: isRtl ? "مقبول" : "Accepted",
      value: statusCounts.accepted,
      href: `${baseHref}?status=accepted`,
      description: isRtl ? "طلبات تم قبولها" : "Accepted applications",
      highlighted: true,
    },
    {
      key: "rejected",
      label: isRtl ? "مرفوض" : "Rejected",
      value: statusCounts.rejected,
      href: `${baseHref}?status=rejected`,
      description: isRtl ? "طلبات لم تُقبل" : "Not selected",
    },
  ];

  return (
    <section
      aria-labelledby="application-stats-title"
      className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6"
    >
      <div>
        <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
          {isRtl ? "تقديمات الفرص" : "Opportunity Applications"}
        </p>

        <h2
          id="application-stats-title"
          className="mt-3 text-2xl font-light sm:text-3xl"
        >
          {isRtl ? "تابع تقديماتك" : "Track your applications"}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
          {isRtl
            ? "اضغط على أي حالة لعرض الطلبات المرتبطة بها مباشرة."
            : "Select any status to view the related applications directly."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <ApplicationCard
            key={card.key}
            label={card.label}
            value={card.value}
            href={card.href}
            description={card.description}
            highlighted={card.highlighted}
          />
        ))}
      </div>
    </section>
  );
}
