import Link from "next/link";
import { ApplicationService } from "@/lib/services/applications/ApplicationService";
import {
  acceptApplicationAction,
  rejectAdminApplicationAction,
  shortlistApplicationAction,
} from "@/lib/actions/admin-application-actions";
import {
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

export const metadata = {
  title: "Opportunity Applications — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    lang?: string;
  }>;
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
    isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}

function getStatusLabel(
  status: string | null | undefined,
  isArabic: boolean,
) {
  switch (status) {
    case "shortlisted":
      return isArabic ? "القائمة المختصرة" : "Shortlisted";

    case "accepted":
      return isArabic ? "مقبول" : "Accepted";

    case "rejected":
      return isArabic ? "مرفوض" : "Rejected";

    default:
      return isArabic ? "قيد المراجعة" : "Pending";
  }
}

function buildHref(
  status?: string,
  q?: string,
  language: "ar" | "en" = "ar",
) {
  const params = new URLSearchParams();

  params.set("lang", language);

  if (status) params.set("status", status);
  if (q) params.set("q", q);

  return `/admin/opportunity-applications?${params.toString()}`;
}

export default async function AdminOpportunityApplicationsPage({
  searchParams,
}: PageProps) {
  type AdminApplicationOpportunity = {
    title: string | null;
    opportunity_type: string | null;
    city_ar: string | null;
    slug: string | null;
  };
  
  type AdminApplicationTalent = {
    name_en: string | null;
    name_ar: string | null;
    image_url: string | null;
    city_ar: string | null;
    gender: string | null;
    slug: string | null;
  };
  
  type AdminApplication = {
    id: string | number;
    status: string | null;
    created_at: string | null;
    opportunities:
      | AdminApplicationOpportunity
      | AdminApplicationOpportunity[]
      | null;
    talents:
      | AdminApplicationTalent
      | AdminApplicationTalent[]
      | null;
  };
  const { status, q, lang } = await searchParams;

const language = lang === "en" ? "en" : "ar";
const isRtl = language === "ar";

  const applications =
  (await ApplicationService.getAdminApplications({
    status,
    search: q,
  })) as AdminApplication[];
  
  const stats = {
    total: applications.length,
    pending: applications.filter(
      (item) => (item.status || "pending") === "pending",
    ).length,
    shortlisted: applications.filter(
      (item) => item.status === "shortlisted",
    ).length,
    accepted: applications.filter(
      (item) => item.status === "accepted",
    ).length,
    rejected: applications.filter(
      (item) => item.status === "rejected",
    ).length,
  };

  return (
    <AdminPageContainer>
        <AdminPageHeader
  title={isRtl ? "طلبات الفرص" : "Opportunity Applications"}
  description={
    isRtl
      ? "راجع طلبات المواهب، وأضفها للقائمة المختصرة، ثم اقبلها أو ارفضها."
      : "Review, shortlist, accept, and reject talent applications."
  }
/>

<AdminGrid className="mb-8 md:grid-cols-5">
  <AdminStatCard
    label={isRtl ? "الإجمالي" : "Total"}
    value={stats.total}
    active={!status}
    href={`/admin/opportunity-applications?lang=${language}`}
  />

  <AdminStatCard
    label={isRtl ? "قيد المراجعة" : "Pending"}
    value={stats.pending}
    active={status === "pending"}
    href={buildHref("pending", q, language)}
  />

  <AdminStatCard
    label={isRtl ? "القائمة المختصرة" : "Shortlisted"}
    value={stats.shortlisted}
    active={status === "shortlisted"}
    href={buildHref("shortlisted", q, language)}
  />

  <AdminStatCard
    label={isRtl ? "مقبول" : "Accepted"}
    value={stats.accepted}
    active={status === "accepted"}
    href={buildHref("accepted", q, language)}
  />

  <AdminStatCard
    label={isRtl ? "مرفوض" : "Rejected"}
    value={stats.rejected}
    active={status === "rejected"}
    href={buildHref("rejected", q, language)}
  />
</AdminGrid>

        <form
          method="GET"
          className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-5"
        >
          <input type="hidden" name="lang" value={language} />
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder={
                isRtl
                  ? "ابحث عن موهبة أو فرصة أو مدينة..."
                  : "Search talent, opportunity, or city..."
              }
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30"
            />

            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none"
            >
              <option value="">
  {isRtl ? "جميع الحالات" : "All Statuses"}
</option>

<option value="pending">
  {isRtl ? "قيد المراجعة" : "Pending"}
</option>

<option value="shortlisted">
  {isRtl ? "القائمة المختصرة" : "Shortlisted"}
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
              className="rounded-2xl border border-gold/40 px-8 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "بحث" : "Search"}
            </button>
          </div>
        </form>

        {applications.length === 0 ? (
          <AdminEmptyState
          message={
            isRtl
              ? "لا توجد طلبات فرص مطابقة."
              : "No opportunity applications found."
          }
        />
        ) : (
          <AdminGrid>
            {applications.map((application) => {
              const opportunity = Array.isArray(application.opportunities)
                ? application.opportunities[0]
                : application.opportunities;

              const talent = Array.isArray(application.talents)
                ? application.talents[0]
                : application.talents;

              const currentStatus = application.status || "pending";

              return (
                <AdminCard key={application.id}>
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-5">
                      {talent?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={talent.image_url}
                          alt={talent.name_en || "Talent"}
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-2xl border border-white/10 bg-black/20" />
                      )}

                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                          {isRtl ? `طلب #${application.id}` : `Application #${application.id}`}
                          </p>

                          <AdminBadge
  variant={
    currentStatus === "accepted"
      ? "success"
      : currentStatus === "rejected"
      ? "danger"
      : "gold"
  }
>
{getStatusLabel(currentStatus, isRtl)}
</AdminBadge>
                        </div>

                        <h2 className="text-2xl font-light text-white">
                        {talent?.name_ar ||
  talent?.name_en ||
  (isRtl ? "موهبة بدون اسم" : "Unnamed Talent")}
                        </h2>

                        <p className="mt-1 text-sm text-white/50">
  {talent?.city_ar || "—"} ·{" "}
  {talent?.gender === "male"
    ? isRtl
      ? "ذكر"
      : "Male"
    : talent?.gender === "female"
      ? isRtl
        ? "أنثى"
        : "Female"
      : talent?.gender === "any"
        ? isRtl
          ? "الجميع"
          : "Any"
        : "—"}
</p>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                      {isRtl ? "تاريخ التقديم" : "Applied"}
                      </p>

                      <p className="mt-1 text-sm text-gray-muted">
                      {formatDate(application.created_at, isRtl)}
                      </p>
                    </div>
                  </div>

                  <AdminInfoGrid>
                  <AdminInfoItem
  label={isRtl ? "الفرصة" : "Opportunity"}
  value={opportunity?.title}
/>

<AdminInfoItem
  label={isRtl ? "نوع الموهبة" : "Talent Type"}
  value={
    opportunity?.opportunity_type === "actor"
      ? isRtl
        ? "ممثل / ممثلة"
        : "Actor"
      : opportunity?.opportunity_type === "model"
        ? isRtl
          ? "مودل"
          : "Model"
        : "—"
  }
/>

<AdminInfoItem
  label={isRtl ? "المدينة" : "City"}
  value={opportunity?.city_ar}
/>

<AdminInfoItem
  label={isRtl ? "الحالة" : "Status"}
  value={getStatusLabel(currentStatus, isRtl)}
/>
</AdminInfoGrid>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/opportunity-applications/${application.id}`}
                      className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      {isRtl ? "فتح الطلب" : "Open Application"}
                    </Link>

                    {opportunity?.slug ? (
                      <Link
                      href={`/${language}/opportunities/${opportunity.slug}`}
                        target="_blank"
                        className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                      >
                        {isRtl ? "عرض الفرصة" : "View Opportunity"}
                      </Link>
                    ) : null}

                    {talent?.slug ? (
                      <Link
                      href={`/${language}/talent/${talent.slug}`}
                        target="_blank"
                        className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        {isRtl ? "عرض الموهبة" : "View Talent"}
                      </Link>
                    ) : null}

{currentStatus === "pending" ? (
  <form action={shortlistApplicationAction}>
    <input
      type="hidden"
      name="application_id"
      value={application.id}
    />

    <input
      type="hidden"
      name="locale"
      value={language}
    />

    <button
      type="submit"
      className="rounded-full border border-blue-500/30 bg-blue-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-blue-300 transition hover:bg-blue-500/10"
    >
      {isRtl ? "إضافة للقائمة المختصرة" : "Shortlist"}
    </button>
  </form>
) : null}

{["pending", "shortlisted"].includes(currentStatus) ? (
  <form action={acceptApplicationAction}>
    <input
      type="hidden"
      name="application_id"
      value={application.id}
    />

    <input
      type="hidden"
      name="locale"
      value={language}
    />

    <button
      type="submit"
      className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-emerald-300 transition hover:bg-emerald-500/10"
    >
      {isRtl ? "قبول" : "Accept"}
    </button>
  </form>
) : null}

{["pending", "shortlisted"].includes(currentStatus) ? (
  <form
    action={rejectAdminApplicationAction}
    className="w-full rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-4"
  >
    <input
      type="hidden"
      name="application_id"
      value={application.id}
    />

    <input
      type="hidden"
      name="locale"
      value={language}
    />

    <label className="mb-2 block text-xs text-white/55">
    {isRtl ? "سبب رفض الطلب" : "Rejection Reason"}
    </label>

    <textarea
      required
      name="reason"
      rows={2}
      maxLength={1000}
      placeholder={
        isRtl
          ? "اكتب سبب رفض الطلب ليظهر للموهبة..."
          : "Enter the rejection reason that will be shown to the talent..."
      }
      className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/30"
    />

    <button
      type="submit"
      className="rounded-full border border-red-500/30 bg-red-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500/10"
    >
     {isRtl ? "رفض الطلب" : "Reject Application"}
    </button>
  </form>
) : null}
                  </div>
                  </AdminCard>
              );
            })}
          </AdminGrid>
        )}
      </AdminPageContainer>
  );
}