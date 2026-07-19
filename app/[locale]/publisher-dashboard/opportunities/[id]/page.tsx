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

type LocalizedLabel = {
  ar: string;
  en: string;
};

const OPPORTUNITY_TYPE_LABELS: Record<string, LocalizedLabel> = {
  model: { ar: "مودل", en: "Model" },
  actor: { ar: "ممثل", en: "Actor" },
  actress: { ar: "ممثلة", en: "Actress" },
  presenter: { ar: "مقدم برامج", en: "Presenter" },
  host: { ar: "مقدم", en: "Host" },
  hostess: { ar: "مضيفة", en: "Hostess" },
  influencer: { ar: "صانع محتوى", en: "Influencer" },
  content_creator: { ar: "صانع محتوى", en: "Content Creator" },
  voice_actor: { ar: "مؤدي صوتي", en: "Voice Actor" },
  singer: { ar: "مغنٍ", en: "Singer" },
  dancer: { ar: "راقص", en: "Dancer" },
  extra: { ar: "كومبارس", en: "Extra" },
};

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replace(/\s+/g, "_");
}

function formatDate(value: unknown, locale: string) {
  if (!value) return "-";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const text = String(value).trim();

  if (!text || ["null", "undefined", "-", "—"].includes(text.toLowerCase())) {
    return "";
  }

  return text;
}

function getLocalizedValue(arValue: unknown, enValue: unknown, locale: string) {
  const ar = formatValue(arValue);
  const en = formatValue(enValue);

  return locale === "ar" ? ar || en || "-" : en || ar || "-";
}

function getOpportunityType(value: unknown, locale: string) {
  const original = formatValue(value);

  if (!original) return "-";

  const normalized = normalizeKey(original);
  const translated = OPPORTUNITY_TYPE_LABELS[normalized];

  if (translated) {
    return locale === "ar" ? translated.ar : translated.en;
  }

  return original.replaceAll("_", " ");
}

function getFieldLabel(value: unknown, locale: string) {
  const normalized = normalizeKey(value);

  const labels: Record<string, LocalizedLabel> = {
    any: { ar: "أي جنس", en: "Any" },
    male: { ar: "ذكر", en: "Male" },
    female: { ar: "أنثى", en: "Female" },
    full_time: { ar: "دوام كامل", en: "Full Time" },
    part_time: { ar: "دوام جزئي", en: "Part Time" },
    freelance: { ar: "عمل حر", en: "Freelance" },
    temporary: { ar: "مؤقت", en: "Temporary" },
    contract: { ar: "عقد", en: "Contract" },
  };

  const translated = labels[normalized];

  if (translated) {
    return locale === "ar" ? translated.ar : translated.en;
  }

  return formatValue(value) || "-";
}

function formatBudget(value: unknown, locale: string) {
  const raw = formatValue(value);

  if (!raw) return "-";

  const numeric = Number(raw.replaceAll(",", ""));

  if (!Number.isFinite(numeric)) {
    return raw;
  }

  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    { maximumFractionDigits: 0 },
  ).format(numeric);

  return locale === "ar" ? `${formatted} ر.س` : `SAR ${formatted}`;
}

function opportunityStatusLabel(status: string | null, isRtl: boolean) {
  switch (status) {
    case "draft":
      return isRtl ? "مسودة" : "Draft";
    case "pending_review":
      return isRtl ? "قيد المراجعة" : "Pending Review";
    case "open":
      return isRtl ? "مفتوحة" : "Open";
    case "published":
      return isRtl ? "منشورة" : "Published";
    case "closed":
      return isRtl ? "مغلقة" : "Closed";
    case "archived":
      return isRtl ? "مؤرشفة" : "Archived";
    case "rejected":
      return isRtl ? "مرفوضة" : "Rejected";
    default:
      return isRtl ? "غير محددة" : "Not specified";
  }
}

function applicationStatusLabel(status: string | null, isRtl: boolean) {
  switch (status) {
    case "pending":
      return isRtl ? "جديد" : "Pending";
    case "reviewing":
      return isRtl ? "قيد المراجعة" : "Reviewing";
    case "shortlisted":
      return isRtl ? "مرشح" : "Shortlisted";
    case "accepted":
      return isRtl ? "مقبول" : "Accepted";
    case "rejected":
      return isRtl ? "مرفوض" : "Rejected";
    default:
      return isRtl ? "جديد" : "Pending";
  }
}

function statusClass(status: string | null) {
  switch (status) {
    case "open":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "published":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "pending_review":
    case "reviewing":
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
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

function countApplicationsByStatus(
  applications: Array<{ status?: string | null }>,
  status: string,
) {
  return applications.filter((application) => application.status === status)
    .length;
}

export default async function OpportunityDetailsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const opportunityId = Number(id);

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
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

          <Link
            href={`/${locale}/publisher-dashboard/opportunities`}
            className="mt-6 inline-flex rounded-full border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
          </Link>
        </div>
      </PublisherShell>
    );
  }

  const { data: applicationsData, error: applicationsError } = await adminClient
    .from("opportunity_applications")
    .select("id, status, created_at, talent_id")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Opportunity applications error:", {
      message: applicationsError.message,
      details: applicationsError.details,
      hint: applicationsError.hint,
      code: applicationsError.code,
    });
  }

  const talentIds = Array.from(
    new Set(
      (applicationsData ?? [])
        .map((application) => application.talent_id)
        .filter((talentId): talentId is number => typeof talentId === "number"),
    ),
  );

  const { data: talentsData, error: talentsError } =
    talentIds.length > 0
      ? await adminClient
          .from("talents")
          .select(
            `
            id,
            slug,
            name_en,
            name_ar,
            image_url,
            category_en,
            category_ar,
            city_en,
            city_ar,
            skills
          `,
          )
          .in("id", talentIds)
      : {
          data: [],
          error: null,
        };

  if (talentsError) {
    console.error("Opportunity talents error:", {
      message: talentsError.message,
      details: talentsError.details,
      hint: talentsError.hint,
      code: talentsError.code,
    });
  }

  const talentsById = new Map(
    (talentsData ?? []).map((talent) => [talent.id, talent]),
  );

  const applications = (applicationsData ?? []).map((application) => ({
    ...application,
    talents: talentsById.get(application.talent_id) ?? null,
  }));

  const rankedApplications = applications
    .map((application: any) => {
      const talent = Array.isArray(application.talents)
        ? application.talents[0]
        : application.talents;

      let score = calculateApplicantScore(talent);

      if (Array.isArray(talent?.skills) && Array.isArray(opportunity.skills)) {
        const opportunitySkills = opportunity.skills.map(normalizeKey);

        const matchCount = talent.skills.filter((skill: string) =>
          opportunitySkills.includes(normalizeKey(skill)),
        ).length;

        const total = opportunitySkills.length || 1;
        score += (matchCount / total) * 20;
      }

      return {
        ...application,
        talents: talent,
        score: Math.min(Math.max(score, 0), 100),
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  const totalApplications = applications.length;
  const shortlistedCount = countApplicationsByStatus(
    applications,
    "shortlisted",
  );
  const acceptedCount = countApplicationsByStatus(applications, "accepted");
  const rejectedCount = countApplicationsByStatus(applications, "rejected");

  const city = getLocalizedValue(
    opportunity.city_ar,
    opportunity.city_en,
    locale,
  );

  const opportunityType = getOpportunityType(
    opportunity.opportunity_type,
    locale,
  );

  const detailItems = [
    {
      label: isRtl ? "تاريخ الإنشاء" : "Created",
      value: formatDate(opportunity.created_at, locale),
    },
    {
      label: isRtl ? "تاريخ المشروع" : "Project Date",
      value: formatDate(
        opportunity.project_date ??
          opportunity.event_date ??
          opportunity.start_date,
        locale,
      ),
    },
    {
      label: isRtl ? "الميزانية" : "Budget",
      value: formatBudget(
        opportunity.budget ??
          opportunity.estimated_budget ??
          opportunity.compensation,
        locale,
      ),
    },
    {
      label: isRtl ? "نوع العقد" : "Contract Type",
      value: getFieldLabel(
        opportunity.contract_type ??
          opportunity.employment_type ??
          opportunity.engagement_type,
        locale,
      ),
    },
    {
      label: isRtl ? "الفئة العمرية" : "Age Range",
      value:
        formatValue(
          opportunity.age_range ??
            opportunity.age_group ??
            opportunity.target_age,
        ) || "-",
    },
    {
      label: isRtl ? "الجنس المطلوب" : "Preferred Gender",
      value: getFieldLabel(
        opportunity.gender ??
          opportunity.required_gender ??
          opportunity.target_gender,
        locale,
      ),
    },
  ];

  const localizedDescription = getLocalizedValue(
    opportunity.description_ar,
    opportunity.description_en,
    locale,
  );

  const description =
    localizedDescription !== "-"
      ? localizedDescription
      : formatValue(opportunity.description);

  const localizedRequirements = getLocalizedValue(
    opportunity.requirements_ar,
    opportunity.requirements_en,
    locale,
  );

  const requirements =
    localizedRequirements !== "-"
      ? localizedRequirements
      : formatValue(opportunity.requirements);

  const skills = Array.isArray(opportunity.skills)
    ? opportunity.skills.filter(Boolean)
    : [];

  const canClose =
    opportunity.status === "open" || opportunity.status === "published";

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <header className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-6 sm:p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1fr_320px] xl:items-start">
            <div>
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

              {description ? (
                <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-8 text-white/50">
                  {description}
                </p>
              ) : (
                <p className="mt-4 text-sm text-white/30">
                  {isRtl
                    ? "لم تتم إضافة نبذة لهذه الفرصة."
                    : "No description has been added yet."}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                    opportunity.status,
                  )}`}
                >
                  {opportunityStatusLabel(opportunity.status, isRtl)}
                </span>

                <Link
                  href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`}
                  className="rounded-full border border-blue-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-blue-300 transition hover:bg-blue-400 hover:text-black"
                >
                  {isRtl ? "تعديل" : "Edit"}
                </Link>

                {canClose ? (
                  <form
                    action={closeOpportunityAction.bind(null, opportunity.id)}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-yellow-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-yellow-300 transition hover:bg-yellow-400 hover:text-black"
                    >
                      {isRtl ? "إغلاق" : "Close"}
                    </button>
                  </form>
                ) : null}

                {opportunity.status !== "archived" ? (
                  <form
                    action={archiveOpportunityAction.bind(null, opportunity.id)}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-red-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-red-300 transition hover:bg-red-400 hover:text-black"
                    >
                      {isRtl ? "أرشفة" : "Archive"}
                    </button>
                  </form>
                ) : (
                  <form
                    action={restoreOpportunityAction.bind(null, opportunity.id)}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-emerald-400/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black"
                    >
                      {isRtl ? "استعادة" : "Restore"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <aside className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <HeroInfo
                label={isRtl ? "رقم الفرصة" : "Opportunity ID"}
                value={`#${opportunity.id}`}
              />
              <HeroInfo label={isRtl ? "المدينة" : "City"} value={city} />
              <HeroInfo
                label={isRtl ? "نوع الفرصة" : "Opportunity Type"}
                value={opportunityType}
              />
            </aside>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            label={isRtl ? "إجمالي الطلبات" : "Applications"}
            value={totalApplications}
          />
          <InfoCard
            label={isRtl ? "المرشحون" : "Shortlisted"}
            value={shortlistedCount}
          />
          <InfoCard
            label={isRtl ? "المقبولون" : "Accepted"}
            value={acceptedCount}
          />
          <InfoCard
            label={isRtl ? "المرفوضون" : "Rejected"}
            value={rejectedCount}
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "بيانات الفرصة" : "Opportunity Information"}
            </p>

            <h2 className="mt-3 text-3xl font-light text-white">
              {isRtl ? "التفاصيل والمتطلبات" : "Details and Requirements"}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {detailItems.map((item) => (
              <DetailItem
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>

          {(requirements || skills.length > 0) && (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {requirements ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold">
                    {isRtl ? "المتطلبات" : "Requirements"}
                  </p>

                  <p className="mt-4 whitespace-pre-line text-sm leading-8 text-white/55">
                    {requirements}
                  </p>
                </div>
              ) : null}

              {skills.length > 0 ? (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-gold">
                    {isRtl ? "المهارات المطلوبة" : "Required Skills"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map((skill: string, index: number) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gold">
                {isRtl ? "المتقدمون" : "Applicants"}
              </p>

              <h2 className="mt-3 text-3xl font-light text-white">
                {isRtl ? "ترتيب المتقدمين" : "Ranked Applicants"}
              </h2>
            </div>

            {rankedApplications.length > 0 ? (
              <Link
                href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/applicants`}
                className="inline-flex rounded-full border border-gold/35 bg-gold/[0.05] px-5 py-3 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "إدارة جميع الطلبات ←" : "Manage All Applications →"}
              </Link>
            ) : null}
          </div>

          {rankedApplications.length > 0 ? (
            <div className="divide-y divide-white/10 overflow-hidden rounded-[1.5rem] border border-white/10">
              {rankedApplications.map((application: any) => {
                const talent = application.talents;
                const score = Number(application.score ?? 0);
                const isHighMatch = score >= 80;
                const isGoodMatch = score >= 60 && score < 80;

                return (
                  <article
                    key={application.id}
                    className={`grid gap-5 p-5 transition hover:bg-gold/[0.035] lg:grid-cols-[2fr_0.7fr_0.8fr] lg:items-center ${
                      isHighMatch ? "bg-gold/[0.04]" : "bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {talent?.image_url ? (
                        <img
                          src={talent.image_url}
                          alt={
                            talent?.name_en ??
                            talent?.name_ar ??
                            (isRtl ? "موهبة" : "Talent")
                          }
                          className="h-14 w-14 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
                          ?
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-lg font-light text-white">
                          <span className="truncate">
                            {isRtl
                              ? (talent?.name_ar ?? talent?.name_en ?? "موهبة")
                              : (talent?.name_en ??
                                talent?.name_ar ??
                                "Talent")}
                          </span>

                          {isHighMatch ? (
                            <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gold">
                              {isRtl ? "تطابق مرتفع" : "Top Match"}
                            </span>
                          ) : isGoodMatch ? (
                            <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-blue-300">
                              {isRtl ? "تطابق جيد" : "Good Match"}
                            </span>
                          ) : null}
                        </p>

                        <p className="mt-1 text-xs text-white/45">
                          {isRtl
                            ? `${talent?.category_ar ?? "-"} • ${
                                talent?.city_ar ?? "-"
                              }`
                            : `${talent?.category_en ?? "-"} • ${
                                talent?.city_en ?? "-"
                              }`}
                        </p>

                        <div className="mt-3">
                          <TalentPreviewModal talent={talent} locale={locale} isRtl={isRtl} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                          application.status ?? "pending",
                        )}`}
                      >
                        {applicationStatusLabel(
                          application.status ?? "pending",
                          isRtl,
                        )}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-white/40">
                        {isRtl ? "نسبة الملاءمة" : "Match Score"}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="min-w-8 text-lg text-gold">
                          {score.toFixed(0)}
                        </span>

                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gold"
                            style={{
                              width: `${score}%`,
                            }}
                          />
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-white/30">
                        {isRtl ? "تقدم في" : "Applied"}{" "}
                        {formatDate(application.created_at, locale)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-10 text-center">
              <p className="text-lg font-light text-white">
                {isRtl ? "لا يوجد متقدمون حتى الآن" : "No applicants yet"}
              </p>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/40">
                {isRtl
                  ? "ستظهر طلبات المواهب هنا فور التقديم على الفرصة."
                  : "Talent applications will appear here as soon as candidates apply."}
              </p>

              <Link
                href={`/${locale}/publisher-dashboard/opportunities`}
                className="mt-6 inline-flex rounded-full border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "العودة إلى إدارة الفرص" : "Back to Opportunities"}
              </Link>
            </div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}

function HeroInfo({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-lg font-light text-white">{value}</p>
    </div>
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

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-5">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-lg font-light text-white">{value}</p>
    </div>
  );
}
