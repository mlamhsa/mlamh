import Link from "next/link";
import { notFound } from "next/navigation";

import AdminOpportunityLiveRefresh from "@/components/admin/opportunities/AdminOpportunityLiveRefresh";
import OpportunitySocialCreative from "@/components/admin/opportunities/OpportunitySocialCreative";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  publishOpportunityAction,
  hideOpportunityAction,
  rejectOpportunityAction,
  requestChangesOpportunityAction,
  archiveOpportunityAction,
} from "@/lib/actions/admin-opportunity-actions";

import {
  acceptApplicationAction,
  rejectAdminApplicationAction,
  shortlistApplicationAction,
} from "@/lib/actions/admin-application-actions";

export const metadata = {
  title: "Opportunity Details — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    lang?: string;
  }>;
};

function formatDate(
  value?: string | null,
  isRtl = false,
) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(
    isRtl ? "ar-SA-u-nu-latn" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function formatCompensation(
  compensationType: unknown,
  budget: unknown,
  isRtl = false,
) {
  const type = String(compensationType ?? "")
    .trim()
    .toLowerCase();

  if (type === "unpaid") {
    return isRtl ? "غير مدفوع" : "Unpaid";
  }

  if (type === "negotiable") {
    return isRtl ? "حسب الاتفاق" : "Negotiable";
  }

  const amount = Number(
    String(budget ?? "").replaceAll(",", ""),
  );

  if (Number.isFinite(amount) && amount > 0) {
    return isRtl
    ? `${new Intl.NumberFormat("en-US").format(amount)} ر.س`
      : `SAR ${new Intl.NumberFormat("en-US").format(amount)}`;
  }

  return isRtl ? "غير محدد" : "Not specified";
}

function statusLabel(
  status?: string | null,
  published?: boolean,
  isRtl = false,
) {
  if (published) {
    return isRtl ? "منشورة" : "Published";
  }

  switch (status) {
    case "pending_review":
      return isRtl ? "قيد المراجعة" : "Pending Review";

    case "closed":
      return isRtl ? "مغلقة" : "Closed";

    case "archived":
      return isRtl ? "مؤرشفة" : "Archived";

    case "draft":
      return isRtl ? "مسودة" : "Draft";

    case "needs_changes":
      return isRtl ? "تحتاج تعديلات" : "Needs Changes";

    case "rejected":
      return isRtl ? "مرفوضة" : "Rejected";

    case "published":
      return isRtl ? "منشورة" : "Published";

    default:
      return isRtl ? "قيد المراجعة" : "Pending Review";
  }
}

function statusClass(status?: string | null, published?: boolean) {
  if (published) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  switch (status) {
    case "pending_review":
      return "border-gold/30 bg-gold/10 text-gold";

    case "closed":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

    case "archived":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "needs_changes":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";

    case "rejected":
      return "border-red-600/30 bg-red-600/10 text-red-400";

    default:
      return "border-gold/30 bg-gold/10 text-gold";
  }
}

export default async function AdminOpportunityDetailsPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isRtl = resolvedSearchParams.lang === "ar";
  const opportunityId = Number(id);

  if (!opportunityId) {
    notFound();
  }

  const adminClient = createAdminClient();

  const { data: opportunity, error } = await adminClient
  .from("opportunities")
  .select(
    `
      id,
      title,
      slug,
      description,
      posting_mode,
      opportunity_type,
      city_ar,
      city_en,
      required_gender,
      min_age,
      max_age,
      compensation_type,
      budget,
      application_days,
      required_count,
      work_date,
      work_time,
      work_duration,
      role_requirements,
      company_name,
      contact_name,
      contact_phone,
      contact_email,
      status,
      published,
      expires_at,
      created_at,
      updated_at
    `
  )
    .eq("id", opportunityId)
    .maybeSingle();

  if (error) {
    throw new Error(`[AdminOpportunityDetailsPage] ${error.message}`);
  }

  if (!opportunity) {
    notFound();
  }
  const isManagedByMlamh =
  opportunity.role_requirements?.managed_by === "mlamh";

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      talents (
        id,
        name_en,
        name_ar,
        slug,
        image_url,
        city_ar,
        gender
      )
      `
    )
    .eq("opportunity_id", opportunity.id)
    .order("created_at", { ascending: false });

  const applicationList = applications ?? [];
  type AdminApplication = (typeof applicationList)[number];

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-6 py-10 text-white"
    >
      <AdminOpportunityLiveRefresh />
  
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH ADMIN
            </p>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
            {isRtl
  ? "راجع جميع بيانات الفرصة وحالة النشر والمتقدمين قبل اتخاذ القرار."
  : "Review all opportunity data, publishing state, and applicants."}
            </p>
          </div>

          <Link
            href={`/admin/opportunities?lang=${isRtl ? "ar" : "en"}`}
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
          </Link>
        </header>

        <section className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusClass(
                    opportunity.status,
                    opportunity.published
                  )}`}
                >
                  {statusLabel(
  opportunity.status,
  opportunity.published,
  isRtl,
)}
                </span>

                <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                {isRtl
  ? `الفرصة #${opportunity.id}`
  : `Opportunity #${opportunity.id}`}
                </span>
              </div>

              <h2 className="text-3xl font-light text-white">
                {opportunity.title || "Untitled Opportunity"}
              </h2>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-gray-muted">
                {opportunity.description || "—"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
  {opportunity.published && opportunity.slug ? (
    <Link
      href={`/${isRtl ? "ar" : "en"}/opportunities/${opportunity.slug}`}
      target="_blank"
      className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
    >
      {isRtl ? "عرض الصفحة العامة" : "View Public"}
    </Link>
  ) : null}

  {!isManagedByMlamh &&
opportunity.status === "pending_review" &&
!opportunity.published ? (
    <form action={publishOpportunityAction}>
      <input
        type="hidden"
        name="id"
        value={opportunity.id}
      />
      <input
        type="hidden"
        name="locale"
        value={isRtl ? "ar" : "en"}
      />

      <button
        type="submit"
        className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-emerald-300 transition hover:bg-emerald-500/10"
      >
        {isRtl ? "اعتماد ونشر" : "Approve & Publish"}
      </button>
    </form>
  ) : null}

  {opportunity.status === "published" &&
  opportunity.published ? (
    <>
      <form action={hideOpportunityAction}>
        <input
          type="hidden"
          name="id"
          value={opportunity.id}
        />
        <input
          type="hidden"
          name="locale"
          value={isRtl ? "ar" : "en"}
        />

        <button
          type="submit"
          className="rounded-full border border-yellow-500/30 bg-yellow-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-yellow-300 transition hover:bg-yellow-500/10"
        >
          {isRtl ? "إخفاء الفرصة" : "Hide Opportunity"}
        </button>
      </form>

      <form action={archiveOpportunityAction}>
        <input
          type="hidden"
          name="id"
          value={opportunity.id}
        />
        <input
          type="hidden"
          name="locale"
          value={isRtl ? "ar" : "en"}
        />

        <button
          type="submit"
          className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/55 transition hover:border-white/20 hover:text-white"
        >
          {isRtl ? "أرشفة" : "Archive"}
        </button>
      </form>
    </>
  ) : null}
</div>
          </div>
        </section>
        {opportunity.status === "pending_review" &&
!opportunity.published ? (
  <section className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
        {isRtl ? "قرار الإدارة" : "Admin Decision"}
      </p>

      <h3 className="mt-2 text-2xl font-light text-white">
        {isRtl
          ? "هل تحتاج الفرصة إلى تعديل أو رفض؟"
          : "Does this opportunity need changes or rejection?"}
      </h3>

      <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-muted">
        {isRtl
          ? "إذا كانت البيانات ناقصة أو تحتاج توضيحًا، اطلب من الناشر تعديلها. استخدم الرفض فقط عندما تكون الفرصة غير مناسبة للنشر على المنصة."
          : "Request changes when information is incomplete or needs clarification. Reject only when the opportunity should not be published on the platform."}
      </p>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <form
        action={requestChangesOpportunityAction}
        className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.025] p-5"
      >
        <input
          type="hidden"
          name="id"
          value={opportunity.id}
        />

        <input
          type="hidden"
          name="locale"
          value={isRtl ? "ar" : "en"}
        />

        <label className="mb-2 block text-sm font-medium text-blue-200">
          {isRtl ? "طلب تعديل" : "Request Changes"}
        </label>

        <p className="mb-4 text-xs leading-6 text-white/40">
          {isRtl
            ? "اكتب بوضوح ما الذي يجب على الناشر تعديله قبل إعادة إرسال الفرصة."
            : "Clearly explain what the publisher must update before resubmitting the opportunity."}
        </p>

        <textarea
          required
          name="reason"
          rows={4}
          maxLength={1000}
          placeholder={
            isRtl
              ? "مثال: يرجى توضيح تاريخ العمل والمقابل المالي..."
              : "Example: Please clarify the work date and compensation..."
          }
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/30"
        />

        <button
          type="submit"
          className="mt-4 rounded-full border border-blue-500/30 bg-blue-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-blue-300 transition hover:bg-blue-500/10"
        >
          {isRtl ? "إرسال طلب التعديل" : "Request Changes"}
        </button>
      </form>

      <form
        action={rejectOpportunityAction}
        className="rounded-2xl border border-red-500/15 bg-red-500/[0.025] p-5"
      >
        <input
          type="hidden"
          name="id"
          value={opportunity.id}
        />

        <input
          type="hidden"
          name="locale"
          value={isRtl ? "ar" : "en"}
        />

        <label className="mb-2 block text-sm font-medium text-red-200">
          {isRtl ? "رفض الفرصة" : "Reject Opportunity"}
        </label>

        <p className="mb-4 text-xs leading-6 text-white/40">
          {isRtl
            ? "استخدم الرفض عندما تكون الفرصة غير مناسبة للنشر، واكتب السبب الذي سيصل إلى الناشر."
            : "Reject when the opportunity is unsuitable for publication and provide the reason shown to the publisher."}
        </p>

        <textarea
          required
          name="reason"
          rows={4}
          maxLength={1000}
          placeholder={
            isRtl
              ? "اكتب سبب رفض الفرصة..."
              : "Enter the reason for rejecting this opportunity..."
          }
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/30"
        />

        <button
          type="submit"
          className="mt-4 rounded-full border border-red-500/30 bg-red-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500/10"
        >
          {isRtl ? "رفض الفرصة" : "Reject Opportunity"}
        </button>
      </form>
    </div>
  </section>
) : null}
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
  <section
    dir="rtl"
    className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6"
  >
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
        مراجعة الفرصة
      </p>

      <h3 className="mt-2 text-2xl font-light text-white">
        معلومات الفرصة
      </h3>

      <p className="mt-2 text-sm text-gray-muted">
        جميع البيانات التي أدخلها الناشر قبل اعتماد ونشر الفرصة.
      </p>
    </div>

    <div className="grid gap-4 text-sm md:grid-cols-2">
      <InfoBlock
        label="طريقة النشر"
        value={
          opportunity.posting_mode === "quick"
            ? "فرصة سريعة"
            : opportunity.posting_mode === "project"
              ? "مشروع / كاستينغ"
              : opportunity.posting_mode
        }
      />

      <InfoBlock
        label="نوع الموهبة"
        value={
          opportunity.opportunity_type === "actor"
            ? "ممثل / ممثلة"
            : opportunity.opportunity_type === "model"
              ? "مودل"
              : opportunity.opportunity_type
        }
      />

      <InfoBlock label="المدينة" value={opportunity.city_ar} />

      <InfoBlock
        label="الجنس المطلوب"
        value={
          opportunity.required_gender === "male"
            ? "ذكر"
            : opportunity.required_gender === "female"
              ? "أنثى"
              : opportunity.required_gender === "any"
                ? "الجميع"
                : opportunity.required_gender
        }
      />

      <InfoBlock
        label="الفئة العمرية"
        value={
          opportunity.min_age || opportunity.max_age
            ? `${opportunity.min_age ?? "—"} - ${opportunity.max_age ?? "—"} سنة`
            : "جميع الأعمار"
        }
      />

      <InfoBlock
        label="عدد المواهب المطلوبة"
        value={opportunity.required_count}
      />

      <InfoBlock
        label="المقابل المالي"
        value={formatCompensation(
          opportunity.compensation_type,
          opportunity.budget,
          isRtl,
        )}
      />

      <InfoBlock
        label="مدة استقبال الطلبات"
        value={
          opportunity.application_days
            ? `${opportunity.application_days} يوم`
            : null
        }
      />

      <InfoBlock
        label="تاريخ العمل"
        value={formatDate(opportunity.work_date, isRtl)}
      />

      <InfoBlock
        label="وقت العمل"
        value={opportunity.work_time}
      />

      <InfoBlock
        label="مدة العمل"
        value={opportunity.work_duration}
      />

      <InfoBlock
        label="حالة النشر"
        value={opportunity.published ? "منشورة" : "غير منشورة"}
      />
    </div>

    <div className="mt-4 grid gap-4">
      <InfoBlock
        label="عنوان الفرصة"
        value={opportunity.title}
      />

      <InfoBlock
        label="وصف الفرصة"
        value={opportunity.description}
      />

{opportunity.opportunity_type === "actor" ? (
  <>
    <InfoBlock
      label="اللغات المطلوبة"
      value={
        Array.isArray(opportunity.role_requirements?.languages) &&
        opportunity.role_requirements.languages.length > 0
          ? opportunity.role_requirements.languages
              .map((language: string) => {
                if (language === "arabic") return "العربية";
                if (language === "english") return "الإنجليزية";
                return language;
              })
              .join("، ")
          : null
      }
    />

    <InfoBlock
      label="اللهجات المطلوبة"
      value={
        Array.isArray(opportunity.role_requirements?.dialects) &&
        opportunity.role_requirements.dialects.length > 0
          ? opportunity.role_requirements.dialects
              .map((dialect: string) => {
                if (dialect === "najdi") return "النجدية";
                if (dialect === "hejazi") return "الحجازية";
                if (dialect === "gulf") return "الخليجية";
                return dialect;
              })
              .join("، ")
          : null
      }
    />
  </>
) : opportunity.opportunity_type === "model" ? (
  <>
    <InfoBlock
      label="نوع المودل"
      value={opportunity.role_requirements?.model_type ?? null}
    />

    <InfoBlock
      label="الحد الأدنى للطول"
      value={
        opportunity.role_requirements?.min_height
          ? `${opportunity.role_requirements.min_height} سم`
          : null
      }
    />

    <InfoBlock
      label="لون الشعر"
      value={opportunity.role_requirements?.hair_color ?? null}
    />
  </>
) : null}
    </div>
  </section>

  <section
    dir="rtl"
    className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6"
  >
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
        صاحب الفرصة
      </p>

      <h3 className="mt-2 text-2xl font-light text-white">
        الناشر / الجهة
      </h3>
    </div>

    <div className="grid gap-4 text-sm">
      <InfoBlock
        label="اسم الجهة"
        value={opportunity.company_name}
      />

      <InfoBlock
        label="اسم المسؤول"
        value={opportunity.contact_name}
      />

      <InfoBlock
        label="رقم التواصل"
        value={opportunity.contact_phone}
      />

      <InfoBlock
        label="البريد الإلكتروني"
        value={opportunity.contact_email}
      />

      <InfoBlock
        label="تاريخ إنشاء الفرصة"
        value={formatDate(opportunity.created_at, isRtl)}
      />

      <InfoBlock
        label="آخر تحديث"
        value={formatDate(opportunity.updated_at, isRtl)}
      />
    </div>
  </section>
</div>
{opportunity.published && opportunity.slug ? (
  <section className="mt-6 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
        {isRtl ? "مواد النشر" : "SOCIAL CREATIVE"}
      </p>

      <h3 className="mt-2 text-2xl font-light text-white">
        {isRtl
          ? "تصميم الفرصة للسوشيال ميديا"
          : "Opportunity Social Creative"}
      </h3>

      <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-muted">
        {isRtl
          ? "أنشئ وحمّل التصميم الجاهز للنشر مع رمز QR المرتبط مباشرة بصفحة الفرصة."
          : "Generate and download publication-ready creatives with a QR code linked directly to this opportunity."}
      </p>
    </div>

    <OpportunitySocialCreative
      title={opportunity.title || "MLAMH Opportunity"}
      slug={opportunity.slug}
      city={
        isRtl
          ? opportunity.city_ar
          : opportunity.city_en || opportunity.city_ar
      }
      opportunityType={
        opportunity.opportunity_type === "actor"
          ? isRtl
            ? "ممثل / ممثلة"
            : "Actor"
          : opportunity.opportunity_type === "model"
            ? isRtl
              ? "مودل"
              : "Model"
            : opportunity.opportunity_type
      }
      compensation={formatCompensation(
        opportunity.compensation_type,
        opportunity.budget,
        isRtl,
      )}
    />
  </section>
) : null}

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-light text-white">
              {isRtl ? "المتقدمون" : "Applications"}
              </h3>
              <p className="mt-1 text-sm text-gray-muted">
              {isRtl
  ? `${applicationList.length} متقدم على هذه الفرصة.`
  : `${applicationList.length} applicants for this opportunity.`}
              </p>
            </div>

            <Link
              href="/admin/opportunity-applications"
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              {isRtl ? "عرض جميع الطلبات" : "View All Applications"}
            </Link>
          </div>

          {applicationList.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-6 py-12 text-center">
              <p className="text-sm text-gray-muted">
              {isRtl
  ? "لا توجد طلبات على هذه الفرصة حتى الآن."
  : "No applications for this opportunity yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {applicationList.map((application: AdminApplication) => {
                const talent = Array.isArray(application.talents)
                  ? application.talents[0]
                  : application.talents;

                return (
                  <article
                    key={application.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-black/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {talent?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={talent.image_url}
                          alt={talent.name_en || "Talent"}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl border border-white/10 bg-black/30" />
                      )}

                      <div>
                        <p className="text-white">
                          {talent?.name_ar || talent?.name_en || "Unnamed Talent"}
                        </p>

                        <p className="mt-1 text-xs text-gray-muted">
                        {talent?.city_ar || "—"} ·{" "}
{talent?.gender === "male"
  ? isRtl
    ? "ذكر"
    : "Male"
  : talent?.gender === "female"
    ? isRtl
      ? "أنثى"
      : "Female"
    : talent?.gender || "—"}{" "}
·{" "}
{isRtl ? "تقدم في" : "Applied"}{" "}
{formatDate(application.created_at, isRtl)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
  {application.status === "shortlisted"
    ? isRtl
      ? "مرشّح"
      : "Shortlisted"
    : application.status === "accepted"
      ? isRtl
        ? "مقبول"
        : "Accepted"
      : application.status === "rejected"
        ? isRtl
          ? "مرفوض"
          : "Rejected"
        : isRtl
          ? "قيد المراجعة"
          : "Pending"}
</span>

  {application.status !== "accepted" &&
  application.status !== "rejected" ? (
    <>
      {application.status !== "shortlisted" ? (
  <form action={shortlistApplicationAction}>
    <input
      type="hidden"
      name="application_id"
      value={application.id}
    />
    <input
      type="hidden"
      name="locale"
      value={isRtl ? "ar" : "en"}
    />

    <button
      type="submit"
      className="rounded-full border border-blue-500/30 bg-blue-500/[0.06] px-4 py-2 text-[10px] text-blue-300 transition hover:bg-blue-500/10"
    >
      {isRtl ? "ترشيح" : "Shortlist"}
    </button>
  </form>
) : null}

      <form action={acceptApplicationAction}>
        <input
          type="hidden"
          name="application_id"
          value={application.id}
        />
        <input
          type="hidden"
          name="locale"
          value={isRtl ? "ar" : "en"}
        />

        <button
          type="submit"
          className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-2 text-[10px] text-emerald-300 transition hover:bg-emerald-500/10"
        >
          {isRtl ? "قبول" : "Accept"}
        </button>
      </form>

      <form
        action={rejectAdminApplicationAction}
        className="flex items-center gap-2"
      >
        <input
          type="hidden"
          name="application_id"
          value={application.id}
        />
        <input
          type="hidden"
          name="locale"
          value={isRtl ? "ar" : "en"}
        />

        <input
          type="text"
          name="reason"
          required
          placeholder={isRtl ? "سبب الرفض" : "Rejection reason"}
          className="h-9 min-w-[150px] rounded-full border border-white/10 bg-black/20 px-3 text-[10px] text-white outline-none placeholder:text-white/30 focus:border-red-500/40"
        />

        <button
          type="submit"
          className="rounded-full border border-red-500/30 bg-red-500/[0.06] px-4 py-2 text-[10px] text-red-300 transition hover:bg-red-500/10"
        >
          {isRtl ? "رفض" : "Reject"}
        </button>
      </form>
    </>
  ) : null}

  {talent?.id ? (
    <Link
      href={`/admin/talents/${talent.id}?lang=${isRtl ? "ar" : "en"}`}
      className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:border-gold/40 hover:text-gold"
    >
      {isRtl ? "مراجعة الموهبة" : "Review Talent"}
    </Link>
  ) : null}
</div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
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
    <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-white/80">{value || "—"}</p>
    </div>
  );
}