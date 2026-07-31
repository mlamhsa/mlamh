import Link from "next/link";
import { updateApplicationStatusAction } from "@/lib/actions/application-status-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import Image from "next/image";
import { requirePublisher } from "@/lib/auth/require-publisher";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const PIPELINE = [
  { key: "pending", ar: "جديد", en: "New" },
  { key: "reviewing", ar: "قيد المراجعة", en: "Reviewing" },
  { key: "shortlisted", ar: "مختصر", en: "Shortlisted" },
  { key: "accepted", ar: "مقبول", en: "Accepted" },
  { key: "rejected", ar: "مرفوض", en: "Rejected" },
] as const;

type PipelineStatus = (typeof PIPELINE)[number]["key"];

function normalizeStatus(status?: string | null): PipelineStatus {
  if (
    status === "reviewing" ||
    status === "shortlisted" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    return status;
  }

  return "pending";
}

function getTalentName(talent: any, locale: string) {
  return locale === "ar"
    ? talent?.name_ar ?? talent?.name_en ?? "موهبة"
    : talent?.name_en ?? talent?.name_ar ?? "Talent";
}

function getTalentCity(talent: any, locale: string) {
  return locale === "ar"
    ? talent?.city_ar ?? talent?.city_en ?? "-"
    : talent?.city_en ?? talent?.city_ar ?? "-";
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function ApplicationStatusForm({
  applicationId,
  status,
  label,
  className,
}: {
  applicationId: string | number;
  status: PipelineStatus;
  label: string;
  className: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await updateApplicationStatusAction(applicationId, status);
      }}
    >
      <button
        type="submit"
        className={`w-full rounded-xl border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${className}`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function PublisherApplicantsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: opportunities, error: opportunitiesError } = await adminClient
    .from("opportunities")
    .select("id, title")
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false });

  if (opportunitiesError) {
    console.error("Publisher applicants opportunities error:", opportunitiesError);
  }

  const opportunityIds = (opportunities ?? []).map((item) => item.id);

  const { data: applications, error: applicationsError } =
    opportunityIds.length > 0
      ? await adminClient
          .from("opportunity_applications")
          .select(
            `
            id,
            status,
            created_at,
            opportunity_id,
            talent_id,
            opportunities (
              id,
              title
            ),
            talents (
              id,
              slug,
              name_ar,
              name_en,
              image_url,
              city_ar,
              city_en
            )
          `
          )
          .in("opportunity_id", opportunityIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (applicationsError) {
    console.error("Publisher applicants applications error:", applicationsError);
  }

  const allApplications = applications ?? [];

  const totalApplications = allApplications.length;
  const acceptedCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "accepted"
  ).length;
  const rejectedCount = allApplications.filter(
    (item: any) => normalizeStatus(item.status) === "rejected"
  ).length;
  const activeReviewCount = allApplications.filter((item: any) =>
    ["pending", "reviewing", "shortlisted"].includes(normalizeStatus(item.status))
  ).length;

  return (
      <div className="space-y-8">
        <header className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "نظام المتقدمين" : "Applicant Pipeline"}
          </p>

          <h1 className="mt-4 text-4xl font-light leading-tight text-white md:text-6xl">
            {isRtl ? "إدارة المتقدمين" : "Manage Applicants"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
            {isRtl
              ? "راجع المتقدمين، غيّر حالاتهم، وأنشئ قائمة مختصرة للمرشحين المناسبين."
              : "Review applicants, update their status, and build a shortlist for each opportunity."}
          </p>

          <div className="mt-8">
            <Link
              href={`/${locale}/publisher-dashboard/opportunities`}
              className="inline-flex rounded-full border border-gold/40 bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "إدارة الفرص" : "Manage Opportunities"}
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            label={isRtl ? "إجمالي الطلبات" : "Total Applications"}
            value={totalApplications}
            highlighted
          />
          <StatCard
            label={isRtl ? "قيد العمل" : "Active Review"}
            value={activeReviewCount}
          />
          <StatCard
            label={isRtl ? "مقبول" : "Accepted"}
            value={acceptedCount}
          />
          <StatCard
            label={isRtl ? "مرفوض" : "Rejected"}
            value={rejectedCount}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-5">
          {PIPELINE.map((stage) => {
            const stageApplications = allApplications.filter(
              (item: any) => normalizeStatus(item.status) === stage.key
            );

            return (
              <div
                key={stage.key}
                className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-light text-white">
                    {isRtl ? stage.ar : stage.en}
                  </h2>

                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
                    {stageApplications.length}
                  </span>
                </div>

                <div className="grid gap-3">
                  {stageApplications.length > 0 ? (
                    stageApplications.map((application: any) => {
                      const talent = Array.isArray(application.talents)
                        ? application.talents[0]
                        : application.talents;

                      const opportunity = Array.isArray(application.opportunities)
                        ? application.opportunities[0]
                        : application.opportunities;

                      return (
                        <article
                          key={application.id}
                          className="rounded-[1.25rem] border border-white/10 bg-black/30 p-4"
                        >
                          <div className="flex items-center gap-3">
                            {talent?.image_url ? (
                              <Image
                              src={talent.image_url}
                              alt={getTalentName(talent, locale)}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm text-gold">
                                {getTalentName(talent, locale).slice(0, 1)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <h3 className="truncate text-sm text-white">
                                {getTalentName(talent, locale)}
                              </h3>

                              <p className="mt-1 truncate text-xs text-white/40">
                                {getTalentCity(talent, locale)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-white/10 pt-4">
                            <p className="text-xs text-white/35">
                              {isRtl ? "الفرصة" : "Opportunity"}
                            </p>

                            <p className="mt-1 line-clamp-2 text-sm text-white/70">
                              {opportunity?.title ?? "-"}
                            </p>

                            <p className="mt-3 text-xs text-white/30">
                              {formatDate(application.created_at, locale)}
                            </p>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {talent?.slug || talent?.id ? (
                              <Link
                                href={`/${locale}/talent/${talent.slug ?? talent.id}`}
                                className="rounded-xl border border-white/10 px-3 py-2 text-center text-xs uppercase tracking-[0.18em] text-white/55 transition hover:border-gold/50 hover:text-gold"
                              >
                                {isRtl ? "عرض الملف" : "View Profile"}
                              </Link>
                            ) : null}

                            {opportunity?.id ? (
                              <Link
                                href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/applicants`}
                                className="rounded-xl border border-gold/30 px-3 py-2 text-center text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
                              >
                                {isRtl ? "فتح طلبات الفرصة" : "Open Opportunity"}
                              </Link>
                            ) : null}

                            {stage.key !== "reviewing" && (
                              <ApplicationStatusForm
                                applicationId={application.id}
                                status="reviewing"
                                label={isRtl ? "مراجعة" : "Review"}
                                className="border-white/10 text-white/55 hover:border-white hover:text-white"
                              />
                            )}

                            {stage.key !== "shortlisted" && (
                              <ApplicationStatusForm
                                applicationId={application.id}
                                status="shortlisted"
                                label={isRtl ? "اختصار" : "Shortlist"}
                                className="border-blue-400/30 text-blue-300 hover:bg-blue-400 hover:text-black"
                              />
                            )}

                            {stage.key !== "accepted" && (
                              <ApplicationStatusForm
                                applicationId={application.id}
                                status="accepted"
                                label={isRtl ? "قبول" : "Accept"}
                                className="border-emerald-400/30 text-emerald-300 hover:bg-emerald-400 hover:text-black"
                              />
                            )}

                            {stage.key !== "rejected" && (
                              <ApplicationStatusForm
                                applicationId={application.id}
                                status="rejected"
                                label={isRtl ? "رفض" : "Reject"}
                                className="border-red-400/30 text-red-300 hover:bg-red-400 hover:text-black"
                              />
                            )}
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.25rem] border border-dashed border-white/10 p-6 text-center text-xs text-white/30">
                      {isRtl ? "لا يوجد متقدمون" : "No applicants"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 ${
        highlighted
          ? "border-gold/20 bg-gold/[0.04]"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>

      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}