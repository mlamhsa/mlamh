import ApplicationCard from "@/components/talent/ApplicationCard";

type DashboardApplicationStatsProps = {
  locale: string;
  isRtl: boolean;
  totalApplications: number;
  counts: Record<string, number>;
};

export default function DashboardApplicationStats({
  locale,
  isRtl,
  totalApplications,
  counts,
}: DashboardApplicationStatsProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div>
      <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
          {isRtl ? "تقديمات الفرص" : "Opportunity Applications"}
        </p>

        <h2 className="mt-3 text-2xl font-light sm:text-3xl">
          {isRtl ? "تابع تقديماتك" : "Track your applications"}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
          {isRtl
            ? "اضغط على أي حالة لعرض الطلبات المرتبطة بها مباشرة."
            : "Select any status to view the related applications directly."}
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <ApplicationCard
          label={isRtl ? "الإجمالي" : "Total"}
          value={totalApplications}
          href={`/${locale}/talent-dashboard/requests`}
          description={isRtl ? "جميع الطلبات" : "All applications"}
        />

        <ApplicationCard
          label={isRtl ? "جديد" : "Pending"}
          value={counts.pending ?? 0}
          href={`/${locale}/talent-dashboard/requests?status=pending`}
          description={isRtl ? "بانتظار المراجعة" : "Awaiting review"}
        />

        <ApplicationCard
          label={isRtl ? "قيد المراجعة" : "Reviewing"}
          value={counts.reviewing ?? 0}
          href={`/${locale}/talent-dashboard/requests?status=reviewing`}
          description={isRtl ? "تتم مراجعته الآن" : "Currently reviewed"}
        />

        <ApplicationCard
          label={isRtl ? "مختصر" : "Shortlisted"}
          value={counts.shortlisted ?? 0}
          href={`/${locale}/talent-dashboard/requests?status=shortlisted`}
          description={isRtl ? "ضمن القائمة المختصرة" : "On the shortlist"}
        />

        <ApplicationCard
          label={isRtl ? "مقبول" : "Accepted"}
          value={counts.accepted ?? 0}
          href={`/${locale}/talent-dashboard/requests?status=accepted`}
          description={isRtl ? "طلبات تم قبولها" : "Accepted applications"}
          highlighted
        />

        <ApplicationCard
          label={isRtl ? "مرفوض" : "Rejected"}
          value={counts.rejected ?? 0}
          href={`/${locale}/talent-dashboard/requests?status=rejected`}
          description={isRtl ? "طلبات لم تُقبل" : "Not selected"}
        />
      </div>
    </section>
  );
}
