import Link from "next/link";
import Image from "next/image";

import TalentPreviewModal from "@/components/publisher/TalentPreviewModal";
import { updateApplicationStatusAction } from "@/lib/actions/application-status-actions";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

type ApplicationRow = {
  id: string | number;
  status: string | null;
  talent_id: number | string | null;
  created_at: string | null;
};

type TalentRow = {
  id: number | string;
  slug: string | null;
  name_en: string | null;
  name_ar: string | null;
  image_url: string | null;
  category_en: string | null;
  category_ar: string | null;
  city_en: string | null;
  city_ar: string | null;
  skills: string[] | null;
};

function normalizeSearchValue(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getTalentName(talent: TalentRow | null, isRtl: boolean) {
  if (!talent) {
    return isRtl ? "موهبة غير معروفة" : "Unknown Talent";
  }

  return isRtl
    ? talent.name_ar ?? talent.name_en ?? "موهبة"
    : talent.name_en ?? talent.name_ar ?? "Talent";
}

function getTalentCategory(talent: TalentRow | null, isRtl: boolean) {
  if (!talent) return "-";

  return isRtl
    ? talent.category_ar ?? talent.category_en ?? "-"
    : talent.category_en ?? talent.category_ar ?? "-";
}

function getTalentCity(talent: TalentRow | null, isRtl: boolean) {
  if (!talent) return "-";

  return isRtl
    ? talent.city_ar ?? talent.city_en ?? "-"
    : talent.city_en ?? talent.city_ar ?? "-";
}

function buildApplicantsHref({
  locale,
  opportunityId,
  status,
  query,
}: {
  locale: string;
  opportunityId: number;
  status?: string;
  query?: string;
}) {
  const params = new URLSearchParams();

  if (status && status !== "all") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  const suffix = params.toString();

  return suffix
    ? `/${locale}/publisher-dashboard/opportunities/${opportunityId}/applicants?${suffix}`
    : `/${locale}/publisher-dashboard/opportunities/${opportunityId}/applicants`;
}

export default async function ApplicantsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const filters = searchParams ? await searchParams : {};
  const selectedStatus = filters.status ?? "all";
  const searchQuery = String(filters.q ?? "").trim();
  const normalizedQuery = normalizeSearchValue(searchQuery);

  const opportunityId = Number(id);

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    return (
        <div className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.04] p-8 text-red-200">
          {isRtl ? "رابط الفرصة غير صحيح." : "Invalid opportunity link."}
        </div>
    );
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, title")
    .eq("id", opportunityId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (opportunityError) {
    console.error("Applicants opportunity error:", {
      message: opportunityError.message,
      details: opportunityError.details,
      hint: opportunityError.hint,
      code: opportunityError.code,
    });
  }

  if (!opportunity) {
    return (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "غير موجود" : "Not Found"}
          </p>

          <h1 className="mt-3 text-4xl font-light text-white">
            {isRtl
              ? "الفرصة غير موجودة أو لا تملك صلاحية الوصول"
              : "Opportunity not found or access denied"}
          </h1>

          <Link
            href={`/${locale}/publisher-dashboard/opportunities`}
            className="mt-6 inline-flex rounded-full border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
          </Link>
        </div>
    );
  }

  const { data: applicationsData, error: applicationsError } =
    await adminClient
      .from("opportunity_applications")
      .select("id, status, talent_id, created_at")
      .eq("opportunity_id", opportunityId)
      .order("created_at", { ascending: false });

  if (applicationsError) {
    console.error("Applicants list error:", {
      message: applicationsError.message,
      details: applicationsError.details,
      hint: applicationsError.hint,
      code: applicationsError.code,
    });
  }

  const applications: ApplicationRow[] = applicationsData ?? [];

  const applicationIds = applications.map(
    (application) => application.id,
  );
  
  const { data: conversationsData, error: conversationsError } =
    applicationIds.length > 0
      ? await adminClient
          .from("conversations")
          .select("id, application_id")
          .in("application_id", applicationIds)
      : {
          data: [],
          error: null,
        };
  
  if (conversationsError) {
    console.error("Applicants conversations error:", {
      message: conversationsError.message,
      details: conversationsError.details,
      hint: conversationsError.hint,
      code: conversationsError.code,
    });
  }
  
  const conversationsByApplicationId = new Map(
    (conversationsData ?? []).map((conversation) => [
      String(conversation.application_id),
      conversation.id,
    ]),
  );

  const talentIds = Array.from(
    new Set(
      applications
        .map((application) => application.talent_id)
        .filter(
          (talentId): talentId is number | string =>
            typeof talentId === "number" || typeof talentId === "string",
        ),
    ),
  );

  const { data: talentsData, error: talentsError } =
    talentIds.length > 0
      ? await adminClient
      .from("talents")
      .select(`
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
      `)
          .in("id", talentIds)
      : {
          data: [],
          error: null,
        };

  if (talentsError) {
    console.error("Applicants talents error:", {
      message: talentsError.message,
      details: talentsError.details,
      hint: talentsError.hint,
      code: talentsError.code,
    });
  }

  const talentsById = new Map<string, TalentRow>(
    ((talentsData ?? []) as TalentRow[]).map((talent) => [
      String(talent.id),
      talent,
    ]),
  );

  const enrichedApplications = applications.map((application) => ({
  ...application,

  talent:
    application.talent_id === null
      ? null
      : talentsById.get(String(application.talent_id)) ?? null,

  conversationId:
    conversationsByApplicationId.get(String(application.id)) ?? null,
}));

  const pendingCount = enrichedApplications.filter(
    (application) =>
      !application.status ||
      application.status === "pending" ||
      application.status === "reviewing",
  ).length;

  const shortlistedCount = enrichedApplications.filter(
    (application) => application.status === "shortlisted",
  ).length;

  const acceptedCount = enrichedApplications.filter(
    (application) => application.status === "accepted",
  ).length;

  const rejectedCount = enrichedApplications.filter(
    (application) => application.status === "rejected",
  ).length;

  const statusFilteredApplications =
    selectedStatus === "all"
      ? enrichedApplications
      : selectedStatus === "pending"
        ? enrichedApplications.filter(
            (application) =>
              !application.status ||
              application.status === "pending" ||
              application.status === "reviewing",
          )
        : enrichedApplications.filter(
            (application) => application.status === selectedStatus,
          );

  const filteredApplications = normalizedQuery
    ? statusFilteredApplications.filter((application) => {
        const talent = application.talent;

        const haystack = [
          getTalentName(talent, isRtl),
          getTalentCategory(talent, isRtl),
          getTalentCity(talent, isRtl),
          ...(talent?.skills ?? []),
        ]
          .map(normalizeSearchValue)
          .join(" ");

        return haystack.includes(normalizedQuery);
      })
    : statusFilteredApplications;

  const tabs = [
    [
      "all",
      isRtl
        ? `الكل (${enrichedApplications.length})`
        : `All (${enrichedApplications.length})`,
    ],
    [
      "pending",
      isRtl ? `قيد المراجعة (${pendingCount})` : `Pending (${pendingCount})`,
    ],
    [
      "shortlisted",
      isRtl
        ? `المرشحون (${shortlistedCount})`
        : `Shortlisted (${shortlistedCount})`,
    ],
    [
      "accepted",
      isRtl ? `المقبولون (${acceptedCount})` : `Accepted (${acceptedCount})`,
    ],
    [
      "rejected",
      isRtl ? `المرفوضون (${rejectedCount})` : `Rejected (${rejectedCount})`,
    ],
  ] as const;

  return (
      <div className="space-y-8">
        <header className="rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-gold/[0.05] p-6 sm:p-8">
          <Link
            href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isRtl ? "← العودة إلى تفاصيل الفرصة" : "← Back to Opportunity"}
          </Link>

          <p className="mt-7 text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "إدارة المتقدمين" : "Applicants Management"}
          </p>

          <h1 className="mt-4 text-4xl font-light text-white md:text-5xl">
            {opportunity.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
            {isRtl
              ? "راجع الطلبات، رشّح المواهب المناسبة، وحدّث حالة كل طلب."
              : "Review applications, shortlist suitable talent, and update each application status."}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label={isRtl ? "الإجمالي" : "Total"}
            value={enrichedApplications.length}
          />
          <StatCard
            label={isRtl ? "قيد المراجعة" : "Pending"}
            value={pendingCount}
          />
          <StatCard
            label={isRtl ? "المرشحون" : "Shortlisted"}
            value={shortlistedCount}
          />
          <StatCard
            label={isRtl ? "المقبولون" : "Accepted"}
            value={acceptedCount}
            highlighted
          />
          <StatCard
            label={isRtl ? "المرفوضون" : "Rejected"}
            value={rejectedCount}
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="mb-6 space-y-5">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div className="flex flex-wrap gap-3">
                {tabs.map(([value, label]) => (
                  <Link
                    key={value}
                    href={buildApplicantsHref({
                      locale,
                      opportunityId,
                      status: value,
                      query: searchQuery,
                    })}
                    className={`rounded-full border px-5 py-3 text-xs uppercase tracking-[0.18em] transition ${
                      selectedStatus === value
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-white/10 text-white/50 hover:border-gold/40 hover:text-gold"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <p className="text-sm text-white/35">
                {isRtl
                  ? `${filteredApplications.length} طلب معروض`
                  : `${filteredApplications.length} shown`}
              </p>
            </div>

            <form
              action={`/${locale}/publisher-dashboard/opportunities/${opportunityId}/applicants`}
              method="get"
              className="flex flex-col gap-3 sm:flex-row"
            >
              {selectedStatus !== "all" ? (
                <input type="hidden" name="status" value={selectedStatus} />
              ) : null}

              <input
                type="search"
                name="q"
                defaultValue={searchQuery}
                placeholder={
                  isRtl
                    ? "ابحث بالاسم أو المدينة أو التخصص أو المهارة..."
                    : "Search by name, city, category, or skill..."
                }
                className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/50"
              />

              <button
                type="submit"
                className="min-h-12 rounded-2xl border border-gold/40 bg-gold/[0.06] px-6 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "بحث" : "Search"}
              </button>

              {searchQuery ? (
                <Link
                  href={buildApplicantsHref({
                    locale,
                    opportunityId,
                    status: selectedStatus,
                  })}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-5 text-xs uppercase tracking-[0.18em] text-white/50 transition hover:border-white/30 hover:text-white"
                >
                  {isRtl ? "مسح البحث" : "Clear"}
                </Link>
              ) : null}
            </form>
          </div>

          {filteredApplications.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="hidden grid-cols-[1.55fr_0.8fr_0.8fr_1.35fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.2em] text-white/35 lg:grid">
                <div>{isRtl ? "الموهبة" : "Talent"}</div>
                <div>{isRtl ? "تاريخ التقديم" : "Applied"}</div>
                <div>{isRtl ? "الحالة" : "Status"}</div>
                <div>{isRtl ? "الإجراءات" : "Actions"}</div>
              </div>

              <div className="divide-y divide-white/10">
                {filteredApplications.map((application) => {
                  const talent = application.talent;
                  const currentStatus = application.status ?? "pending";
                  const talentName = getTalentName(talent, isRtl);
                  const category = getTalentCategory(talent, isRtl);
                  const city = getTalentCity(talent, isRtl);

                  return (
                    <article
                      key={application.id}
                      className="grid gap-5 bg-black/20 p-5 transition hover:bg-gold/[0.035] lg:grid-cols-[1.55fr_0.8fr_0.8fr_1.35fr] lg:items-center"
                    >
                      <div className="flex items-center gap-4">
                        {talent?.image_url ? (
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10">
                          <Image
                            src={talent.image_url}
                            alt={talentName}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-gold">
                            {talentName.slice(0, 1)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-light text-white">
                            {talentName}
                          </h2>

                          <p className="mt-1 text-sm text-white/45">
                            {category} • {city}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {talent ? (
                              <TalentPreviewModal
                                talent={talent}
                                locale={locale}
                                isRtl={isRtl}
                              />
                            ) : null}

                            {talent?.slug ? (
                              <Link
                                href={`/${locale}/talent/${talent.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
                              >
                                {isRtl ? "فتح الملف الكامل" : "Open Full Profile"}
                              </Link>
                            ) : null}

{currentStatus === "accepted" &&
application.conversationId ? (
  <Link
    href={`/${locale}/publisher-dashboard/messages/${application.conversationId}`}
    className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/[0.06] px-4 py-2 text-xs text-emerald-300 transition hover:bg-emerald-400 hover:text-black"
  >
    {isRtl ? "فتح المحادثة" : "Open Conversation"}
  </Link>
) : null}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-white/55">
                          {formatDate(application.created_at, locale)}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                            currentStatus,
                          )}`}
                        >
                          {statusLabel(currentStatus, isRtl)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {currentStatus === "pending" ? (
                          <>
                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="reviewing"
                              label={isRtl ? "بدء المراجعة" : "Start Review"}
                              className="border-amber-400/40 text-amber-300 hover:bg-amber-400"
                            />

                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="shortlisted"
                              label={isRtl ? "ترشيح" : "Shortlist"}
                              className="border-blue-400/40 text-blue-300 hover:bg-blue-400"
                            />

                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="rejected"
                              label={isRtl ? "رفض" : "Reject"}
                              className="border-red-400/40 text-red-300 hover:bg-red-400"
                            />
                          </>
                        ) : null}

                        {currentStatus === "reviewing" ? (
                          <>
                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="shortlisted"
                              label={isRtl ? "ترشيح" : "Shortlist"}
                              className="border-blue-400/40 text-blue-300 hover:bg-blue-400"
                            />

                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="accepted"
                              label={isRtl ? "قبول" : "Accept"}
                              className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-400"
                            />

                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="rejected"
                              label={isRtl ? "رفض" : "Reject"}
                              className="border-red-400/40 text-red-300 hover:bg-red-400"
                            />
                          </>
                        ) : null}

                        {currentStatus === "shortlisted" ? (
                          <>
                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="accepted"
                              label={isRtl ? "قبول" : "Accept"}
                              className="border-emerald-400/40 text-emerald-300 hover:bg-emerald-400"
                            />

                            <StatusButton
                              applicationId={application.id}
                              opportunityId={opportunityId}
                              locale={locale}
                              status="rejected"
                              label={isRtl ? "رفض" : "Reject"}
                              className="border-red-400/40 text-red-300 hover:bg-red-400"
                            />
                          </>
                        ) : null}

                        {currentStatus === "accepted" ||
                        currentStatus === "rejected" ? (
                          <span className="inline-flex rounded-full border border-white/10 px-3 py-2 text-xs text-white/35">
                            {isRtl
                              ? "تم اتخاذ القرار النهائي"
                              : "Final decision recorded"}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-10 text-center">
              <p className="text-lg font-light text-white">
                {searchQuery
                  ? isRtl
                    ? "لا توجد طلبات تطابق البحث والفلاتر المحددة"
                    : "No applications match the search and selected filters"
                  : isRtl
                    ? "لا يوجد متقدمون حتى الآن"
                    : "No applicants yet"}
              </p>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/40">
                {isRtl
                  ? "ستظهر طلبات المواهب هنا فور التقديم على الفرصة."
                  : "Talent applications will appear here as soon as candidates apply."}
              </p>

              {searchQuery ? (
                <Link
                  href={buildApplicantsHref({
                    locale,
                    opportunityId,
                    status: selectedStatus,
                  })}
                  className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white/60 transition hover:border-white/40 hover:text-white"
                >
                  {isRtl ? "مسح البحث" : "Clear Search"}
                </Link>
              ) : null}
            </div>
          )}
        </section>
      </div>
  );
}

function StatusButton({
  applicationId,
  opportunityId,
  locale,
  status,
  label,
  className,
}: {
  applicationId: string | number;
  opportunityId: number;
  locale: string;
  status: string;
  label: string;
  className: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await updateApplicationStatusAction(
          String(applicationId),
          status,
        );
      }}
    >
      <input
        type="hidden"
        name="applicationId"
        value={String(applicationId)}
      />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="locale" value={locale} />
      <input
        type="hidden"
        name="opportunityId"
        value={String(opportunityId)}
      />

      <button
        type="submit"
        className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition hover:text-black ${className}`}
      >
        {label}
      </button>
    </form>
  );
}

function statusLabel(status?: string | null, isRtl = false) {
  switch (status) {
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

function statusClass(status?: string | null) {
  switch (status) {
    case "reviewing":
      return "border-amber-400/30 bg-amber-400/10 text-amber-300";
    case "shortlisted":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "accepted":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }
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
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}
