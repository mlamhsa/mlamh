import Link from "next/link";
import PublisherShell from "@/components/publisher/PublisherShell";
import TalentPreviewModal from "@/components/publisher/TalentPreviewModal";
import {
  archiveOpportunityAction,
  closeOpportunityAction,
  restoreOpportunityAction,
} from "@/lib/actions/opportunity-status-actions";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function statusLabel(status: string | null, isRtl: boolean) {
  switch (status) {
    case "draft":
      return isRtl ? "مسودة" : "Draft";
    case "open":
      return isRtl ? "مفتوحة" : "Open";
    case "published":
      return isRtl ? "منشورة" : "Published";
    case "closed":
      return isRtl ? "مغلقة" : "Closed";
    case "archived":
      return isRtl ? "مؤرشفة" : "Archived";
    case "pending":
      return isRtl ? "جديد" : "Pending";
    case "reviewing":
      return isRtl ? "قيد المراجعة" : "Reviewing";
    case "shortlisted":
      return isRtl ? "مختصر" : "Shortlisted";
    case "accepted":
      return isRtl ? "مقبول" : "Accepted";
    case "rejected":
      return isRtl ? "مرفوض" : "Rejected";
    default:
      return "-";
  }
}

function statusClass(status: string | null) {
  switch (status) {
    case "open":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "published":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "closed":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "archived":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    case "shortlisted":
      return "border-gold/40 bg-gold/10 text-gold";
    case "accepted":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-red-400/40 bg-red-400/10 text-red-300";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}

function calculateApplicantScore(talent: any) {
  let score = 0;

  score += (talent?.profile_completion || 0) * 0.4;
  score += Math.min((talent?.profile_views || 0) / 10, 20);
  score += (talent?.experience_years || 0) * 3;

  if (talent?.featured) score += 15;

  return score;
}

export default async function OpportunityDetailsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const opportunityId = Number(id);

  if (!Number.isFinite(opportunityId)) {
    return (
      <PublisherShell locale={locale} isRtl={isRtl}>
        <div className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.04] p-8 text-red-200">
          {isRtl ? "رابط الفرصة غير صحيح." : "Invalid opportunity link."}
        </div>
      </PublisherShell>
    );
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (opportunityError) {
    console.error("Opportunity details error:", opportunityError);
  }

  if (!opportunity) {
    return (
      <PublisherShell locale={locale} isRtl={isRtl}>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
          <h1 className="text-4xl font-light text-white">
            {isRtl ? "الفرصة غير موجودة" : "Opportunity not found"}
          </h1>
        </div>
      </PublisherShell>
    );
  }

  const { data: applications, error: applicationsError } = await adminClient
    .from("opportunity_applications")
    .select(`
      id,
      status,
      created_at,
      talent_id,
      talents:talent_id (
        id,
        slug,
        name_en,
        name_ar,
        image_url,
        category_en,
        category_ar,
        city_en,
        city_ar,
        profile_completion,
        profile_views,
        experience_years,
        featured,
        skills
      )
    `)
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Opportunity applications error:", applicationsError);
  }

  const rankedApplications = (applications ?? [])
    .map((app: any) => {
      const talent = Array.isArray(app.talents) ? app.talents[0] : app.talents;
      let score = calculateApplicantScore(talent);

      if (Array.isArray(talent?.skills) && Array.isArray(opportunity.skills)) {
        const matchCount = talent.skills.filter((skill: string) =>
          opportunity.skills.includes(skill)
        ).length;

        const total = opportunity.skills.length || 1;
        score += (matchCount / total) * 20;
      }

      return {
        ...app,
        talents: talent,
        score,
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <header className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-8 md:p-10">
          <Link
            href={`/${locale}/publisher-dashboard/opportunities`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isRtl ? "← العودة إلى الفرص" : "← Back to Opportunities"}
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
          </p>

          <h1 className="mt-4 text-4xl font-light text-white md:text-6xl">
            {opportunity.title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">
            {opportunity.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                opportunity.status
              )}`}
            >
              {statusLabel(opportunity.status, isRtl)}
            </span>

            <Link
              href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`}
              className="rounded-full border border-blue-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-blue-300 transition hover:bg-blue-400 hover:text-black"
            >
              {isRtl ? "تعديل" : "Edit"}
            </Link>

            {opportunity.status === "open" ? (
              <form action={closeOpportunityAction.bind(null, opportunity.id)}>
                <button className="rounded-full border border-yellow-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-yellow-300 transition hover:bg-yellow-400 hover:text-black">
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </form>
            ) : null}

            {opportunity.status !== "archived" ? (
              <form action={archiveOpportunityAction.bind(null, opportunity.id)}>
                <button className="rounded-full border border-red-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-400 hover:text-black">
                  {isRtl ? "أرشفة" : "Archive"}
                </button>
              </form>
            ) : (
              <form action={restoreOpportunityAction.bind(null, opportunity.id)}>
                <button className="rounded-full border border-emerald-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black">
                  {isRtl ? "استعادة" : "Restore"}
                </button>
              </form>
            )}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            label={isRtl ? "عدد المتقدمين" : "Applicants"}
            value={rankedApplications.length}
          />
          <InfoCard
            label={isRtl ? "المدينة" : "City"}
            value={isRtl ? opportunity.city_ar ?? "-" : opportunity.city_en ?? "-"}
          />
          <InfoCard
            label={isRtl ? "النوع" : "Type"}
            value={String(opportunity.opportunity_type ?? "-").replaceAll("_", " ")}
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold">
                {isRtl ? "المتقدمون" : "Applicants"}
              </p>

              <h2 className="mt-3 text-3xl font-light text-white">
                {isRtl ? "ترتيب المتقدمين" : "Ranked Applicants"}
              </h2>
            </div>
          </div>

          {rankedApplications.length > 0 ? (
            <div className="divide-y divide-white/10 overflow-hidden rounded-[1.5rem] border border-white/10">
              {rankedApplications.map((app: any, index: number) => {
                const talent = app.talents;
                const isTop = index < 3;

                return (
                  <article
                    key={app.id}
                    className={`grid gap-5 p-5 transition hover:bg-white/[0.03] lg:grid-cols-[2fr_0.7fr_0.7fr] lg:items-center ${
                      isTop ? "bg-gold/[0.04]" : "bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {talent?.image_url ? (
                        <img
                          src={talent.image_url}
                          alt={talent?.name_en ?? "Talent"}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-gold">
                          ?
                        </div>
                      )}

                      <div>
                        <p className="flex flex-wrap items-center gap-2 text-lg font-light text-white">
                          {isRtl
                            ? talent?.name_ar ?? talent?.name_en ?? "موهبة"
                            : talent?.name_en ?? talent?.name_ar ?? "Talent"}

                          {isTop ? (
                            <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gold">
                              Top Match
                            </span>
                          ) : null}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                          {isRtl
                            ? `${talent?.category_ar ?? "-"} • ${talent?.city_ar ?? "-"}`
                            : `${talent?.category_en ?? "-"} • ${talent?.city_en ?? "-"}`}
                        </p>

                        <div className="mt-3">
                          <TalentPreviewModal talent={talent} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                          app.status ?? "pending"
                        )}`}
                      >
                        {statusLabel(app.status ?? "pending", isRtl)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-white/40">
                        {isRtl ? "نسبة الملاءمة" : "Match Score"}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg text-gold">
                          {app.score?.toFixed(0)}
                        </span>

                        <div className="h-2 w-24 rounded-full bg-white/10">
                          <div
                            className="h-2 rounded-full bg-gold"
                            style={{
                              width: `${Math.min(app.score || 0, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-10 text-center text-white/40">
              {isRtl ? "لا يوجد متقدمون بعد." : "No applicants yet."}
            </div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-3xl font-light text-white">{value}</p>
    </div>
  );
}