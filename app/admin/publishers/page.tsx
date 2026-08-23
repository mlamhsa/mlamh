import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";

import { requireAdminAccess } from "@/lib/auth/require-admin";

import {
  approvePublisherVerificationAction,
  rejectPublisherVerificationAction,
} from "@/lib/actions/admin-publisher-verification";

import {
  PublisherService,
} from "@/lib/services/publishers/PublisherService";

import type {
  AdminPublisher,
  PublisherApprovalStatus,
} from "@/lib/repositories/publishers/PublisherRepository";

export const metadata = {
  title: "Publishers — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type PublisherFilter =
  | "all"
  | "pending"
  | "resubmitted"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "verification_pending"
  | "verified_organizations"
  | "unverified_organizations"
  | "individuals";

  type PageProps = {
    searchParams: Promise<{
      lang?: string;
      status?: string;
      publisher?: string;
    }>;
  };

function parsePublisherId(
  formData: FormData,
): number {
  const id = Number(
    formData.get("id"),
  );

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid publisher id.",
    );
  }

  return id;
}

function getLocale(
  formData: FormData,
): "ar" | "en" {
  return formData.get("locale") === "en"
    ? "en"
    : "ar";
}

function optionalText(
  formData: FormData,
  key: string,
) {
  const value =
    formData.get(key);

  if (
    typeof value !== "string"
  ) {
    return null;
  }

  return value.trim() || null;
}

function revalidatePublisherPaths() {
  revalidatePath(
    "/admin/publishers",
  );

  revalidatePath(
    "/ar/publisher-dashboard",
  );

  revalidatePath(
    "/en/publisher-dashboard",
  );

  revalidatePath(
    "/ar/publisher-dashboard/profile",
  );

  revalidatePath(
    "/en/publisher-dashboard/profile",
  );
}

async function approvePublisherAction(
  formData: FormData,
) {
  "use server";

  const adminUser =
    await requireAdminAccess();

  const id =
    parsePublisherId(
      formData,
    );

  const locale =
    getLocale(formData);

  await PublisherService.approve(
    id,
    {
      reviewerUserId:
        adminUser.id,

      locale,

      adminNote:
        optionalText(
          formData,
          "admin_note",
        ),
    },
  );

  revalidatePublisherPaths();
revalidatePath("/admin/action-center");

redirect(
  `/admin/action-center?lang=${locale}`,
);
}

async function requestPublisherChangesAction(
  formData: FormData,
) {
  "use server";

  const adminUser =
    await requireAdminAccess();

  const id =
    parsePublisherId(
      formData,
    );

  const locale =
    getLocale(formData);

  const reason =
    optionalText(
      formData,
      "reason",
    );

  await PublisherService.requestChanges(
    id,
    {
      reviewerUserId:
        adminUser.id,

      locale,

      reason,

      adminNote:
        optionalText(
          formData,
          "admin_note",
        ),
    },
  );

  revalidatePublisherPaths();
revalidatePath("/admin/action-center");

redirect(
  `/admin/action-center?lang=${locale}`,
);
}

async function rejectPublisherAction(
  formData: FormData,
) {
  "use server";

  const adminUser =
    await requireAdminAccess();

  const id =
    parsePublisherId(
      formData,
    );

  const locale =
    getLocale(formData);

  const reason =
    optionalText(
      formData,
      "reason",
    );

  await PublisherService.reject(
    id,
    {
      reviewerUserId:
        adminUser.id,

      locale,

      reason,

      adminNote:
        optionalText(
          formData,
          "admin_note",
        ),
    },
  );

  revalidatePublisherPaths();
revalidatePath("/admin/action-center");

redirect(
  `/admin/action-center?lang=${locale}`,
);
}

function formatDate(
  value:
    | string
    | null
    | undefined,
  language: "ar" | "en",
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    language === "ar"
      ? "ar-SA"
      : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function formatDateTime(
  value:
    | string
    | null
    | undefined,
  language: "ar" | "en",
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    language === "ar"
      ? "ar-SA"
      : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getStatusLabel(
  status: PublisherApprovalStatus,
  isArabic: boolean,
) {
  switch (status) {
    case "approved":
      return isArabic
        ? "معتمد"
        : "Approved";

    case "pending":
      return isArabic
        ? "قيد المراجعة"
        : "Pending";

    case "changes_requested":
      return isArabic
        ? "مطلوب تعديل"
        : "Changes requested";

    case "rejected":
      return isArabic
        ? "مرفوض"
        : "Rejected";

    case "suspended":
      return isArabic
        ? "موقوف"
        : "Suspended";

    default:
      return isArabic
        ? "غير مرسل"
        : "Not submitted";
  }
}

function getStatusVariant(
  status: PublisherApprovalStatus,
):
  | "success"
  | "gold"
  | "danger"
  | "default" {
  switch (status) {
    case "approved":
      return "success";

    case "pending":
    case "changes_requested":
      return "gold";

    case "rejected":
    case "suspended":
      return "danger";

    default:
      return "default";
  }
}

function getVerificationStatusLabel(
  status: string | null | undefined,
  isArabic: boolean,
) {
  switch (status) {
    case "verified":
      return isArabic
        ? "موثقة"
        : "Verified";

    case "pending":
      return isArabic
        ? "التوثيق قيد المراجعة"
        : "Verification Pending";

    case "rejected":
      return isArabic
        ? "التوثيق مرفوض"
        : "Verification Rejected";

    default:
      return isArabic
        ? "غير موثقة"
        : "Unverified";
  }
}

function getVerificationStatusClasses(
  status: string | null | undefined,
) {
  switch (status) {
    case "verified":
      return "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300";

    case "pending":
      return "border-amber-400/20 bg-amber-400/[0.07] text-amber-200";

    case "rejected":
      return "border-red-400/20 bg-red-400/[0.07] text-red-300";

    default:
      return "border-white/10 bg-white/[0.03] text-white/40";
  }
}

function getVerificationMethodLabel(
  method: string | null | undefined,
  isArabic: boolean,
) {
  switch (method) {
    case "company_email":
      return isArabic
        ? "البريد الرسمي للجهة"
        : "Official Company Email";

    case "official_document":
      return isArabic
        ? "وثيقة رسمية"
        : "Official Document";

    case "business_card":
      return isArabic
        ? "بطاقة عمل"
        : "Business Card";

    default:
      return "—";
  }
}

function getFilter(
  value?: string,
): PublisherFilter {
  switch (value) {
    case "pending":
    case "resubmitted":
    case "changes_requested":
    case "approved":
    case "rejected":
    case "verification_pending":
    case "verified_organizations":
    case "unverified_organizations":
    case "individuals":
      return value;

    default:
      return "all";
  }
}

function buildFilterHref(
  language: "ar" | "en",
  filter: PublisherFilter,
) {
  const params =
    new URLSearchParams();

  params.set(
    "lang",
    language,
  );

  if (filter !== "all") {
    params.set(
      "status",
      filter,
    );
  }

  return `/admin/publishers?${params.toString()}`;
}

function filterPublishers(
  publishers: AdminPublisher[],
  filter: PublisherFilter,
) {
  if (filter === "all") {
    return publishers;
  }

  if (filter === "resubmitted") {
    return publishers.filter(
      (publisher) =>
        publisher.is_resubmitted_after_changes,
    );
  }

  if (filter === "pending") {
    return publishers.filter(
      (publisher) =>
        publisher.approval_status === "pending" &&
        !publisher.is_resubmitted_after_changes,
    );
  }

  if (filter === "verification_pending") {
    return publishers.filter(
      (publisher) =>
        publisher.publisher_type !== "individual" &&
        publisher.verification_status === "pending",
    );
  }

  if (filter === "verified_organizations") {
    return publishers.filter(
      (publisher) =>
        publisher.publisher_type !== "individual" &&
        publisher.verification_status === "verified",
    );
  }

  if (filter === "unverified_organizations") {
    return publishers.filter(
      (publisher) =>
        publisher.publisher_type !== "individual" &&
        (
          publisher.verification_status === "unverified" ||
          publisher.verification_status === "rejected" ||
          !publisher.verification_status
        ),
    );
  }

  if (filter === "individuals") {
    return publishers.filter(
      (publisher) =>
        publisher.publisher_type === "individual",
    );
  }

  return publishers.filter(
    (publisher) =>
      publisher.approval_status === filter,
  );
}

function sortPublishers(
  publishers: AdminPublisher[],
) {
  return [
    ...publishers,
  ].sort(
    (a, b) => {if (
      a.verification_status === "pending" &&
      b.verification_status !== "pending"
    ) {
      return -1;
    }
    
    if (
      b.verification_status === "pending" &&
      a.verification_status !== "pending"
    ) {
      return 1;
    }
      /*
       * الحساب المعاد بعد التعديل
       * يظهر أولًا.
       */
      if (
        a.is_resubmitted_after_changes !==
        b.is_resubmitted_after_changes
      ) {
        return a.is_resubmitted_after_changes
          ? -1
          : 1;
      }

      /*
       * ثم الحسابات قيد المراجعة.
       */
      if (
        a.approval_status ===
          "pending" &&
        b.approval_status !==
          "pending"
      ) {
        return -1;
      }

      if (
        b.approval_status ===
          "pending" &&
        a.approval_status !==
          "pending"
      ) {
        return 1;
      }

      /*
       * ثم الأحدث تعديلًا.
       */
      const aDate =
        new Date(
          a.account_updated_at ??
            a.created_at,
        ).getTime();

      const bDate =
        new Date(
          b.account_updated_at ??
            b.created_at,
        ).getTime();

      return bDate - aDate;
    },
  );
}

function FilterCard({
  href,
  active,
  label,
  value,
}: {
  href: string;
  active: boolean;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl transition ${
        active
          ? "ring-1 ring-gold/60"
          : "hover:-translate-y-0.5 hover:ring-1 hover:ring-white/10"
      }`}
    >
      <AdminStatCard
        label={label}
        value={value}
      />
    </Link>
  );
}

function getPublisherTypeLabel(
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
    talent_agency: {
      ar: "وكالة مواهب",
      en: "Talent Agency",
    },
    agency: {
      ar: "وكالة",
      en: "Agency",
    },
    production_company: {
      ar: "شركة إنتاج",
      en: "Production Company",
    },
    company: {
      ar: "شركة أو مؤسسة",
      en: "Company",
    },
    brand: {
      ar: "علامة تجارية",
      en: "Brand",
    },
    casting_agency: {
      ar: "وكالة كاستينغ",
      en: "Casting Agency",
    },
  };

  const match = labels[normalized];

  return match
    ? isArabic
      ? match.ar
      : match.en
    : value || "—";
}

function getCityLabel(
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

  const match = labels[normalized];

  return match
    ? isArabic
      ? match.ar
      : match.en
    : value || "—";
}

export default async function AdminPublishersPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const params =
    await searchParams;

  const language:
    "ar" | "en" =
      params.lang === "en"
        ? "en"
        : "ar";

  const isArabic =
    language === "ar";

  const activeFilter =
    getFilter(
      params.status,
    );

    const selectedPublisherId =
  params.publisher &&
  Number.isInteger(Number(params.publisher)) &&
  Number(params.publisher) > 0
    ? Number(params.publisher)
    : null;

    const isReviewMode =
    selectedPublisherId !== null;

  const publishers =
    await PublisherService.getAll();

  const total =
    publishers.length;
  
  const resubmitted =
    publishers.filter(
      (publisher) =>
        publisher
          .is_resubmitted_after_changes,
    ).length;
  
  const newPending =
    publishers.filter(
      (publisher) =>
        publisher.approval_status ===
          "pending" &&
        !publisher
          .is_resubmitted_after_changes,
    ).length;

  const changesRequested =
    publishers.filter(
      (publisher) =>
        publisher.approval_status ===
        "changes_requested",
    ).length;

  const approved =
    publishers.filter(
      (publisher) =>
        publisher.approval_status ===
        "approved",
    ).length;

  const rejected =
    publishers.filter(
      (publisher) =>
        publisher.approval_status ===
        "rejected",
    ).length;
    const verificationPending =
    publishers.filter(
      (publisher) =>
        publisher.publisher_type !== "individual" &&
        publisher.verification_status === "pending",
    ).length;
  
  const verifiedOrganizations =
    publishers.filter(
      (publisher) =>
        publisher.publisher_type !== "individual" &&
        publisher.verification_status === "verified",
    ).length;
  
  const unverifiedOrganizations =
    publishers.filter(
      (publisher) =>
        publisher.publisher_type !== "individual" &&
        (
          publisher.verification_status === "unverified" ||
          publisher.verification_status === "rejected" ||
          !publisher.verification_status
        ),
    ).length;
  
  const individualPublishers =
    publishers.filter(
      (publisher) =>
        publisher.publisher_type === "individual",
    ).length;

  const filteredPublishers =
  selectedPublisherId !== null
    ? publishers.filter(
        (publisher) =>
          Number(publisher.id) ===
          selectedPublisherId,
      )
    : sortPublishers(
        filterPublishers(
          publishers,
          activeFilter,
        ),
      );

  let activeFilterLabel: string;

switch (activeFilter) {
  case "pending":
    activeFilterLabel = isArabic
      ? "قيد مراجعة الملف"
      : "Profile Pending";
    break;

  case "resubmitted":
    activeFilterLabel = isArabic
      ? "أعيد للمراجعة"
      : "Resubmitted";
    break;

  case "changes_requested":
    activeFilterLabel = isArabic
      ? "مطلوب تعديل"
      : "Changes Requested";
    break;

  case "approved":
    activeFilterLabel = isArabic
      ? "ملفات معتمدة"
      : "Approved Profiles";
    break;

  case "rejected":
    activeFilterLabel = isArabic
      ? "ملفات مرفوضة"
      : "Rejected Profiles";
    break;

  case "verification_pending":
    activeFilterLabel = isArabic
      ? "طلبات توثيق الجهات"
      : "Organization Verification Requests";
    break;

  case "verified_organizations":
    activeFilterLabel = isArabic
      ? "الجهات الموثقة"
      : "Verified Organizations";
    break;

  case "unverified_organizations":
    activeFilterLabel = isArabic
      ? "الجهات غير الموثقة"
      : "Unverified Organizations";
    break;

  case "individuals":
    activeFilterLabel = isArabic
      ? "الأفراد والمستقلون"
      : "Individuals & Freelancers";
    break;

  default:
    activeFilterLabel = isArabic
      ? "جميع الناشرين"
      : "All Publishers";
}

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
            <AdminPageHeader
        title={
          isReviewMode
            ? isArabic
              ? "مراجعة ملف الناشر"
              : "Review Publisher"
            : isArabic
              ? "إدارة الناشرين"
              : "Publisher Management"
        }
        description={
          isReviewMode
            ? isArabic
              ? "راجع بيانات الناشر كاملة ثم اتخذ قرار الاعتماد أو طلب التعديل أو الرفض."
              : "Review the publisher profile and make an approval decision."
            : isArabic
              ? "مراجعة حسابات الناشرين واعتمادها أو طلب تعديلها أو رفضها."
              : "Review publisher accounts, approve them, request changes, or reject them."
        }
      />

{!isReviewMode ? (
        <>
      {/* الفلاتر الرئيسية */}
      <section className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <FilterCard
          href={buildFilterHref(
            language,
            "all",
          )}
          active={
            activeFilter ===
            "all"
          }
          label={
            isArabic
              ? "إجمالي الناشرين"
              : "Total Publishers"
          }
          value={total}
        />

        <FilterCard
          href={buildFilterHref(
            language,
            "pending",
          )}
          active={
            activeFilter ===
            "pending"
          }
          label={
            isArabic
              ? "جديد للمراجعة"
              : "New for Review"
          }
          value={newPending}
        />

<FilterCard
  href={buildFilterHref(
    language,
    "resubmitted",
  )}
  active={
    activeFilter ===
    "resubmitted"
  }
  label={
    isArabic
      ? "أعيد للمراجعة"
      : "Resubmitted"
  }
  value={resubmitted}
/>

        <FilterCard
          href={buildFilterHref(
            language,
            "changes_requested",
          )}
          active={
            activeFilter ===
            "changes_requested"
          }
          label={
            isArabic
              ? "بانتظار تعديل الناشر"
              : "Waiting on Publisher"
          }
          value={
            changesRequested
          }
        />

        <FilterCard
          href={buildFilterHref(
            language,
            "approved",
          )}
          active={
            activeFilter ===
            "approved"
          }
          label={
            isArabic
              ? "معتمد"
              : "Approved"
          }
          value={approved}
        />

        <FilterCard
          href={buildFilterHref(
            language,
            "rejected",
          )}
          active={
            activeFilter ===
            "rejected"
          }
          label={
            isArabic
              ? "مرفوض"
              : "Rejected"
          }
          value={rejected}
        />
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
  <FilterCard
    href={buildFilterHref(
      language,
      "verification_pending",
    )}
    active={
      activeFilter ===
      "verification_pending"
    }
    label={
      isArabic
        ? "طلبات توثيق الجهات"
        : "Verification Requests"
    }
    value={verificationPending}
  />

  <FilterCard
    href={buildFilterHref(
      language,
      "verified_organizations",
    )}
    active={
      activeFilter ===
      "verified_organizations"
    }
    label={
      isArabic
        ? "جهات موثقة"
        : "Verified Organizations"
    }
    value={verifiedOrganizations}
  />

  <FilterCard
    href={buildFilterHref(
      language,
      "unverified_organizations",
    )}
    active={
      activeFilter ===
      "unverified_organizations"
    }
    label={
      isArabic
        ? "جهات غير موثقة"
        : "Unverified Organizations"
    }
    value={unverifiedOrganizations}
  />

  <FilterCard
    href={buildFilterHref(
      language,
      "individuals",
    )}
    active={
      activeFilter ===
      "individuals"
    }
    label={
      isArabic
        ? "أفراد / مستقلون"
        : "Individuals / Freelancers"
    }
    value={individualPublishers}
  />
</section>

      {/* فلتر مهم للحسابات التي عدلت ورجعت */}
      {resubmitted > 0 ? (
        <section className="mb-8">
          <Link
            href={buildFilterHref(
              language,
              "resubmitted",
            )}
            className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition ${
              activeFilter ===
              "resubmitted"
                ? "border-gold/50 bg-gold/[0.10]"
                : "border-amber-400/20 bg-amber-400/[0.045] hover:border-amber-400/40"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-amber-300">
                {isArabic
                  ? "حسابات أعيد إرسالها للمراجعة"
                  : "Profiles resubmitted for review"}
              </p>

              <p className="mt-1 text-xs text-white/40">
                {isArabic
                  ? "ناشرون نفذوا التعديلات المطلوبة وأعادوا ملفاتهم."
                  : "Publishers who completed requested changes and resubmitted their profiles."}
              </p>
            </div>

            <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-amber-400/10 px-3 text-lg text-amber-300">
              {resubmitted}
            </span>
          </Link>
        </section>
      ) : (
        <div className="mb-8" />
      )}

</>
      ) : (
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={`/admin/action-center?lang=${language}`}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.025] px-5 py-3 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            {isArabic
              ? "العودة إلى مركز الإجراءات"
              : "Back to Action Center"}
          </Link>

          <span className="text-xs text-white/35">
            {isArabic
              ? `مراجعة الناشر #${selectedPublisherId}`
              : `Reviewing publisher #${selectedPublisherId}`}
          </span>
        </div>
      )}
      
      {/* عنوان النتائج الحالية */}
      {!isReviewMode ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
            {isArabic
              ? "عرض القائمة"
              : "Current view"}
          </p>

          <h2 className="mt-1 text-xl font-light text-white">
            {activeFilterLabel}
          </h2>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-xs text-white/45">
          {isArabic
            ? `${filteredPublishers.length} ناشر`
            : `${filteredPublishers.length} publishers`}
        </span>
        </div>
      ) : null}

      {filteredPublishers.length ===
      0 ? (
        <AdminEmptyState
          message={
            isArabic
              ? "لا توجد حسابات ضمن هذا التصنيف."
              : "No publisher accounts in this category."
          }
        />
      ) : (
        <section className="grid gap-5">
          {filteredPublishers.map(
            (publisher) => {
              const status =
                publisher.approval_status;

              const publisherName =
                publisher.company_name ||
                publisher.contact_name ||
                publisher.display_name ||
                (isArabic
                  ? "ناشر بدون اسم"
                  : "Unnamed Publisher");

              return (
                <AdminCard
                  key={
                    publisher.id
                  }
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <AdminBadge
                          variant={getStatusVariant(
                            status,
                          )}
                        >
                          {getStatusLabel(
                            status,
                            isArabic,
                          )}
                        </AdminBadge>

                        {publisher
                          .is_resubmitted_after_changes ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1 text-[10px] font-medium text-amber-300">
                            {isArabic
                              ? "أعيد للمراجعة بعد التعديل"
                              : "Resubmitted after changes"}
                          </span>
                        ) : null}

                        <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                          {isArabic
                            ? `ناشر #${publisher.id}`
                            : `Publisher #${publisher.id}`}
                        </span>

                        {publisher.publisher_type !== "individual" ? (
  <span
    className={`rounded-full border px-3 py-1 text-[10px] ${getVerificationStatusClasses(
      publisher.verification_status,
    )}`}
  >
    {getVerificationStatusLabel(
      publisher.verification_status,
      isArabic,
    )}
  </span>
) : (
  <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.06] px-3 py-1 text-[10px] text-sky-300">
    {isArabic
      ? "فرد / مستقل"
      : "Individual / Freelancer"}
  </span>
)}
                      </div>

                      <h2 className="truncate text-2xl font-light text-white">
                        {
                          publisherName
                        }
                      </h2>

                      <p className="mt-2 text-sm text-white/50">
                      {getPublisherTypeLabel(
  publisher.publisher_type,
  isArabic,
)}
{" · "}
{getCityLabel(
  publisher.city,
  isArabic,
)}
                      </p>

                      <p className="mt-2 text-sm text-gray-muted">
                        {isArabic
                          ? "جهة الاتصال:"
                          : "Contact:"}{" "}

                        {publisher.contact_name ||
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
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                        {publisher
                          .is_resubmitted_after_changes
                          ? isArabic
                            ? "آخر تعديل وإعادة إرسال"
                            : "Last resubmission"
                          : isArabic
                            ? "آخر تحديث"
                            : "Last update"}
                      </p>

                      <p className="mt-1 text-sm text-gray-muted">
                        {formatDateTime(
                          publisher.account_updated_at ??
                            publisher.created_at,
                          language,
                        )}
                      </p>

                      <p className="mt-3 text-[10px] text-white/25">
                        {isArabic
                          ? `تاريخ الانضمام: ${formatDate(
                              publisher.created_at,
                              language,
                            )}`
                          : `Joined: ${formatDate(
                              publisher.created_at,
                              language,
                            )}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
  {/* معلومات الجهة */}
  <div>
    <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-gold">
      {isArabic
        ? "معلومات الجهة"
        : "Organisation Information"}
    </p>

    <AdminInfoGrid>
      <AdminInfoItem
        label={
          isArabic
            ? "اسم الجهة"
            : "Company Name"
        }
        value={publisher.company_name}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "نوع الجهة"
            : "Publisher Type"
        }
        value={getPublisherTypeLabel(
          publisher.publisher_type,
          isArabic,
        )}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "المدينة"
            : "City"
        }
        value={getCityLabel(
          publisher.city,
          isArabic,
        )}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "حجم الجهة"
            : "Company Size"
        }
        value={publisher.company_size}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "سنة التأسيس"
            : "Founded Year"
        }
        value={
          publisher.founded_year
            ? String(publisher.founded_year)
            : null
        }
      />

      <AdminInfoItem
        label={
          isArabic
            ? "حالة المراجعة"
            : "Review Status"
        }
        value={getStatusLabel(
          status,
          isArabic,
        )}
      />
    </AdminInfoGrid>
  </div>

  {/* المسؤول والتواصل */}
  <div>
    <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-gold">
      {isArabic
        ? "المسؤول وبيانات التواصل"
        : "Contact Information"}
    </p>

    <AdminInfoGrid>
      <AdminInfoItem
        label={
          isArabic
            ? "اسم المسؤول"
            : "Contact Name"
        }
        value={publisher.contact_name}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "البريد الإلكتروني"
            : "Email"
        }
        value={publisher.account_email}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "رقم الجوال"
            : "Phone"
        }
        value={publisher.account_phone}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "الموقع الإلكتروني"
            : "Website"
        }
        value={publisher.website}
      />

      <AdminInfoItem
        label="Instagram"
        value={publisher.instagram}
      />

      <AdminInfoItem
        label="TikTok"
        value={publisher.tiktok_url}
      />

      <AdminInfoItem
        label="Snapchat"
        value={publisher.snapchat_url}
      />

      <AdminInfoItem
        label="LinkedIn"
        value={publisher.linkedin_url}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "العنوان"
            : "Address"
        }
        value={publisher.address}
      />
    </AdminInfoGrid>
  </div>

  {/* نبذة الجهة */}
  {publisher.description ? (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-gold">
        {isArabic
          ? "نبذة عن الجهة"
          : "About the Organisation"}
      </p>

      <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">
        {publisher.description}
      </p>
    </div>
  ) : null}
</div>
{publisher.publisher_type !== "individual" ? (
  <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
          {isArabic
            ? "توثيق الجهة"
            : "Organization Verification"}
        </p>

        <p className="mt-2 text-sm text-white/45">
          {isArabic
            ? "التحقق من ارتباط حساب الناشر بالجهة التي يمثلها."
            : "Verify the publisher's connection to the organization."}
        </p>
      </div>

      <span
        className={`rounded-full border px-3 py-1 text-[10px] ${getVerificationStatusClasses(
          publisher.verification_status,
        )}`}
      >
        {getVerificationStatusLabel(
          publisher.verification_status,
          isArabic,
        )}
      </span>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <AdminInfoItem
        label={
          isArabic
            ? "طريقة التوثيق"
            : "Verification Method"
        }
        value={getVerificationMethodLabel(
          publisher.verification_method,
          isArabic,
        )}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "بريد التوثيق"
            : "Verification Email"
        }
        value={publisher.verification_email}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "تاريخ تقديم الطلب"
            : "Submitted At"
        }
        value={formatDateTime(
          publisher.verification_submitted_at,
          language,
        )}
      />

      <AdminInfoItem
        label={
          isArabic
            ? "تاريخ مراجعة التوثيق"
            : "Reviewed At"
        }
        value={formatDateTime(
          publisher.verification_reviewed_at,
          language,
        )}
      />
    </div>

    {publisher.verification_document_url ? (
      <a
        href={publisher.verification_document_url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-3 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
      >
        {isArabic
          ? "عرض مستند التوثيق"
          : "View Verification Document"}
      </a>
    ) : null}

    {publisher.verification_status === "pending" ? (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <form
          action={approvePublisherVerificationAction}
          className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.03] p-4"
        >
          <input
            type="hidden"
            name="id"
            value={publisher.id}
          />

          <input
            type="hidden"
            name="locale"
            value={language}
          />

          <p className="text-sm text-white/60">
            {isArabic
              ? "اعتماد ارتباط هذا الحساب بالجهة."
              : "Approve this account's connection to the organization."}
          </p>

          <AdminActionButton
            type="submit"
            variant="success"
          >
            {isArabic
              ? "اعتماد التوثيق"
              : "Approve Verification"}
          </AdminActionButton>
        </form>

        <form
          action={rejectPublisherVerificationAction}
          className="rounded-2xl border border-red-400/15 bg-red-400/[0.03] p-4"
        >
          <input
            type="hidden"
            name="id"
            value={publisher.id}
          />

          <input
            type="hidden"
            name="locale"
            value={language}
          />

          <p className="text-sm text-white/60">
            {isArabic
              ? "رفض إثبات ارتباط الحساب بهذه الجهة."
              : "Reject the submitted organization verification."}
          </p>
          <label className="mb-2 mt-4 block text-xs text-white/45">
  {isArabic
    ? "سبب رفض التوثيق"
    : "Verification Rejection Reason"}
</label>

<textarea
  required
  name="verification_rejection_reason"
  rows={3}
  maxLength={1000}
  placeholder={
    isArabic
      ? "وضح سبب عدم قبول إثبات ارتباط الحساب بالجهة..."
      : "Explain why the organization verification could not be accepted..."
  }
  className="mb-4 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-red-400/30"
/>

          <AdminActionButton
            type="submit"
            variant="danger"
          >
            {isArabic
              ? "رفض التوثيق"
              : "Reject Verification"}
          </AdminActionButton>
        </form>
      </div>
    ) : null}
  </div>
) : null}
<div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
        {isArabic
          ? "فرص الناشر"
          : "Publisher Opportunities"}
      </p>

      <p className="mt-2 text-sm text-white/50">
        {isArabic
          ? "عرض ومراجعة جميع الفرص المرتبطة بهذا الناشر."
          : "View and review all opportunities from this publisher."}
      </p>
    </div>

    <Link
      href={`/admin/opportunities?publisher=${publisher.id}&lang=${language}`}
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] px-5 py-3 text-xs text-gold transition hover:bg-gold hover:text-black"
    >
      {isArabic
        ? "عرض فرص الناشر"
        : "View Publisher Opportunities"}
    </Link>
  </div>

  <div className="mt-5 grid gap-3 sm:grid-cols-2">
    <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-4">
      <p className="text-xs text-white/40">
        {isArabic
          ? "إجمالي الفرص"
          : "Total Opportunities"}
      </p>

      <p className="mt-2 text-2xl font-light text-white">
        {publisher.total_opportunities}
      </p>
    </div>

    <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.035] px-4 py-4">
      <p className="text-xs text-amber-200/60">
        {isArabic
          ? "تحتاج مراجعة"
          : "Pending Review"}
      </p>

      <p
  className={
    publisher.pending_opportunities > 0
      ? "mt-2 text-2xl font-light text-amber-300"
      : "mt-2 text-2xl font-light text-white/50"
  }
>
  {publisher.pending_opportunities}
</p>
    </div>
  </div>
</div>
                  <div className="mt-6 border-t border-white/[0.08] pt-5">
                    <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-gold">
                    {isArabic
  ? "قرار مراجعة ملف الناشر"
  : "Publisher Profile Review Decision"}
                    </p>

                    <div className="grid gap-3 lg:grid-cols-3">
                      {status !==
                      "approved" ? (
                        <form
                          action={
                            approvePublisherAction
                          }
                          className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={
                              publisher.id
                            }
                          />

                          <input
                            type="hidden"
                            name="locale"
                            value={
                              language
                            }
                          />

                          <label className="mb-2 block text-xs text-white/45">
                            {isArabic
                              ? "ملاحظة داخلية اختيارية"
                              : "Optional admin note"}
                          </label>

                          <textarea
                            name="admin_note"
                            rows={2}
                            maxLength={2000}
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/30"
                          />

                          <AdminActionButton
                            type="submit"
                            variant="success"
                          >
                            {isArabic
                              ? "اعتماد"
                              : "Approve"}
                          </AdminActionButton>
                        </form>
                      ) : null}

                      {status !==
                      "changes_requested" ? (
                        <form
                          action={
                            requestPublisherChangesAction
                          }
                          className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.025] p-4"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={
                              publisher.id
                            }
                          />

                          <input
                            type="hidden"
                            name="locale"
                            value={
                              language
                            }
                          />

                          <label className="mb-2 block text-xs text-white/55">
                            {isArabic
                              ? "سبب طلب التعديل"
                              : "Reason for changes"}
                          </label>

                          <textarea
                            required
                            name="reason"
                            rows={2}
                            maxLength={1000}
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/30"
                          />

                          <AdminActionButton
                            type="submit"
                            variant="warning"
                          >
                            {isArabic
                              ? "طلب تعديل"
                              : "Request Changes"}
                          </AdminActionButton>
                        </form>
                      ) : null}

                      {status !==
                      "rejected" ? (
                        <form
                          action={
                            rejectPublisherAction
                          }
                          className="rounded-2xl border border-red-400/10 bg-red-400/[0.025] p-4"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={
                              publisher.id
                            }
                          />

                          <input
                            type="hidden"
                            name="locale"
                            value={
                              language
                            }
                          />

                          <label className="mb-2 block text-xs text-white/55">
                            {isArabic
                              ? "سبب الرفض"
                              : "Rejection reason"}
                          </label>

                          <textarea
                            required
                            name="reason"
                            rows={2}
                            maxLength={1000}
                            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-red-400/30"
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

                    <Link
  href={`/${language}/publishers/${publisher.id}`}
  target="_blank"
  className="mt-4 inline-flex rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
>
  {isArabic
    ? "عرض بروفايل الناشر"
    : "View Publisher Profile"}
</Link>
                  </div>
                </AdminCard>
              );
            },
          )}
        </section>
      )}
    </main>
  );
}