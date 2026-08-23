import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleAlert,
  UserRound,
} from "lucide-react";

import {
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

type PendingChangeRequest = {
  id: number | string;
  talent_id: number | string;
  requested_name_ar: string | null;
  requested_name_en: string | null;
  requested_phone: string | null;
  requested_nationality_slug: string | null;
  created_at: string;
};

type TalentSummary = {
  id: number | string;
  name_ar: string | null;
  name_en: string | null;
};

type PendingTalent = {
  id: number | string;
  name_ar: string | null;
  name_en: string | null;
  category_ar?: string | null;
  category_en?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  approval_status?: string | null;
  account_created_at?: string | null;
};

type PendingPublisherProfile = {
  id: number | string;
  display_name: string | null;
  created_at: string | null;
};

type PublisherLookup = {
  id: number | string;
  profile_id: number | string;
};

type PendingPublisherVerification = {
  id: number | string;
  profile_id: number | string;
  company_name: string | null;
  verification_status: string | null;
  verification_method: string | null;
  verification_submitted_at: string | null;
};

type PendingPublisher = {
  id: number | string;
  profile_id: number | string;
  display_name: string | null;
  created_at: string | null;
};

type PendingOpportunity = {
  id: number | string;
  title: string | null;
  status: string | null;
  created_at: string | null;
};

function formatDate(
  value: string | null | undefined,
  language: "ar" | "en",
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "ar"
      ? "ar-SA-u-nu-latn"
      : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

export default async function AdminActionCenterPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const resolvedSearchParams =
    await searchParams;

  const language =
    getAdminLanguage(
      resolvedSearchParams.lang,
    );

  const isArabic =
    language === "ar";

  const adminClient =
    createAdminClient();

  /*
   * جميع أنواع المهام التي تحتاج
   * قرارًا من الإدارة.
   */
  const [
    changeRequestsResult,
    pendingTalentsResult,
    pendingPublishersResult,
    pendingPublisherVerificationsResult,
    pendingOpportunitiesResult,
  ] = await Promise.all([
    /*
     * طلبات تعديل بيانات المواهب
     * القديمة/المحمية.
     */
    adminClient
      .from(
        "talent_profile_change_requests",
      )
      .select(`
        id,
        talent_id,
        requested_name_ar,
        requested_name_en,
        requested_phone,
        requested_nationality_slug,
        created_at
      `)
      .eq(
        "status",
        "pending",
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),

    /*
     * ملفات المواهب المرسلة
     * للمراجعة والاعتماد.
     *
     * نستخدم admin_talent_profiles
     * لأنه المصدر نفسه المستخدم
     * في إدارة المواهب.
     */
    adminClient
      .from(
        "admin_talent_profiles",
      )
      .select(`
        id,
        name_ar,
        name_en,
        category_ar,
        category_en,
        city_ar,
        city_en,
        approval_status,
        account_created_at
      `)
      .eq(
        "approval_status",
        "pending",
      )
      .order(
        "id",
        {
          ascending: false,
        },
      ),

    /*
     * الناشرون الذين ينتظرون
     * اعتماد الإدارة.
     */
    adminClient
  .from("profiles")
  .select(`
    id,
    display_name,
    created_at
  `)
  .eq(
    "account_type",
    "publisher",
  )
  .eq(
    "approval_status",
    "pending",
  )
  .order(
    "created_at",
    {
      ascending: true,
    },
  ),

  /*
 * طلبات توثيق الجهات
 * التي تنتظر مراجعة الإدارة.
 */
adminClient
.from("publishers")
.select(`
  id,
  profile_id,
  company_name,
  verification_status,
  verification_method,
  verification_submitted_at
`)
.neq(
  "publisher_type",
  "individual",
)
.eq(
  "verification_status",
  "pending",
)
.order(
  "verification_submitted_at",
  {
    ascending: true,
  },
),

    /*
     * الفرص التي تنتظر المراجعة.
     */
    adminClient
      .from("opportunities")
      .select(`
        id,
        title,
        status,
        created_at
      `)
      .eq(
        "status",
        "pending_review",
      )
      .order(
        "created_at",
        {
          ascending: true,
        },
      ),
  ]);

  if (
    changeRequestsResult.error
  ) {
    console.error(
      "[AdminActionCenterPage requests]",
      changeRequestsResult.error,
    );
  }

  if (
    pendingTalentsResult.error
  ) {
    console.error(
      "[AdminActionCenterPage pendingTalents]",
      pendingTalentsResult.error,
    );
  }

  if (
    pendingPublishersResult.error
  ) {
    console.error(
      "[AdminActionCenterPage pendingPublishers]",
      pendingPublishersResult.error,
    );
  }

  if (
    pendingPublisherVerificationsResult.error
  ) {
    console.error(
      "[AdminActionCenterPage pendingPublisherVerifications]",
      pendingPublisherVerificationsResult.error,
    );
  }

  if (
    pendingOpportunitiesResult.error
  ) {
    console.error(
      "[AdminActionCenterPage pendingOpportunities]",
      pendingOpportunitiesResult.error,
    );
  }

  const pendingRequests =
    (
      changeRequestsResult.data ??
      []
    ) as PendingChangeRequest[];

  const pendingTalents =
    (
      pendingTalentsResult.data ??
      []
    ) as PendingTalent[];

    const pendingPublisherProfiles =
    (
      pendingPublishersResult.data ??
      []
    ) as PendingPublisherProfile[];
  
  const pendingPublisherProfileIds =
    pendingPublisherProfiles
      .map((publisher) => Number(publisher.id))
      .filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0,
      );
  
  let publisherRows: PublisherLookup[] = [];
  
  if (pendingPublisherProfileIds.length > 0) {
    const {
      data,
      error,
    } = await adminClient
      .from("publishers")
      .select("id, profile_id")
      .in(
        "profile_id",
        pendingPublisherProfileIds,
      );
  
    if (error) {
      console.error(
        "[AdminActionCenterPage publisherLookup]",
        error,
      );
    } else {
      publisherRows =
        (data ?? []) as PublisherLookup[];
    }
  }
  
  const publisherByProfileId =
    new Map(
      publisherRows.map((publisher) => [
        String(publisher.profile_id),
        publisher,
      ]),
    );
  
  const pendingPublishers: PendingPublisher[] =
    pendingPublisherProfiles.flatMap(
      (profile) => {
        const publisher =
          publisherByProfileId.get(
            String(profile.id),
          );
  
        if (!publisher) {
          return [];
        }
  
        return [
          {
            id: publisher.id,
            profile_id: profile.id,
            display_name: profile.display_name,
            created_at: profile.created_at,
          },
        ];
      },
    );

    const pendingPublisherVerifications =
  (
    pendingPublisherVerificationsResult.data ??
    []
  ) as PendingPublisherVerification[];

  const pendingOpportunities =
    (
      pendingOpportunitiesResult.data ??
      []
    ) as PendingOpportunity[];

  /*
   * هذا الجزء خاص بطلبات تعديل
   * بيانات المواهب القديمة.
   * نحافظ عليه كما كان.
   */
  const talentIds = [
    ...new Set(
      pendingRequests.map(
        (request) =>
          Number(
            request.talent_id,
          ),
      ),
    ),
  ].filter(
    (id) =>
      Number.isInteger(id) &&
      id > 0,
  );

  let talents: TalentSummary[] =
    [];

  if (talentIds.length > 0) {
    const {
      data: talentRows,
      error: talentsError,
    } = await adminClient
      .from("talents")
      .select(`
        id,
        name_ar,
        name_en
      `)
      .in(
        "id",
        talentIds,
      );

    if (talentsError) {
      console.error(
        "[AdminActionCenterPage talents]",
        talentsError,
      );
    } else {
      talents =
        (
          talentRows ?? []
        ) as TalentSummary[];
    }
  }

  const talentById =
    new Map(
      talents.map(
        (talent) => [
          String(
            talent.id,
          ),
          talent,
        ],
      ),
    );

  const totalPending =
  pendingRequests.length +
  pendingTalents.length +
  pendingPublishers.length +
  pendingPublisherVerifications.length +
  pendingOpportunities.length;

  const ArrowIcon =
    isArabic
      ? ArrowLeft
      : ArrowRight;

  return (
    <div
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-gold">
              <CircleAlert className="h-4 w-4" />

              <p className="text-[10px] uppercase tracking-[0.25em]">
                {isArabic
                  ? "مركز الإجراءات"
                  : "Action Center"}
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-light text-white">
              {isArabic
                ? "يتطلب إجراء"
                : "Requires action"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">
              {isArabic
                ? "كل ما يحتاج قرارًا من الإدارة يظهر هنا حتى تتم معالجته."
                : "Everything requiring an admin decision remains here until it is handled."}
            </p>
          </div>

          <div className="rounded-2xl border border-gold/15 bg-gold/[0.05] px-4 py-3">
            <p className="text-[10px] text-white/35">
              {isArabic
                ? "إجمالي المهام"
                : "Total tasks"}
            </p>

            <p className="mt-1 text-2xl font-light text-gold">
              {totalPending}
            </p>
          </div>
        </div>

        {/* Pending talents */}
        <section className="mt-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-light text-white">
                {isArabic
                  ? "ملفات المواهب بانتظار المراجعة"
                  : "Talent profiles awaiting review"}
              </h2>

              <p className="mt-1 text-sm text-white/35">
                {isArabic
                  ? "المواهب التي أكملت المتطلبات الأساسية وأرسلت ملفاتها للاعتماد."
                  : "Talent profiles that completed the required information and were submitted for approval."}
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-xs text-gold">
              {pendingTalents.length}
            </span>
          </div>

          {pendingTalents.length ===
          0 ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
              <UserRound className="mx-auto h-8 w-8 text-white/15" />

              <h3 className="mt-4 text-lg font-light text-white/65">
                {isArabic
                  ? "لا توجد ملفات مواهب بانتظار المراجعة"
                  : "No talent profiles awaiting review"}
              </h3>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingTalents.map(
                (talent) => {
                  const talentName =
                    (
                      isArabic
                        ? talent.name_ar ||
                          talent.name_en
                        : talent.name_en ||
                          talent.name_ar
                    )?.trim() ||
                    (isArabic
                      ? "موهبة بدون اسم"
                      : "Unnamed talent");

                  const category =
                    (
                      isArabic
                        ? talent.category_ar ||
                          talent.category_en
                        : talent.category_en ||
                          talent.category_ar
                    )?.trim();

                  const city =
                    (
                      isArabic
                        ? talent.city_ar ||
                          talent.city_en
                        : talent.city_en ||
                          talent.city_ar
                    )?.trim();

                  return (
                    <article
                      key={
                        talent.id
                      }
                      className="rounded-3xl border border-gold/15 bg-gold/[0.025] p-5 transition hover:border-gold/30 hover:bg-gold/[0.04]"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/15 bg-gold/[0.05]">
                            <UserRound className="h-5 w-5 text-gold" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-medium text-white/85">
                              {
                                talentName
                              }
                            </h3>

                            <p className="mt-1 text-sm text-white/35">
                              {[
                                category,
                                city,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  " · ",
                                ) ||
                                "—"}
                            </p>

                            <p className="mt-2 text-xs text-white/25">
                              {formatDate(
                                talent.account_created_at,
                                language,
                              )}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={withAdminLanguage(
                            `/admin/talents/${talent.id}`,
                            language,
                          )}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.07] px-4 text-sm text-gold transition hover:bg-gold hover:text-black"
                        >
                          {isArabic
                            ? "مراجعة الملف"
                            : "Review profile"}

                          <ArrowIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>

{/* Pending publisher verification */}
<section className="mt-10 border-t border-white/[0.07] pt-8">
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-xl font-light text-white">
        {isArabic
          ? "طلبات توثيق الجهات"
          : "Organization verification requests"}
      </h2>

      <p className="mt-1 text-sm text-white/35">
        {isArabic
          ? "الجهات التي أرسلت إثبات ارتباطها وتنتظر قرار الإدارة."
          : "Organizations that submitted verification proof and are awaiting admin review."}
      </p>
    </div>

    <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-xs text-amber-200">
      {pendingPublisherVerifications.length}
    </span>
  </div>

  {pendingPublisherVerifications.length === 0 ? (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
      <Building2 className="mx-auto h-8 w-8 text-white/15" />

      <h3 className="mt-4 text-lg font-light text-white/65">
        {isArabic
          ? "لا توجد طلبات توثيق بانتظار المراجعة"
          : "No verification requests awaiting review"}
      </h3>
    </div>
  ) : (
    <div className="grid gap-3 lg:grid-cols-2">
      {pendingPublisherVerifications.map(
        (publisher) => (
          <article
            key={publisher.id}
            className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.025] p-5 transition hover:border-amber-400/30 hover:bg-amber-400/[0.04]"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/15 bg-amber-400/[0.05]">
                  <Building2 className="h-5 w-5 text-amber-200" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-base font-medium text-white/85">
                    {publisher.company_name?.trim() ||
                      (isArabic
                        ? "جهة بدون اسم"
                        : "Unnamed organization")}
                  </h3>

                  <p className="mt-1 text-sm text-amber-200/80">
                    {isArabic
                      ? "بانتظار التوثيق"
                      : "Awaiting verification"}
                  </p>

                  <p className="mt-2 text-xs text-white/25">
                  {formatDate(
  publisher.verification_submitted_at,
  language,
)}
                  </p>
                </div>
              </div>

              <Link
                href={withAdminLanguage(
                  `/admin/publishers?publisher=${publisher.id}`,
                  language,
                )}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-4 text-sm text-amber-200 transition hover:bg-amber-300 hover:text-black"
              >
                {isArabic
                  ? "مراجعة التوثيق"
                  : "Review verification"}

                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ),
      )}
    </div>
  )}
</section>

        {/* Pending publishers */}
        <section className="mt-10 border-t border-white/[0.07] pt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-light text-white">
                {isArabic
                  ? "الناشرون بانتظار الاعتماد"
                  : "Publishers awaiting approval"}
              </h2>

              <p className="mt-1 text-sm text-white/35">
                {isArabic
                  ? "حسابات الناشرين التي تحتاج مراجعة واعتماد الإدارة."
                  : "Publisher accounts requiring admin review and approval."}
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-xs text-gold">
              {
                pendingPublishers.length
              }
            </span>
          </div>

          {pendingPublishers.length ===
          0 ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
              <Building2 className="mx-auto h-8 w-8 text-white/15" />

              <h3 className="mt-4 text-lg font-light text-white/65">
                {isArabic
                  ? "لا توجد حسابات ناشرين بانتظار الاعتماد"
                  : "No publishers awaiting approval"}
              </h3>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingPublishers.map(
                (publisher) => {
                  const publisherName =
  publisher.display_name?.trim() ||
  (isArabic
    ? "ناشر بدون اسم"
    : "Unnamed publisher");

                  return (
                    <article
                      key={
                        publisher.id
                      }
                      className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/20 hover:bg-white/[0.03]"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/25">
                            <Building2 className="h-5 w-5 text-gold" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-medium text-white/85">
                              {
                                publisherName
                              }
                            </h3>

                            <p className="mt-1 text-sm text-gold/70">
                              {isArabic
                                ? "بانتظار الاعتماد"
                                : "Awaiting approval"}
                            </p>

                            <p className="mt-2 text-xs text-white/25">
                            {formatDate(
  publisher.created_at,
  language,
)}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={withAdminLanguage(
                            `/admin/publishers?publisher=${publisher.id}`,
                            language,
                          )}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.07] px-4 text-sm text-gold transition hover:bg-gold hover:text-black"
                        >
                          {isArabic
                            ? "مراجعة الناشر"
                            : "Review publisher"}

                          <ArrowIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* Pending opportunities */}
        <section className="mt-10 border-t border-white/[0.07] pt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-light text-white">
                {isArabic
                  ? "فرص بانتظار المراجعة"
                  : "Opportunities awaiting review"}
              </h2>

              <p className="mt-1 text-sm text-white/35">
                {isArabic
                  ? "الفرص التي أرسلها الناشرون وتحتاج قرار الإدارة قبل النشر."
                  : "Opportunities submitted by publishers that require admin review before publication."}
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1 text-xs text-gold">
              {
                pendingOpportunities.length
              }
            </span>
          </div>

          {pendingOpportunities.length ===
          0 ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-10 text-center">
              <BriefcaseBusiness className="mx-auto h-8 w-8 text-white/15" />

              <h3 className="mt-4 text-lg font-light text-white/65">
                {isArabic
                  ? "لا توجد فرص بانتظار المراجعة"
                  : "No opportunities awaiting review"}
              </h3>
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingOpportunities.map(
                (opportunity) => (
                  <article
                    key={
                      opportunity.id
                    }
                    className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/20 hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/25">
                          <BriefcaseBusiness className="h-5 w-5 text-gold" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-medium text-white/85">
                            {opportunity.title?.trim() ||
                              (isArabic
                                ? "فرصة بدون عنوان"
                                : "Untitled opportunity")}
                          </h3>

                          <p className="mt-1 text-sm text-gold/70">
                            {isArabic
                              ? "بانتظار المراجعة"
                              : "Awaiting review"}
                          </p>

                          <p className="mt-2 text-xs text-white/25">
                            {formatDate(
                              opportunity.created_at,
                              language,
                            )}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={withAdminLanguage(
                          `/admin/opportunities/${opportunity.id}`,
                          language,
                        )}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.07] px-4 text-sm text-gold transition hover:bg-gold hover:text-black"
                      >
                        {isArabic
                          ? "مراجعة الفرصة"
                          : "Review opportunity"}

                        <ArrowIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        {/* Legacy talent data changes */}
        <section className="mt-10 border-t border-white/[0.07] pt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-light text-white">
                {isArabic
                  ? "تعديلات بيانات المواهب"
                  : "Talent data changes"}
              </h2>

              <p className="mt-1 text-sm text-white/35">
                {isArabic
                  ? "طلبات تغيير الاسم أو رقم الجوال أو الجنسية."
                  : "Requests to change name, phone number, or nationality."}
              </p>
            </div>

            <span className="inline-flex w-fit min-w-8 items-center justify-center rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/45">
              {pendingRequests.length}
            </span>
          </div>

          {pendingRequests.length ===
          0 ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center">
              <CircleAlert className="mx-auto h-8 w-8 text-white/15" />

              <h3 className="mt-4 text-lg font-light text-white/65">
                {isArabic
                  ? "لا توجد طلبات تعديل تحتاج إجراء"
                  : "No data change requests require action"}
              </h3>

              <p className="mt-2 text-sm text-white/30">
                {isArabic
                  ? "سيظهر أي طلب جديد هنا تلقائيًا."
                  : "New requests will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(
                (request) => {
                  const talent =
                    talentById.get(
                      String(
                        request.talent_id,
                      ),
                    );

                  const currentName =
                    (
                      isArabic
                        ? talent?.name_ar ||
                          talent?.name_en
                        : talent?.name_en ||
                          talent?.name_ar
                    )?.trim() ||
                    (isArabic
                      ? "موهبة بدون اسم"
                      : "Unnamed talent");

                  const requestedName =
                    (
                      isArabic
                        ? request.requested_name_ar ||
                          request.requested_name_en
                        : request.requested_name_en ||
                          request.requested_name_ar
                    )?.trim();

                  return (
                    <article
                      key={
                        request.id
                      }
                      className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-gold/20 hover:bg-white/[0.03]"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/25">
                            <UserRound className="h-5 w-5 text-gold" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-base font-medium text-white/85">
                              {
                                currentName
                              }
                            </h3>

                            {requestedName &&
                            requestedName !==
                              currentName ? (
                              <p className="mt-1 text-sm text-gold">
                                {isArabic
                                  ? `الاسم المطلوب: ${requestedName}`
                                  : `Requested name: ${requestedName}`}
                              </p>
                            ) : null}

                            <p className="mt-2 text-xs text-white/25">
                              {formatDate(
                                request.created_at,
                                language,
                              )}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={withAdminLanguage(
                            `/admin/talents/${request.talent_id}`,
                            language,
                          )}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.07] px-4 text-sm text-gold transition hover:bg-gold hover:text-black"
                        >
                          {isArabic
                            ? "مراجعة الطلب"
                            : "Review request"}

                          <ArrowIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}