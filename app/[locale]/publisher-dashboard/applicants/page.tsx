import Image from "next/image";
import Link from "next/link";

import { updateApplicationStatusAction } from "@/lib/actions/application-status-actions";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    q?: string;
    opportunity?: string;
    status?: string;
    page?: string;
  }>;
};

type FilterStatus = "all" | "pending" | "accepted" | "rejected";

type ApplicantTalent = {
  id: string | number;
  slug: string | null;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  city_ar: string | null;
  city_en: string | null;
};

type ApplicantOpportunity = {
  id: string | number;
  title: string | null;
};

type PublisherApplication = {
  id: string | number;
  status: string | null;
  created_at: string | null;
  opportunity_id: string | number;
  talent_id: string | number;
  opportunities:
    | ApplicantOpportunity
    | ApplicantOpportunity[]
    | null;
  talents:
    | ApplicantTalent
    | ApplicantTalent[]
    | null;
};

const PAGE_SIZE = 20;

function normalizeDisplayStatus(
  status?: string | null,
): Exclude<FilterStatus, "all"> {
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "rejected";

  // Old reviewing / shortlisted test data is treated as pending in the MVP UI.
  return "pending";
}

function getTalentName(
  talent: ApplicantTalent | null | undefined,
  locale: string,
) {
  return locale === "ar"
    ? talent?.name_ar ?? talent?.name_en ?? "موهبة"
    : talent?.name_en ?? talent?.name_ar ?? "Talent";
}

function getTalentCity(
  talent: ApplicantTalent | null | undefined,
  locale: string,
) {
  return locale === "ar"
    ? talent?.city_ar ?? talent?.city_en ?? "-"
    : talent?.city_en ?? talent?.city_ar ?? "-";
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(new Date(value));
}

function getSingleTalent(application: PublisherApplication) {
  return Array.isArray(application.talents)
    ? application.talents[0]
    : application.talents;
}

function getSingleOpportunity(
  application: PublisherApplication,
) {
  return Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;
}

function buildPageHref({
  locale,
  q,
  opportunity,
  status,
  page,
}: {
  locale: string;
  q: string;
  opportunity: string;
  status: FilterStatus;
  page: number;
}) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (opportunity !== "all") {
    params.set("opportunity", opportunity);
  }
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return `/${locale}/publisher-dashboard/applicants${
    query ? `?${query}` : ""
  }`;
}

function ApplicationStatusForm({
  applicationId,
  status,
  label,
  className,
}: {
  applicationId: string | number;
  status: "accepted" | "rejected";
  label: string;
  className: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await updateApplicationStatusAction(
          applicationId,
          status,
        );
      }}
      className="flex-1"
    >
      <button
        type="submit"
        className={`min-h-11 w-full rounded-xl border px-4 py-2.5 text-xs font-medium transition active:scale-[0.98] ${className}`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function PublisherApplicantsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const isRtl = locale === "ar";

  const q = resolvedSearchParams.q?.trim() ?? "";
  const opportunityFilter =
    resolvedSearchParams.opportunity?.trim() || "all";

  const requestedStatus = resolvedSearchParams.status;
  const statusFilter: FilterStatus =
    requestedStatus === "pending" ||
    requestedStatus === "accepted" ||
    requestedStatus === "rejected"
      ? requestedStatus
      : "all";

  const requestedPage = Number.parseInt(
    resolvedSearchParams.page ?? "1",
    10,
  );
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: opportunities, error: opportunitiesError } =
    await adminClient
      .from("opportunities")
      .select("id, title")
      .eq("publisher_id", publisher.id)
      .order("created_at", { ascending: false });

  if (opportunitiesError) {
    console.error(
      "Publisher applicants opportunities error:",
      opportunitiesError,
    );
  }

  const opportunityIds = (opportunities ?? []).map(
    (item) => item.id,
  );

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
          `,
          )
          .in("opportunity_id", opportunityIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (applicationsError) {
    console.error(
      "Publisher applicants applications error:",
      applicationsError,
    );
  }

  const allApplications =
    (applications ?? []) as PublisherApplication[];

    const acceptedApplicationIds = allApplications
  .filter(
    (application) =>
      normalizeDisplayStatus(application.status) === "accepted",
  )
  .map((application) => application.id);

const { data: conversations, error: conversationsError } =
  acceptedApplicationIds.length > 0
    ? await adminClient
        .from("conversations")
        .select("id, application_id")
        .in("application_id", acceptedApplicationIds)
    : { data: [], error: null };

if (conversationsError) {
  console.error(
    "Publisher applicants conversations error:",
    conversationsError,
  );
}

const conversationIdByApplication = new Map<
  string,
  string | number
>(
  (conversations ?? []).map((conversation) => [
    String(conversation.application_id),
    conversation.id,
  ]),
);

  const counts = {
    total: allApplications.length,
    pending: allApplications.filter(
      (item) =>
        normalizeDisplayStatus(item.status) === "pending",
    ).length,
    accepted: allApplications.filter(
      (item) =>
        normalizeDisplayStatus(item.status) === "accepted",
    ).length,
    rejected: allApplications.filter(
      (item) =>
        normalizeDisplayStatus(item.status) === "rejected",
    ).length,
  };

  const normalizedQuery = q.toLocaleLowerCase(
    locale === "ar" ? "ar" : "en",
  );

  const filteredApplications = allApplications.filter(
    (application) => {
      const talent = getSingleTalent(application);
      const opportunity = getSingleOpportunity(application);
      const displayStatus = normalizeDisplayStatus(
        application.status,
      );

      const matchesStatus =
        statusFilter === "all" ||
        displayStatus === statusFilter;

      const matchesOpportunity =
        opportunityFilter === "all" ||
        String(application.opportunity_id) ===
          opportunityFilter;

      const searchableText = [
        talent?.name_ar,
        talent?.name_en,
        talent?.city_ar,
        talent?.city_en,
        opportunity?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(locale === "ar" ? "ar" : "en");

      const matchesQuery =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      return (
        matchesStatus &&
        matchesOpportunity &&
        matchesQuery
      );
    },
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleApplications = filteredApplications.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-6 sm:p-8 md:p-10">
        <p className="text-xs text-gold">
          {isRtl ? "نظام المتقدمين" : "Applicants"}
        </p>

        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-light leading-tight text-white sm:text-4xl md:text-6xl">
              {isRtl
                ? "إدارة المتقدمين"
                : "Manage Applicants"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
              {isRtl
                ? "ابحث عن المتقدم المناسب، راجع ملفه، ثم اتخذ قرار القبول أو الرفض مباشرة."
                : "Find the right applicant, review their profile, then accept or reject directly."}
            </p>
          </div>

          <Link
            href={`/${locale}/publisher-dashboard/opportunities`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/40 bg-gold/10 px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "إدارة الفرص" : "Manage Opportunities"}
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatLink
          href={buildPageHref({
            locale,
            q: "",
            opportunity: "all",
            status: "all",
            page: 1,
          })}
          label={
            isRtl ? "إجمالي الطلبات" : "Total Applications"
          }
          value={counts.total}
          active={statusFilter === "all"}
        />

        <StatLink
          href={buildPageHref({
            locale,
            q: "",
            opportunity: "all",
            status: "pending",
            page: 1,
          })}
          label={isRtl ? "جديد" : "New"}
          value={counts.pending}
          active={statusFilter === "pending"}
        />

        <StatLink
          href={buildPageHref({
            locale,
            q: "",
            opportunity: "all",
            status: "accepted",
            page: 1,
          })}
          label={isRtl ? "مقبول" : "Accepted"}
          value={counts.accepted}
          active={statusFilter === "accepted"}
        />

        <StatLink
          href={buildPageHref({
            locale,
            q: "",
            opportunity: "all",
            status: "rejected",
            page: 1,
          })}
          label={isRtl ? "مرفوض" : "Rejected"}
          value={counts.rejected}
          active={statusFilter === "rejected"}
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <form
          method="get"
          className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(13rem,1fr)_minmax(11rem,0.7fr)_auto]"
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={
              isRtl
                ? "ابحث بالاسم أو المدينة أو الفرصة..."
                : "Search name, city, or opportunity..."
            }
            className="min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-gold/40"
          />

          <select
            name="opportunity"
            defaultValue={opportunityFilter}
            className="min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-gold/40"
          >
            <option value="all">
              {isRtl ? "كل الفرص" : "All opportunities"}
            </option>

            {(opportunities ?? []).map((opportunity) => (
              <option
                key={opportunity.id}
                value={String(opportunity.id)}
              >
                {opportunity.title ?? "-"}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={statusFilter}
            className="min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-gold/40"
          >
            <option value="all">
              {isRtl ? "كل الحالات" : "All statuses"}
            </option>
            <option value="pending">
              {isRtl ? "جديد" : "New"}
            </option>
            <option value="accepted">
              {isRtl ? "مقبول" : "Accepted"}
            </option>
            <option value="rejected">
              {isRtl ? "مرفوض" : "Rejected"}
            </option>
          </select>

          <button
            type="submit"
            className="min-h-12 rounded-xl bg-gold px-6 text-sm font-semibold text-black transition hover:bg-gold-soft active:scale-[0.98]"
          >
            {isRtl ? "تطبيق" : "Apply"}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025]">
        <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">
              {isRtl ? "قائمة المتقدمين" : "Applicant List"}
            </h2>
            <p className="mt-1 text-xs text-white/40">
              {isRtl
                ? `${filteredApplications.length} نتيجة`
                : `${filteredApplications.length} results`}
            </p>
          </div>

          {(q ||
            opportunityFilter !== "all" ||
            statusFilter !== "all") && (
            <Link
              href={`/${locale}/publisher-dashboard/applicants`}
              className="text-sm text-gold transition hover:text-gold-soft"
            >
              {isRtl ? "مسح الفلاتر" : "Clear filters"}
            </Link>
          )}
        </div>

        {visibleApplications.length > 0 ? (
          <div className="divide-y divide-white/10">
            {visibleApplications.map((application) => {
              const talent = getSingleTalent(application);
              const opportunity =
                getSingleOpportunity(application);
              const displayStatus = normalizeDisplayStatus(
                application.status,
              );
              const talentName = getTalentName(
                talent,
                locale,
              );

              const conversationId = conversationIdByApplication.get(
                String(application.id),
              );

              return (
                <article
                  key={application.id}
                  className="grid gap-4 p-5 transition hover:bg-white/[0.025] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gold/25 bg-gold/10">
                      {talent?.image_url ? (
                        <Image
                          src={talent.image_url}
                          alt={talentName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gold">
                          {talentName.slice(0, 1)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-medium text-white">
                        {talentName}
                      </h3>
                      <p className="mt-1 truncate text-sm text-white/45">
                        {getTalentCity(talent, locale)}
                      </p>
                      <p className="mt-1 text-xs text-white/30">
                        {formatDate(
                          application.created_at,
                          locale,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="text-xs text-white/35">
                      {isRtl ? "الفرصة" : "Opportunity"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-white/75">
                      {opportunity?.title ?? "-"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:min-w-[21rem]">
                    {talent?.slug || talent?.id ? (
                      <Link
                        href={`/${locale}/talent/${
                          talent.slug ?? talent.id
                        }`}
                        className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/65 transition hover:border-gold/40 hover:text-gold"
                      >
                        {isRtl ? "عرض الملف" : "View Profile"}
                      </Link>
                    ) : null}

{displayStatus === "pending" ? (
  <>
    <ApplicationStatusForm
      applicationId={application.id}
      status="accepted"
      label={isRtl ? "قبول" : "Accept"}
      className="border-emerald-400/35 text-emerald-300 hover:bg-emerald-400 hover:text-black"
    />

    <ApplicationStatusForm
      applicationId={application.id}
      status="rejected"
      label={isRtl ? "رفض" : "Reject"}
      className="border-red-400/35 text-red-300 hover:bg-red-400 hover:text-black"
    />
  </>
) : displayStatus === "accepted" ? (
  <>
    <StatusBadge
      status="accepted"
      isRtl={isRtl}
    />

    {conversationId ? (
  <Link
    href={`/${locale}/publisher-dashboard/messages/${conversationId}`}
    className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 px-4 text-xs text-gold transition hover:bg-gold hover:text-black"
  >
    {isRtl ? "تواصل" : "Message"}
  </Link>
) : (
  <span className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/35">
    {isRtl ? "المحادثة غير جاهزة" : "Chat unavailable"}
  </span>
)}
  </>
) : (
  <StatusBadge
    status="rejected"
    isRtl={isRtl}
  />
)}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-white/40">
              {isRtl
                ? "لا توجد نتائج مطابقة."
                : "No matching applicants."}
            </p>
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <nav
          aria-label={
            isRtl ? "صفحات المتقدمين" : "Applicant pages"
          }
          className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4"
        >
          {safePage > 1 ? (
            <Link
              href={buildPageHref({
                locale,
                q,
                opportunity: opportunityFilter,
                status: statusFilter,
                page: safePage - 1,
              })}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:border-gold/40 hover:text-gold"
            >
              {isRtl ? "السابق" : "Previous"}
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-white/45">
            {isRtl
              ? `صفحة ${safePage} من ${totalPages}`
              : `Page ${safePage} of ${totalPages}`}
          </span>

          {safePage < totalPages ? (
            <Link
              href={buildPageHref({
                locale,
                q,
                opportunity: opportunityFilter,
                status: statusFilter,
                page: safePage + 1,
              })}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:border-gold/40 hover:text-gold"
            >
              {isRtl ? "التالي" : "Next"}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}

function StatLink({
  href,
  label,
  value,
  active = false,
}: {
  href: string;
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[1.5rem] border p-4 transition active:scale-[0.98] sm:p-5 ${
        active
          ? "border-gold/30 bg-gold/[0.07]"
          : "border-white/10 bg-white/[0.035] hover:border-gold/25 hover:bg-gold/[0.04]"
      }`}
    >
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-light text-white sm:text-4xl">
        {value}
      </p>
    </Link>
  );
}

function StatusBadge({
  status,
  isRtl,
}: {
  status: "accepted" | "rejected";
  isRtl: boolean;
}) {
  const accepted = status === "accepted";

  return (
    <div
      className={`flex min-h-11 flex-1 items-center justify-center rounded-xl border px-4 text-xs font-medium ${
        accepted
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
          : "border-red-400/25 bg-red-400/10 text-red-300"
      }`}
    >
      {accepted
        ? isRtl
          ? "تم القبول"
          : "Accepted"
        : isRtl
          ? "تم الرفض"
          : "Rejected"}
    </div>
  );
}
