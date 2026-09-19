import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import {
  acceptApplicationAction,
  markPendingApplicationAction,
  shortlistApplicationAction,
} from "@/lib/actions/admin-application-actions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Application Details — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function formatDate(value: string | null | undefined, isArabic: boolean) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  ).format(date);
}

function statusClass(status?: string | null) {
  switch (status) {
    case "shortlisted":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "accepted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-gold/30 bg-gold/10 text-gold";
  }
}

function statusLabel(status: string | null | undefined, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    pending: { ar: "قيد المراجعة", en: "Pending" },
    shortlisted: { ar: "قائمة مختصرة", en: "Shortlisted" },
    accepted: { ar: "مقبول", en: "Accepted" },
    rejected: { ar: "مرفوض", en: "Rejected" },
  };

  const label = labels[status || "pending"] ?? labels.pending;
  return isArabic ? label.ar : label.en;
}

function getStatusAction(status: string) {
  switch (status) {
    case "pending":
      return markPendingApplicationAction;
    case "shortlisted":
      return shortlistApplicationAction;
    case "accepted":
      return acceptApplicationAction;
    default:
      return null;
  }
}

export default async function AdminApplicationDetailsPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const applicationId = Number(id);
  const language: "ar" | "en" = query.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  if (!Number.isInteger(applicationId) || applicationId <= 0) notFound();

  const adminClient = createAdminClient();
  const { data: application, error } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunities (
        id,
        title,
        slug,
        description,
        company_name,
        city_ar,
        city_en,
        opportunity_type,
        budget,
        status
      ),
      talents (
        id,
        name_en,
        name_ar,
        slug,
        image_url,
        city_ar,
        gender,
        instagram,
        whatsapp
      )
      `,
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new Error(`[AdminApplicationDetailsPage] ${error.message}`);
  }
  if (!application) notFound();

  const opportunity = Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;
  const talent = Array.isArray(application.talents)
    ? application.talents[0]
    : application.talents;
  const status = application.status || "pending";
  const talentName =
    (isArabic ? talent?.name_ar || talent?.name_en : talent?.name_en || talent?.name_ar) ||
    (isArabic ? "موهبة بدون اسم" : "Unnamed talent");

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "طلبات التقديم" : "APPLICATIONS"}
          title={isArabic ? "تفاصيل طلب التقديم" : "Application details"}
          description={
            isArabic
              ? "مراجعة الموهبة والفرصة وحالة الطلب من مساحة تشغيلية واحدة."
              : "Review the talent, opportunity and application state from one operational workspace."
          }
          actions={
            <Link
              href={`/admin/opportunity-applications?lang=${language}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] px-4 text-xs font-medium text-white/55 transition hover:border-gold/20 hover:text-gold"
            >
              {isArabic ? "العودة إلى الطلبات" : "Back to applications"}
            </Link>
          }
        />

        <AdminCard className="mb-5 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              {talent?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={talent.image_url}
                  alt={talentName}
                  className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="h-24 w-24 shrink-0 rounded-2xl border border-white/[0.08] bg-black/20" />
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-medium ${statusClass(status)}`}>
                    {statusLabel(status, isArabic)}
                  </span>
                  <span className="text-[10px] text-white/28">
                    {isArabic ? "طلب" : "Application"} #{application.id}
                  </span>
                </div>

                <h2 className="mt-3 truncate text-xl font-semibold text-white/90">{talentName}</h2>
                <p className="mt-1 text-xs text-white/38">
                  {talent?.city_ar || "—"} · {talent?.gender || "—"} ·{" "}
                  {isArabic ? "تاريخ التقديم" : "Applied"} {formatDate(application.created_at, isArabic)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {talent?.slug ? (
                <Link
                  href={`/${language}/talent/${talent.slug}`}
                  target="_blank"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] px-4 text-xs font-medium text-white/55 transition hover:border-gold/20 hover:text-gold"
                >
                  {isArabic ? "عرض الموهبة" : "View talent"}
                </Link>
              ) : null}
              {opportunity?.slug ? (
                <Link
                  href={`/${language}/opportunities/${opportunity.slug}`}
                  target="_blank"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-gold/25 bg-gold/[0.05] px-4 text-xs font-medium text-gold transition hover:bg-gold/10"
                >
                  {isArabic ? "عرض الفرصة" : "View opportunity"}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
            {["pending", "shortlisted", "accepted"].map((nextStatus) => {
              const action = getStatusAction(nextStatus);
              if (!action) return null;
              const isCurrent = status === nextStatus;

              return (
                <form key={nextStatus} action={action}>
                  <input type="hidden" name="application_id" value={application.id} />
                  <input type="hidden" name="locale" value={language} />
                  <button
                    type="submit"
                    className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-xs font-medium transition ${
                      isCurrent
                        ? "border-gold/35 bg-gold/[0.08] text-gold"
                        : "border-white/[0.08] text-white/50 hover:border-gold/20 hover:text-gold"
                    }`}
                  >
                    {statusLabel(nextStatus, isArabic)}
                  </button>
                </form>
              );
            })}

            <button
              type="button"
              disabled
              title={
                isArabic
                  ? "يجب إدخال سبب الرفض من شاشة المراجعة المعتمدة."
                  : "A rejection reason must be entered from the approved review workflow."
              }
              className={`inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border px-4 text-xs font-medium ${
                status === "rejected"
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-white/[0.08] text-white/20"
              }`}
            >
              {statusLabel("rejected", isArabic)}
            </button>
          </div>
        </AdminCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white/88">{isArabic ? "الموهبة" : "Talent"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoBlock label={isArabic ? "الاسم بالعربية" : "Arabic name"} value={talent?.name_ar} />
              <InfoBlock label={isArabic ? "الاسم بالإنجليزية" : "English name"} value={talent?.name_en} />
              <InfoBlock label={isArabic ? "المدينة" : "City"} value={talent?.city_ar} />
              <InfoBlock label={isArabic ? "الجنس" : "Gender"} value={talent?.gender} />
              <InfoBlock label="Instagram" value={talent?.instagram} />
              <InfoBlock label="WhatsApp" value={talent?.whatsapp} />
            </div>
          </AdminCard>

          <AdminCard className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-white/88">{isArabic ? "الفرصة" : "Opportunity"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoBlock label={isArabic ? "العنوان" : "Title"} value={opportunity?.title} />
              <InfoBlock label={isArabic ? "الجهة" : "Company"} value={opportunity?.company_name} />
              <InfoBlock label={isArabic ? "النوع" : "Type"} value={opportunity?.opportunity_type} />
              <InfoBlock label={isArabic ? "المدينة" : "City"} value={opportunity?.city_ar || opportunity?.city_en} />
              <InfoBlock label={isArabic ? "الميزانية" : "Budget"} value={opportunity?.budget} />
              <InfoBlock label={isArabic ? "الحالة" : "Status"} value={opportunity?.status} />
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/15 p-4">
              <p className="text-[10px] font-medium text-white/30">{isArabic ? "الوصف" : "Description"}</p>
              <p className="mt-2 text-sm leading-6 text-white/62">{opportunity?.description || "—"}</p>
            </div>
          </AdminCard>
        </div>

        <AdminCard className="mt-5 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-white/88">{isArabic ? "مسار الطلب" : "Application timeline"}</h3>
          <div className="mt-5 grid gap-4">
            <TimelineItem
              title={isArabic ? "تم إرسال الطلب" : "Application submitted"}
              date={formatDate(application.created_at, isArabic)}
              active
            />
            <TimelineItem
              title={`${isArabic ? "الحالة الحالية" : "Current status"}: ${statusLabel(status, isArabic)}`}
              date={isArabic ? "الآن" : "Now"}
              active
            />
          </div>
        </AdminCard>
      </AdminPageContainer>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/15 p-4">
      <p className="text-[10px] font-medium text-white/30">{label}</p>
      <p className="mt-1.5 break-words text-sm text-white/72">{value || "—"}</p>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  active = false,
}: {
  title: string;
  date: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${active ? "bg-gold" : "bg-white/15"}`} />
      <div>
        <p className="text-sm text-white/75">{title}</p>
        <p className="mt-1 text-xs text-white/30">{date}</p>
      </div>
    </div>
  );
}
