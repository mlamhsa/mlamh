import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Clock3,
  Eye,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  type AdminTalentFilter,
  type AdminTalentOperationalFilter,
} from "@/lib/repositories/talents/TalentRepository";
import { TalentService } from "@/lib/services/talents/TalentService";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
    page?: string;
    status?: string;
    search?: string;
    review?: string;
    ops?: string;
  }>;
};

type ApprovalStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected"
  | string;

type ProfileApprovalRow = {
  user_id: string;
  approval_status: ApprovalStatus | null;
};

const PAGE_SIZE = 12;

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseFilter(
  value: string | undefined,
): AdminTalentFilter | undefined {
  if (
    value === "published" ||
    value === "unpublished" ||
    value === "active" ||
    value === "suspended"
  ) {
    return value;
  }

  return undefined;
}

function parseOperationalFilter(
  value: string | undefined,
): AdminTalentOperationalFilter | undefined {
  if (
    value === "incomplete" ||
    value === "ready_not_submitted" ||
    value === "changes_requested"
  ) {
    return value;
  }

  return undefined;
}

function buildAdminTalentsUrl({
  language,
  page,
  status,
  search,
  review,
  ops,
}: {
  language: "ar" | "en";
  page?: number;
  status?: string;
  search?: string;
  review?: string;
  ops?: string;
}) {
  const params = new URLSearchParams();
  params.set("lang", language);

  if (page && page > 1) params.set("page", String(page));
  if (status) params.set("status", status);
  if (review) params.set("review", review);
  if (ops) params.set("ops", ops);
  if (search?.trim()) params.set("search", search.trim());

  return `/admin/talents?${params.toString()}`;
}

function getApprovalConfig(
  status: ApprovalStatus | null | undefined,
  isArabic: boolean,
) {
  switch (status) {
    case "pending":
      return {
        label: isArabic ? "قيد المراجعة" : "Under review",
        className:
          "border-amber-400/20 bg-amber-400/[0.08] text-amber-300",
      };
    case "approved":
      return {
        label: isArabic ? "معتمد" : "Approved",
        className:
          "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
      };
    case "changes_requested":
      return {
        label: isArabic ? "مطلوب تعديل" : "Changes requested",
        className:
          "border-orange-400/20 bg-orange-400/[0.08] text-orange-300",
      };
    case "rejected":
      return {
        label: isArabic ? "مرفوض" : "Rejected",
        className:
          "border-red-400/20 bg-red-400/[0.08] text-red-300",
      };
    default:
      return {
        label: isArabic ? "لم يرسل للمراجعة" : "Not submitted",
        className:
          "border-white/10 bg-white/[0.04] text-white/40",
      };
  }
}

export default async function AdminTalentsPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const resolvedSearchParams = await searchParams;
  const language = getAdminLanguage(resolvedSearchParams.lang);
  const isArabic = language === "ar";
  const page = parsePage(resolvedSearchParams.page);
  const status = parseFilter(resolvedSearchParams.status);
  const search = resolvedSearchParams.search?.trim() ?? "";
  const ops = parseOperationalFilter(resolvedSearchParams.ops);
  const review =
    !ops && resolvedSearchParams.review === "pending"
      ? "pending"
      : undefined;

  const [
    talentsResult,
    stats,
    operationalStats,
    pendingReviewResult,
  ] = await Promise.all([
    TalentService.getAdminTalents({
      page,
      pageSize: PAGE_SIZE,
      status,
      search,
      approvalStatus: review,
      operationalFilter: ops,
    }),
    TalentService.getAdminStats(),
    TalentService.getAdminOperationalStats(),
    createAdminClient()
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "talent")
      .eq("approval_status", "pending"),
  ]);

  const {
    talents,
    total,
    totalPages,
    currentPage,
  } = talentsResult;

  const userIds = [
    ...new Set(
      talents
        .map((talent) => talent.user_id)
        .filter(
          (userId): userId is string =>
            typeof userId === "string" && userId.length > 0,
        ),
    ),
  ];

  const adminClient = createAdminClient();
  let approvalRows: ProfileApprovalRow[] = [];

  if (userIds.length > 0) {
    const { data, error } = await adminClient
      .from("profiles")
      .select("user_id, approval_status")
      .in("user_id", userIds);

    if (error) {
      console.error("[AdminTalentsPage approval statuses]", error);
    } else {
      approvalRows = (data ?? []) as ProfileApprovalRow[];
    }
  }

  const approvalByUserId = new Map(
    approvalRows.map((profile) => [
      profile.user_id,
      profile.approval_status ?? "not_submitted",
    ]),
  );

  const pendingReviewCount = pendingReviewResult.error
    ? 0
    : pendingReviewResult.count ?? 0;

  const filters: {
    value: AdminTalentFilter | "";
    label: string;
    count?: number;
  }[] = [
    {
      value: "",
      label: isArabic ? "الكل" : "All",
      count: stats.total,
    },
    {
      value: "published",
      label: isArabic ? "منشورة" : "Published",
      count: stats.published,
    },
    {
      value: "unpublished",
      label: isArabic ? "غير منشورة" : "Unpublished",
      count: stats.unpublished,
    },
    {
      value: "active",
      label: isArabic ? "نشطة" : "Active",
      count: stats.active,
    },
    {
      value: "suspended",
      label: isArabic ? "موقوفة" : "Suspended",
      count: stats.suspended,
    },
  ];

  const operationalFilters: {
    value: AdminTalentOperationalFilter;
    label: string;
    count: number;
  }[] = [
    {
      value: "incomplete",
      label: isArabic ? "غير مكتمل" : "Incomplete",
      count: operationalStats.incomplete,
    },
    {
      value: "ready_not_submitted",
      label: isArabic ? "جاهز ولم يرسل" : "Ready, not submitted",
      count: operationalStats.readyNotSubmitted,
    },
    {
      value: "changes_requested",
      label: isArabic ? "مطلوب تعديل" : "Changes requested",
      count: operationalStats.changesRequested,
    },
  ];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-gold">
                <Users className="h-4 w-4" />
                <p className="text-[10px] uppercase tracking-[0.25em]">
                  {isArabic ? "إدارة الحسابات" : "Account Management"}
                </p>
              </div>

              <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
                {isArabic ? "المواهب" : "Talents"}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">
                {isArabic
                  ? "إدارة ملفات المواهب ومراجعة حالة الاعتماد والنشر والحساب."
                  : "Manage talent profiles, review approval status, publishing, and account state."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Link
                href={buildAdminTalentsUrl({ language, search })}
                className={`group rounded-2xl border px-4 py-3 transition ${
                  !status && !review && !ops
                    ? "border-gold/30 bg-gold/[0.08]"
                    : "border-white/[0.08] bg-black/20 hover:border-gold/25 hover:bg-gold/[0.04]"
                }`}
              >
                <p className="text-[10px] text-white/30 group-hover:text-gold/70">
                  {isArabic ? "إجمالي المواهب" : "Total talents"}
                </p>
                <p className="mt-1 text-2xl font-light text-white">
                  {stats.total}
                </p>
              </Link>

              <Link
                href={buildAdminTalentsUrl({
                  language,
                  status: "published",
                  search,
                })}
                className={`group rounded-2xl border px-4 py-3 transition ${
                  status === "published" && !review && !ops
                    ? "border-emerald-400/35 bg-emerald-400/[0.09]"
                    : "border-emerald-400/15 bg-emerald-400/[0.04] hover:border-emerald-400/35 hover:bg-emerald-400/[0.08]"
                }`}
              >
                <p className="text-[10px] text-white/30 group-hover:text-emerald-300/70">
                  {isArabic ? "منشورة" : "Published"}
                </p>
                <p className="mt-1 text-2xl font-light text-emerald-300">
                  {stats.published}
                </p>
              </Link>

              <Link
                href={buildAdminTalentsUrl({
                  language,
                  review: "pending",
                  search,
                })}
                className={`group rounded-2xl border px-4 py-3 transition ${
                  review === "pending"
                    ? "border-amber-400/35 bg-amber-400/[0.09]"
                    : "border-amber-400/15 bg-amber-400/[0.04] hover:border-amber-400/35 hover:bg-amber-400/[0.08]"
                }`}
              >
                <p className="text-[10px] text-white/30 group-hover:text-amber-300/70">
                  {isArabic ? "قيد المراجعة" : "Under review"}
                </p>
                <p className="mt-1 text-2xl font-light text-amber-300">
                  {pendingReviewCount}
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <form method="get" className="flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="lang" value={language} />
            {status ? (
              <input type="hidden" name="status" value={status} />
            ) : null}
            {review ? (
              <input type="hidden" name="review" value={review} />
            ) : null}
            {ops ? (
              <input type="hidden" name="ops" value={ops} />
            ) : null}

            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 ${
                  isArabic ? "right-4" : "left-4"
                }`}
              />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder={
                  isArabic
                    ? "ابحث بالاسم، الفئة، المدينة أو رقم الجوال..."
                    : "Search name, category, city, or phone..."
                }
                className={`min-h-12 w-full rounded-2xl border border-white/[0.08] bg-black/20 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-gold/30 ${
                  isArabic ? "pr-11 pl-4" : "pl-11 pr-4"
                }`}
              />
            </div>

            <button
              type="submit"
              className="min-h-12 rounded-2xl border border-gold/25 bg-gold/[0.07] px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              {isArabic ? "بحث" : "Search"}
            </button>
          </form>
        </section>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const active =
              !review && !ops && status === (filter.value || undefined);

            return (
              <Link
                key={filter.value || "all"}
                href={buildAdminTalentsUrl({
                  language,
                  status: filter.value || undefined,
                  search,
                })}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs transition ${
                  active
                    ? "border-gold/30 bg-gold/[0.12] text-gold"
                    : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-gold/20 hover:text-gold"
                }`}
              >
                {filter.label}
                {typeof filter.count === "number" ? (
                  <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px]">
                    {filter.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3">
          <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-white/25">
            {isArabic ? "متابعة الاستكمال" : "Completion operations"}
          </p>
          <div className="flex flex-wrap gap-2">
            {operationalFilters.map((filter) => {
              const active = ops === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={buildAdminTalentsUrl({
                    language,
                    status,
                    search,
                    ops: filter.value,
                  })}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs transition ${
                    active
                      ? "border-sky-400/30 bg-sky-400/[0.10] text-sky-200"
                      : "border-white/[0.08] bg-black/15 text-white/40 hover:border-sky-400/20 hover:text-sky-200"
                  }`}
                >
                  {filter.label}
                  <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px]">
                    {filter.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-light text-white">
              {isArabic ? "ملفات المواهب" : "Talent profiles"}
            </h2>
            <p className="mt-1 text-xs text-white/30">
              {isArabic ? `${total} موهبة` : `${total} talents`}
            </p>
          </div>
        </div>

        {talents.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
            <Users className="mx-auto h-9 w-9 text-white/15" />
            <h3 className="mt-4 text-lg font-light text-white/60">
              {isArabic ? "لا توجد مواهب مطابقة" : "No matching talents"}
            </h3>
            <p className="mt-2 text-sm text-white/30">
              {isArabic
                ? "غيّر البحث أو الفلتر وحاول مرة أخرى."
                : "Change your search or filter and try again."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {talents.map((talent) => {
              const primaryName =
                (
                  isArabic
                    ? talent.name_ar || talent.name_en
                    : talent.name_en || talent.name_ar
                )?.trim() ||
                (isArabic ? "موهبة بدون اسم" : "Unnamed talent");

              const category =
                (
                  isArabic
                    ? talent.category_ar || talent.category_en
                    : talent.category_en || talent.category_ar
                )?.trim() || "—";

              const city =
                (
                  isArabic
                    ? talent.city_ar || talent.city_en
                    : talent.city_en || talent.city_ar
                )?.trim() || "—";

              const approvalStatus = talent.user_id
                ? approvalByUserId.get(talent.user_id) ?? "not_submitted"
                : "not_submitted";

              const readiness =
                approvalStatus === "not_submitted"
                  ? getTalentProfileReadiness({
                      ...talent,
                      phone:
                        talent.account_phone ?? talent.whatsapp ?? null,
                    })
                  : null;

              const approval =
                approvalStatus === "not_submitted" && readiness
                  ? readiness.isReady
                    ? {
                        label: isArabic
                          ? "جاهز ولم يرسل"
                          : "Ready, not submitted",
                        className:
                          "border-sky-400/20 bg-sky-400/[0.08] text-sky-300",
                      }
                    : {
                        label: isArabic ? "غير مكتمل" : "Incomplete",
                        className:
                          "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
                      }
                  : getApprovalConfig(approvalStatus, isArabic);

              const missingRequirements =
                approvalStatus === "not_submitted" && readiness && !readiness.isReady
                  ? readiness.missingRequirements
                  : [];

              const visibleMissing = missingRequirements.slice(0, 2);
              const extraMissingCount = Math.max(
                missingRequirements.length - visibleMissing.length,
                0,
              );

              return (
                <Link
                  key={talent.id}
                  href={withAdminLanguage(
                    `/admin/talents/${talent.id}`,
                    language,
                  )}
                  className="group overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] transition hover:border-gold/20 hover:bg-white/[0.035]"
                >
                  <div className="flex min-h-[180px]">
                    <div className="relative w-32 shrink-0 bg-black/30 sm:w-40">
                      {talent.image_url ? (
                        <Image
                          src={talent.image_url}
                          alt={primaryName}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Users className="h-9 w-9 text-white/15" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-medium text-white/85 transition group-hover:text-gold">
                            {primaryName}
                          </h3>
                          <p className="mt-1 truncate text-xs text-white/35">
                            {category} · {city}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${approval.className}`}
                        >
                          {approval.label}
                        </span>
                      </div>

                      {visibleMissing.length > 0 ? (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-amber-200/55">
                            {isArabic ? "ناقص:" : "Missing:"}
                          </span>
                          {visibleMissing.map((item) => (
                            <span
                              key={item.key}
                              className="rounded-full border border-amber-300/10 bg-amber-300/[0.04] px-2 py-1 text-[10px] text-amber-100/70"
                            >
                              {isArabic ? item.ar : item.en}
                            </span>
                          ))}
                          {extraMissingCount > 0 ? (
                            <span className="text-[10px] text-white/30">
                              +{extraMissingCount}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] ${
                            talent.status === "suspended"
                              ? "border-red-400/20 bg-red-400/[0.07] text-red-300"
                              : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                          }`}
                        >
                          {talent.status === "suspended" ? (
                            <CircleOff className="h-3 w-3" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {talent.status === "suspended"
                            ? isArabic
                              ? "موقوف"
                              : "Suspended"
                            : isArabic
                              ? "نشط"
                              : "Active"}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] ${
                            talent.published
                              ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                              : "border-white/10 bg-white/[0.03] text-white/35"
                          }`}
                        >
                          <Eye className="h-3 w-3" />
                          {talent.published
                            ? isArabic
                              ? "منشور"
                              : "Published"
                            : isArabic
                              ? "غير منشور"
                              : "Unpublished"}
                        </span>

                        {talent.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-2.5 py-1 text-[10px] text-sky-300">
                            <ShieldCheck className="h-3 w-3" />
                            {isArabic ? "موثّق" : "Verified"}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/30">
                          <Eye className="h-3.5 w-3.5" />
                          {Number(talent.views ?? 0).toLocaleString(
                            isArabic ? "ar-SA" : "en-US",
                          )}
                        </span>

                        {approvalStatus === "pending" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300">
                            <Clock3 className="h-3.5 w-3.5" />
                            {isArabic ? "يحتاج مراجعة" : "Needs review"}
                          </span>
                        ) : approvalStatus === "not_submitted" && readiness?.isReady ? (
                          <span className="text-xs text-sky-300/80">
                            {isArabic ? "جاهز للإرسال" : "Ready to submit"}
                          </span>
                        ) : (
                          <span className="text-xs text-gold/70">
                            {isArabic ? "عرض الملف" : "View profile"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            {currentPage > 1 ? (
              <Link
                href={buildAdminTalentsUrl({
                  language,
                  page: currentPage - 1,
                  status,
                  search,
                  review,
                  ops,
                })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] text-white/45 transition hover:border-gold/25 hover:text-gold"
                aria-label={isArabic ? "الصفحة السابقة" : "Previous page"}
              >
                {isArabic ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Link>
            ) : null}

            <span className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-3 text-xs text-white/45">
              {isArabic
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>

            {currentPage < totalPages ? (
              <Link
                href={buildAdminTalentsUrl({
                  language,
                  page: currentPage + 1,
                  status,
                  search,
                  review,
                  ops,
                })}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] text-white/45 transition hover:border-gold/25 hover:text-gold"
                aria-label={isArabic ? "الصفحة التالية" : "Next page"}
              >
                {isArabic ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}