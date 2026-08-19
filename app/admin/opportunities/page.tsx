import Link from "next/link";
import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminGrid,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  archiveOpportunityAction,
  hideOpportunityAction,
  publishOpportunityAction,
  rejectOpportunityAction,
  requestChangesOpportunityAction,
} from "@/lib/actions/admin-opportunity-actions";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Opportunities — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    publisher?: string;
    lang?: string;
  }>;
};

type OpportunityStatus =
  | "published"
  | "pending_review"
  | "needs_changes"
  | "rejected"
  | "closed"
  | "archived"
  | "draft";

  type OpportunityRow = {
    id: number;
    publisher_id: number | null;
    title: string | null;
    slug: string | null;
    posting_mode: "quick" | "project" | string | null;
    description: string | null;
    opportunity_type: string | null;
    city_ar: string | null;
    city_en: string | null;
    required_gender: string | null;
    min_age: number | null;
    max_age: number | null;
    budget: string | null;
    compensation_type: string | null;
    company_name: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
  
    required_count: number | null;
    work_date: string | null;
    work_time: string | null;
    work_duration: string | null;
  
    role_requirements: Record<string, unknown> | null;
  
    application_days: number | null;
    application_start_date: string | null;
    application_deadline: string | null;
  
    status: OpportunityStatus | string | null;
    published: boolean | null;
    expires_at: string | null;
    created_at: string | null;
    updated_at: string | null;
  };

function formatDate(
  value: string | null | undefined,
  isArabic: boolean,
) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-SA-u-ca-gregory-nu-latn"
      : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}

function getStatusVariant(status?: string | null) {
  switch (status) {
    case "published":
      return "success";
    case "pending_review":
      return "gold";
    case "needs_changes":
      return "warning";
    case "rejected":
      return "danger";
    case "closed":
      return "warning";
    case "archived":
      return "muted";
    default:
      return "default";
  }
}

function statusLabel(
  status: string | null | undefined,
  isArabic: boolean,
) {
  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    published: {
      ar: "منشورة",
      en: "Published",
    },
    pending_review: {
      ar: "قيد المراجعة",
      en: "Pending Review",
    },
    needs_changes: {
      ar: "تحتاج تعديل",
      en: "Needs Changes",
    },
    rejected: {
      ar: "مرفوضة",
      en: "Rejected",
    },
    closed: {
      ar: "مغلقة",
      en: "Closed",
    },
    archived: {
      ar: "مؤرشفة",
      en: "Archived",
    },
    draft: {
      ar: "مسودة",
      en: "Draft",
    },
  };

  const key = String(status ?? "").trim();
  const label = labels[key];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return status || (isArabic ? "غير معروفة" : "Unknown");
}

function buildHref(
  status?: string,
  q?: string,
  publisher?: string,
  lang?: string,
) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (publisher) params.set("publisher", publisher);
  if (lang) params.set("lang", lang);

  const query = params.toString();

  return query
    ? `/admin/opportunities?${query}`
    : "/admin/opportunities";
}

function countByStatus(
  opportunities: OpportunityRow[],
  status: string,
) {
  return opportunities.filter(
    (item) => item.status === status,
  ).length;
}

function formatCompensation(
  compensationType: unknown,
  budget: unknown,
  isArabic: boolean,
) {
  const type = String(compensationType ?? "")
    .trim()
    .toLowerCase();

  if (type === "unpaid") {
    return isArabic ? "غير مدفوع" : "Unpaid";
  }

  if (type === "negotiable") {
    return isArabic ? "حسب الاتفاق" : "Negotiable";
  }

  const amount = Number(
    String(budget ?? "").replaceAll(",", ""),
  );

  if (Number.isFinite(amount) && amount > 0) {
    const formatted = new Intl.NumberFormat(
      "en-US",
      {
        maximumFractionDigits: 0,
      },
    ).format(amount);

    return isArabic
      ? `${formatted} ريال`
      : `SAR ${formatted}`;
  }

  return isArabic ? "غير محدد" : "Not specified";
}

function opportunityTypeLabel(
  value: string | null | undefined,
  isArabic: boolean,
) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    actor: {
      ar: "ممثل / ممثلة",
      en: "Actor",
    },
    actress: {
      ar: "ممثلة",
      en: "Actress",
    },
    model: {
      ar: "مودل",
      en: "Model",
    },
    makeup_artist: {
      ar: "خبير مكياج",
      en: "Makeup Artist",
    },
    photographer: {
      ar: "مصور",
      en: "Photographer",
    },
    influencer: {
      ar: "صانع محتوى",
      en: "Influencer",
    },
    presenter: {
      ar: "مقدم",
      en: "Presenter",
    },
  };

  const label = labels[normalized];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return value?.replaceAll("_", " ") || "—";
}

function genderLabel(
  value: string | null | undefined,
  isArabic: boolean,
) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    any: {
      ar: "الجميع",
      en: "Any",
    },
    male: {
      ar: "ذكر",
      en: "Male",
    },
    female: {
      ar: "أنثى",
      en: "Female",
    },
  };

  const label = labels[normalized];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return value || "—";
}

function cityLabel(
  cityAr: string | null | undefined,
  cityEn: string | null | undefined,
  isArabic: boolean,
) {
  if (isArabic && cityAr) {
    return cityAr;
  }

  if (!isArabic && cityEn) {
    return cityEn;
  }

  const raw = cityEn ?? cityAr;

  if (!raw) return "—";

  const normalized = raw.trim().toLowerCase();

  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    riyadh: {
      ar: "الرياض",
      en: "Riyadh",
    },
    jeddah: {
      ar: "جدة",
      en: "Jeddah",
    },
    dammam: {
      ar: "الدمام",
      en: "Dammam",
    },
    khobar: {
      ar: "الخبر",
      en: "Khobar",
    },
    makkah: {
      ar: "مكة",
      en: "Makkah",
    },
    madinah: {
      ar: "المدينة المنورة",
      en: "Madinah",
    },
  };

  const label = labels[normalized];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return raw;
}

function formatAge(
  minAge: number | null | undefined,
  maxAge: number | null | undefined,
  isArabic: boolean,
) {
  const hasMin =
    typeof minAge === "number" &&
    Number.isFinite(minAge);

  const hasMax =
    typeof maxAge === "number" &&
    Number.isFinite(maxAge);

  if (!hasMin && !hasMax) {
    return "—";
  }

  if (
    hasMin &&
    hasMax &&
    minAge === maxAge
  ) {
    return isArabic
      ? `${minAge} سنة`
      : `${minAge} years`;
  }

  if (hasMin && hasMax) {
    return isArabic
      ? `${minAge} – ${maxAge} سنة`
      : `${minAge} – ${maxAge} years`;
  }

  if (hasMin) {
    return isArabic
      ? `${minAge} سنة فأكثر`
      : `${minAge}+ years`;
  }

  return isArabic
    ? `حتى ${maxAge} سنة`
    : `Up to ${maxAge} years`;
}

function formatWorkDuration(
  value: string | null | undefined,
  isArabic: boolean,
) {
  if (!value) return "—";

  const normalized = value
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");

  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    "1_hour": {
      ar: "ساعة",
      en: "1 hour",
    },
    "2_hours": {
      ar: "ساعتان",
      en: "2 hours",
    },
    "3_hours": {
      ar: "3 ساعات",
      en: "3 hours",
    },
    "4_hours": {
      ar: "4 ساعات",
      en: "4 hours",
    },
    "6_hours": {
      ar: "6 ساعات",
      en: "6 hours",
    },
    "8_hours": {
      ar: "8 ساعات",
      en: "8 hours",
    },
    full_day: {
      ar: "يوم كامل",
      en: "Full day",
    },
  };

  const label = labels[normalized];

  if (label) {
    return isArabic ? label.ar : label.en;
  }

  return value.replaceAll("_", " ");
}

export default async function AdminOpportunitiesPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const {
    status,
    q,
    publisher,
    lang,
  } = await searchParams;

  const language =
    lang === "en" ? "en" : "ar";

  const isArabic =
    language === "ar";

  const publisherId = Number(publisher);

  const hasPublisherFilter =
    Number.isInteger(publisherId) &&
    publisherId > 0;

  const allOpportunities =
    (await OpportunityService.getAll({
      status,
      search: q,
    })) as OpportunityRow[];

  let opportunities = allOpportunities;

  let filteredPublisherName:
    | string
    | null = null;

  if (hasPublisherFilter) {
    const adminClient =
      createAdminClient();

    const {
      data: publisherData,
      error: publisherError,
    } = await adminClient
      .from("publishers")
      .select("id, company_name")
      .eq("id", publisherId)
      .maybeSingle();

    if (publisherError) {
      console.error(
        "[Admin opportunities publisher]",
        publisherError,
      );
    }

    filteredPublisherName =
      publisherData?.company_name ??
      null;

    const {
      data: publisherOpportunityData,
      error: publisherOpportunityError,
    } = await adminClient
      .from("opportunities")
      .select("id")
      .eq(
        "publisher_id",
        publisherId,
      );

    if (publisherOpportunityError) {
      console.error(
        "[Admin opportunities publisher filter]",
        publisherOpportunityError,
      );
    } else {
      const allowedIds = new Set(
        (publisherOpportunityData ?? []).map(
          (item) => item.id,
        ),
      );

      opportunities =
        allOpportunities.filter(
          (item) =>
            allowedIds.has(item.id),
        );
    }
  }

  const total = opportunities.length;

  const pendingCount = countByStatus(
    opportunities,
    "pending_review",
  );

  const publishedCount = countByStatus(
    opportunities,
    "published",
  );

  const needsChangesCount = countByStatus(
    opportunities,
    "needs_changes",
  );

  const rejectedCount = countByStatus(
    opportunities,
    "rejected",
  );

  const closedCount = countByStatus(
    opportunities,
    "closed",
  );

  const archivedCount = countByStatus(
    opportunities,
    "archived",
  );

  return (
    <AdminPageContainer>
      <div dir={isArabic ? "rtl" : "ltr"}>
        <AdminPageHeader
          title={
            isArabic
              ? "إدارة الفرص"
              : "Opportunity Management"
          }
          description={
            isArabic
              ? "راجع الفرص واعتمدها أو اطلب تعديلها، وتابع حالتها من مكان واحد."
              : "Review, approve, publish, hide, and monitor all platform opportunities."
          }
        />

        {hasPublisherFilter ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-gold/[0.05] px-5 py-4">
            <div>
              <p
                className={[
                  "text-[10px] text-gold",
                  isArabic
                    ? "tracking-normal"
                    : "uppercase tracking-[0.25em]",
                ].join(" ")}
              >
                {isArabic
                  ? "فلتر الناشر"
                  : "Publisher Filter"}
              </p>

              <p className="mt-1 text-sm text-white/75">
                {isArabic
                  ? `عرض فرص: ${
                      filteredPublisherName ??
                      `الناشر #${publisherId}`
                    }`
                  : `Showing opportunities for: ${
                      filteredPublisherName ??
                      `Publisher #${publisherId}`
                    }`}
              </p>
            </div>

            <Link
              href={`/admin/opportunities?lang=${language}`}
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold"
            >
              {isArabic
                ? "عرض جميع الفرص"
                : "View All Opportunities"}
            </Link>
          </div>
        ) : null}

        <AdminGrid className="mb-8 md:grid-cols-3 xl:grid-cols-7">
          <AdminStatCard
            label={isArabic ? "الكل" : "All"}
            value={total}
            active={!status}
            href={buildHref(
              undefined,
              q,
              publisher,
              language,
            )}
          />

          <AdminStatCard
            label={
              isArabic
                ? "قيد المراجعة"
                : "Pending"
            }
            value={pendingCount}
            active={
              status === "pending_review"
            }
            href={buildHref(
              "pending_review",
              q,
              publisher,
              language,
            )}
          />

          <AdminStatCard
            label={
              isArabic
                ? "منشورة"
                : "Published"
            }
            value={publishedCount}
            active={
              status === "published"
            }
            href={buildHref(
              "published",
              q,
              publisher,
              language,
            )}
          />

          <AdminStatCard
            label={
              isArabic
                ? "تحتاج تعديل"
                : "Needs Changes"
            }
            value={needsChangesCount}
            active={
              status === "needs_changes"
            }
            href={buildHref(
              "needs_changes",
              q,
              publisher,
              language,
            )}
          />

          <AdminStatCard
            label={
              isArabic
                ? "مرفوضة"
                : "Rejected"
            }
            value={rejectedCount}
            active={
              status === "rejected"
            }
            href={buildHref(
              "rejected",
              q,
              publisher,
              language,
            )}
          />

          <AdminStatCard
            label={
              isArabic
                ? "مغلقة"
                : "Closed"
            }
            value={closedCount}
            active={
              status === "closed"
            }
            href={buildHref(
              "closed",
              q,
              publisher,
              language,
            )}
          />

          <AdminStatCard
            label={
              isArabic
                ? "مؤرشفة"
                : "Archived"
            }
            value={archivedCount}
            active={
              status === "archived"
            }
            href={buildHref(
              "archived",
              q,
              publisher,
              language,
            )}
          />
        </AdminGrid>

        <form
          method="GET"
          className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-5"
        >
          {hasPublisherFilter ? (
            <input
              type="hidden"
              name="publisher"
              value={publisherId}
            />
          ) : null}

          <input
            type="hidden"
            name="lang"
            value={language}
          />

          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder={
                isArabic
                  ? "ابحث بالعنوان أو الجهة أو المدينة..."
                  : "Search title, company, or city..."
              }
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30"
            />

            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none"
            >
              <option value="">
                {isArabic
                  ? "جميع الحالات"
                  : "All Statuses"}
              </option>

              <option value="pending_review">
                {isArabic
                  ? "قيد المراجعة"
                  : "Pending Review"}
              </option>

              <option value="published">
                {isArabic
                  ? "منشورة"
                  : "Published"}
              </option>

              <option value="needs_changes">
                {isArabic
                  ? "تحتاج تعديل"
                  : "Needs Changes"}
              </option>

              <option value="rejected">
                {isArabic
                  ? "مرفوضة"
                  : "Rejected"}
              </option>

              <option value="closed">
                {isArabic
                  ? "مغلقة"
                  : "Closed"}
              </option>

              <option value="archived">
                {isArabic
                  ? "مؤرشفة"
                  : "Archived"}
              </option>
            </select>

            <button
              type="submit"
              className="rounded-2xl border border-gold/40 px-8 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              {isArabic
                ? "بحث"
                : "Search"}
            </button>
          </div>
        </form>

        {opportunities.length === 0 ? (
          <AdminEmptyState
            message={
              isArabic
                ? "لا توجد فرص مطابقة."
                : "No opportunities found."
            }
          />
        ) : (
          <AdminGrid>
            {opportunities.map(
              (opportunity) => (
                <AdminCard
                  key={opportunity.id}
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <AdminBadge
                          variant={getStatusVariant(
                            opportunity.status,
                          )}
                        >
                          {statusLabel(
                            opportunity.status,
                            isArabic,
                          )}
                        </AdminBadge>

                        <span
                          className={[
                            "text-[10px] text-white/35",
                            isArabic
                              ? "tracking-normal"
                              : "uppercase tracking-[0.25em]",
                          ].join(" ")}
                        >
                          {isArabic
                            ? `الفرصة #${opportunity.id}`
                            : `Opportunity #${opportunity.id}`}
                        </span>
                      </div>

                      <h2 className="text-2xl font-light text-white">
                        {opportunity.title ||
                          (isArabic
                            ? "فرصة بدون عنوان"
                            : "Untitled Opportunity")}
                      </h2>

                      <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-gray-muted">
                        {opportunity.description ||
                          "—"}
                      </p>
                    </div>

                    <div
                      className={
                        isArabic
                          ? "text-right"
                          : "text-left lg:text-right"
                      }
                    >
                      <p
                        className={[
                          "text-[10px] text-white/35",
                          isArabic
                            ? "tracking-normal"
                            : "uppercase tracking-[0.25em]",
                        ].join(" ")}
                      >
                        {isArabic
                          ? "تاريخ الإنشاء"
                          : "Created"}
                      </p>

                      <p className="mt-1 text-sm text-gray-muted">
                        {formatDate(
                          opportunity.created_at,
                          isArabic,
                        )}
                      </p>
                    </div>
                  </div>

                  <AdminInfoGrid>
  <AdminInfoItem
    label={
      isArabic
        ? "الجهة"
        : "Company"
    }
    value={opportunity.company_name}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "نوع الموهبة"
        : "Type"
    }
    value={opportunityTypeLabel(
      opportunity.opportunity_type,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "المدينة"
        : "City"
    }
    value={cityLabel(
      opportunity.city_ar,
      opportunity.city_en,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "الجنس المطلوب"
        : "Gender"
    }
    value={genderLabel(
      opportunity.required_gender,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "الفئة العمرية"
        : "Age"
    }
    value={formatAge(
      opportunity.min_age,
      opportunity.max_age,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "العدد المطلوب"
        : "Required Count"
    }
    value={
      opportunity.required_count != null
        ? String(opportunity.required_count)
        : "—"
    }
  />

  <AdminInfoItem
    label={
      isArabic
        ? "المقابل المالي"
        : "Compensation"
    }
    value={formatCompensation(
      opportunity.compensation_type,
      opportunity.budget,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "تاريخ العمل"
        : "Work Date"
    }
    value={formatDate(
      opportunity.work_date,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "وقت العمل"
        : "Work Time"
    }
    value={opportunity.work_time || "—"}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "مدة العمل"
        : "Work Duration"
    }
    value={formatWorkDuration(
      opportunity.work_duration,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "مدة استقبال الطلبات"
        : "Application Period"
    }
    value={
      opportunity.application_days != null
        ? isArabic
          ? `${opportunity.application_days} يوم`
          : `${opportunity.application_days} days`
        : "—"
    }
  />

  <AdminInfoItem
    label={
      isArabic
        ? "بداية استقبال الطلبات"
        : "Applications Start"
    }
    value={formatDate(
      opportunity.application_start_date,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "نهاية استقبال الطلبات"
        : "Applications Deadline"
    }
    value={formatDate(
      opportunity.application_deadline,
      isArabic,
    )}
  />

  <AdminInfoItem
    label={
      isArabic
        ? "نوع النشر"
        : "Posting Mode"
    }
    value={
      opportunity.posting_mode === "quick"
        ? isArabic
          ? "فرصة سريعة"
          : "Quick"
        : opportunity.posting_mode === "project"
          ? isArabic
            ? "مشروع"
            : "Project"
          : opportunity.posting_mode || "—"
    }
  />
</AdminInfoGrid>

                  {/* Primary actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-5">
                    <Link
                      href={`/admin/opportunities/${opportunity.id}?lang=${language}`}
                      className={[
                        "inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-3 text-[10px] text-white/70 transition hover:border-gold/40 hover:text-gold",
                        isArabic
                          ? "tracking-normal"
                          : "uppercase tracking-[0.25em]",
                      ].join(" ")}
                    >
                      {isArabic
                        ? "تفاصيل الإدارة"
                        : "Admin Details"}
                    </Link>

                    {opportunity.slug ? (
                      <Link
                        href={`/${language}/opportunities/${opportunity.slug}`}
                        target="_blank"
                        className={[
                          "inline-flex min-h-11 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] text-gold transition hover:bg-gold/10",
                          isArabic
                            ? "tracking-normal"
                            : "uppercase tracking-[0.25em]",
                        ].join(" ")}
                      >
                        {isArabic
                          ? "عرض الصفحة العامة"
                          : "View Public"}
                      </Link>
                    ) : null}

                    {opportunity.status !==
                    "published" ? (
                      <form
                        action={
                          publishOpportunityAction
                        }
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={opportunity.id}
                        />

                        <input
                          type="hidden"
                          name="locale"
                          value={language}
                        />

                        <AdminActionButton
                          type="submit"
                          variant="success"
                        >
                          {isArabic
                            ? "اعتماد ونشر"
                            : "Approve & Publish"}
                        </AdminActionButton>
                      </form>
                    ) : (
                      <form
                        action={
                          hideOpportunityAction
                        }
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={opportunity.id}
                        />

                        <input
                          type="hidden"
                          name="locale"
                          value={language}
                        />

                        <AdminActionButton
                          type="submit"
                          variant="warning"
                        >
                          {isArabic
                            ? "إخفاء"
                            : "Hide"}
                        </AdminActionButton>
                      </form>
                    )}

                    {opportunity.status !==
                    "archived" ? (
                      <form
                        action={
                          archiveOpportunityAction
                        }
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={opportunity.id}
                        />

                        <input
                          type="hidden"
                          name="locale"
                          value={language}
                        />

                        <AdminActionButton
                          type="submit"
                        >
                          {isArabic
                            ? "أرشفة"
                            : "Archive"}
                        </AdminActionButton>
                      </form>
                    ) : null}
                  </div>

                  {/* Review decisions */}
                  {(opportunity.status !==
  "rejected" &&
  opportunity.status !==
    "needs_changes") ? (
                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      {opportunity.status !==
                      "needs_changes" ? (
                        <form
                          action={
                            requestChangesOpportunityAction
                          }
                          className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-4"
                        >
                          <label className="mb-3 block text-sm font-medium text-amber-200">
                            {isArabic
                              ? "طلب تعديل"
                              : "Request Changes"}
                          </label>

                          <input
                            type="hidden"
                            name="id"
                            value={
                              opportunity.id
                            }
                          />

                          <input
                            type="hidden"
                            name="locale"
                            value={language}
                          />

                          <textarea
                            required
                            name="reason"
                            rows={2}
                            maxLength={1000}
                            placeholder={
                              isArabic
                                ? "اكتب التعديلات المطلوبة..."
                                : "Describe the required changes..."
                            }
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-amber-400/30"
                          />

                          <textarea
                            name="admin_note"
                            rows={2}
                            maxLength={2000}
                            placeholder={
                              isArabic
                                ? "ملاحظة داخلية اختيارية..."
                                : "Optional internal note..."
                            }
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                          />

                          <AdminActionButton
                            type="submit"
                            variant="warning"
                          >
                            {isArabic
                              ? "إرسال طلب التعديل"
                              : "Request Changes"}
                          </AdminActionButton>
                        </form>
                      ) : null}

                      {opportunity.status !==
                      "rejected" ? (
                        <form
                          action={
                            rejectOpportunityAction
                          }
                          className="rounded-2xl border border-red-400/10 bg-red-400/[0.025] p-4"
                        >
                          <label className="mb-3 block text-sm font-medium text-red-200">
                            {isArabic
                              ? "رفض الفرصة"
                              : "Reject Opportunity"}
                          </label>

                          <input
                            type="hidden"
                            name="id"
                            value={
                              opportunity.id
                            }
                          />

                          <input
                            type="hidden"
                            name="locale"
                            value={language}
                          />

                          <textarea
                            required
                            name="reason"
                            rows={2}
                            maxLength={1000}
                            placeholder={
                              isArabic
                                ? "اكتب سبب رفض الفرصة..."
                                : "Enter the rejection reason..."
                            }
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/30"
                          />

                          <textarea
                            name="admin_note"
                            rows={2}
                            maxLength={2000}
                            placeholder={
                              isArabic
                                ? "ملاحظة داخلية اختيارية..."
                                : "Optional internal note..."
                            }
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
                          />

                          <AdminActionButton
                            type="submit"
                            variant="danger"
                          >
                            {isArabic
                              ? "رفض"
                              : "Reject"}
                          </AdminActionButton>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </AdminCard>
              ),
            )}
          </AdminGrid>
        )}
      </div>
    </AdminPageContainer>
  );
}
