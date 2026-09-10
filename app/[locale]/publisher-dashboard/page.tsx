import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import {
  Button,
  Card,
  EmptyState,
  SectionHeader,
  StatCard,
} from "@/components/ui";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOpportunityStatusLabel } from "@/lib/utils/opportunity-status";
import {
  cityLabels,
  publisherTypeLabels,
} from "@/lib/constants/publisher";

type Opportunity = {
  id: number;
  title: string;
  status: string | null;
  created_at: string | null;
};

export default async function PublisherDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "ar";
  const isRtl = safeLocale === "ar";
  const statusLocale = isRtl ? "ar" : "en";

  const { profile, publisher } = await requirePublisher(safeLocale);
  const adminClient = createAdminClient();

  const [{ data: allData, error: allError }, { data: latestData, error: latestError }] =
    await Promise.all([
      adminClient
        .from("opportunities")
        .select("id, status")
        .eq("publisher_id", publisher.id),
      adminClient
        .from("opportunities")
        .select("id, title, status, created_at")
        .eq("publisher_id", publisher.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (allError) {
    console.error("Publisher all opportunities error:", allError);
  }

  if (latestError) {
    console.error("Publisher latest opportunities error:", latestError);
  }

  const allOpportunities = allData ?? [];
  const opportunities: Opportunity[] = latestData ?? [];

  const reviewCount = allOpportunities.filter(
    (item) => item.status === "pending_review",
  ).length;

  const publishedCount = allOpportunities.filter(
    (item) => item.status === "published" || item.status === "open",
  ).length;

  const opportunityIds = allOpportunities.map((item) => item.id);
  let applicantsCount = 0;

  if (opportunityIds.length > 0) {
    const { data: applicantRows, error: applicantsCountError } =
      await adminClient
        .from("opportunity_applications")
        .select("id, status")
        .in("opportunity_id", opportunityIds);

    if (applicantsCountError) {
      console.error(
        "Publisher applicants count error:",
        applicantsCountError,
      );
    } else {
      applicantsCount = (applicantRows ?? []).filter(
        (application) =>
          application.status !== "accepted" &&
          application.status !== "rejected",
      ).length;
    }
  }

  const publisherName =
    publisher.company_name?.trim() ||
    publisher.contact_name?.trim() ||
    (isRtl ? "حساب الناشر" : "Publisher Account");

  const approvalStatus = String(
    profile.approval_status ?? "not_submitted",
  )
    .trim()
    .toLowerCase();

  const isApproved = approvalStatus === "approved";
  const isPending =
    approvalStatus === "pending" || approvalStatus === "submitted";
  const isChangesRequested = approvalStatus === "changes_requested";
  const isRejected = approvalStatus === "rejected";
  const isSuspended = publisher.status === "suspended";
  const isOrganization = publisher.publisher_type !== "individual";
  const isVerifiedOrganization =
    isOrganization && publisher.verification_status === "verified";

  // Account approval controls publishing access. Organization verification is
  // a separate trust badge and never blocks an approved publisher.
  const canCreateOpportunity = isApproved && !isSuspended;

  const isProfileComplete = isOrganization
    ? Boolean(publisher.company_name?.trim()) &&
      Boolean(publisher.contact_name?.trim()) &&
      Boolean(publisher.publisher_type?.trim()) &&
      Boolean(publisher.city?.trim()) &&
      Boolean(publisher.profile_image_url?.trim())
    : Boolean(publisher.contact_name?.trim()) &&
      Boolean(publisher.publisher_type?.trim()) &&
      Boolean(publisher.city?.trim());

  const publisherTypeValue = String(
    publisher.publisher_type ?? "",
  ).toLowerCase();
  const cityValue = String(publisher.city ?? "").toLowerCase();

  const displayedPublisherType =
    publisherTypeLabels[publisherTypeValue]?.[isRtl ? "ar" : "en"] ||
    publisher.publisher_type;

  const displayedCity =
    cityLabels[cityValue]?.[isRtl ? "ar" : "en"] || publisher.city;

  const accountStatus = isSuspended
    ? {
        label: isRtl ? "الحساب موقوف" : "Account Suspended",
        color: "border-red-500/20 bg-red-500/10 text-red-300",
        description: isRtl
          ? "يرجى التواصل مع الإدارة لإعادة تفعيل الحساب."
          : "Please contact the administration to reactivate your account.",
      }
    : isApproved
      ? {
          label: isRtl ? "الحساب معتمد" : "Account Approved",
          color:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
          description: isRtl
            ? "يمكنك إنشاء الفرص وإرسالها للمراجعة واستقبال المتقدمين بعد نشرها."
            : "You can create opportunities, submit them for review, and receive applicants once published.",
        }
      : isChangesRequested
        ? {
            label: isRtl ? "مطلوب تعديل الملف" : "Changes Requested",
            color: "border-amber-500/20 bg-amber-500/10 text-amber-300",
            description: isRtl
              ? "راجع التعديلات المطلوبة في ملفك ثم أعد إرساله للمراجعة."
              : "Review the requested profile updates, then resubmit it for review.",
          }
        : isRejected
          ? {
              label: isRtl ? "لم يتم اعتماد الحساب" : "Account Not Approved",
              color: "border-red-500/20 bg-red-500/10 text-red-300",
              description: isRtl
                ? "راجع حالة الملف وحدّث البيانات المطلوبة قبل إعادة الإرسال."
                : "Review your profile status and update the required information before resubmitting.",
            }
          : isPending
            ? {
                label: isRtl ? "قيد مراجعة الإدارة" : "Pending Admin Review",
                color:
                  "border-amber-500/20 bg-amber-500/10 text-amber-300",
                description: isRtl
                  ? "تم استلام ملفك وهو قيد المراجعة. لا يلزم إعادة الإرسال."
                  : "Your profile is under review. You do not need to submit it again.",
              }
            : {
                label: isRtl ? "ملف الناشر غير مكتمل" : "Publisher Profile Incomplete",
                color: "border-gold/25 bg-gold/[0.07] text-gold",
                description: isRtl
                  ? "أكمل البيانات الأساسية ثم أرسل الملف للمراجعة."
                  : "Complete the required details, then submit your profile for review.",
              };

  function formatOpportunityDate(value: string | null) {
    if (!value) return null;

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  }

  const profileActionLabel = isPending
    ? isRtl
      ? "عرض ملف الناشر"
      : "View Publisher Profile"
    : isChangesRequested || isRejected
      ? isRtl
        ? "تعديل ملف الناشر"
        : "Update Publisher Profile"
      : isProfileComplete
        ? isRtl
          ? "مراجعة وإرسال الملف"
          : "Review and Submit"
        : isRtl
          ? "إكمال ملف الناشر"
          : "Complete Publisher Profile";

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-6 sm:p-8 md:p-10">
        <SectionHeader
          eyebrow={isRtl ? "مساحة الناشر" : "Publisher Workspace"}
          title={
            isRtl ? `مرحباً، ${publisherName}` : `Welcome, ${publisherName}`
          }
          description={
            isRtl
              ? "أدر فرصك والمتقدمين وتدفق اختيار المواهب من مكان واحد."
              : "Manage opportunities, applicants, and talent selection in one place."
          }
          action={
            <div className="flex flex-wrap gap-3">
              {canCreateOpportunity ? (
                <Button
                  href={`/${safeLocale}/publisher-dashboard/opportunities/new`}
                  variant="gold"
                  size="lg"
                >
                  <Plus size={16} />
                  {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                </Button>
              ) : !isSuspended ? (
                <Button
                  href={`/${safeLocale}/publisher-dashboard/profile`}
                  variant="gold"
                >
                  {profileActionLabel}
                </Button>
              ) : null}

              <Button
                href={`/${safeLocale}/publisher-dashboard/applicants`}
                variant="outline"
                size="lg"
              >
                <UsersRound size={16} />
                {isRtl ? "المتقدمون" : "Applicants"}
              </Button>
            </div>
          }
        />

        {(publisher.publisher_type || publisher.city) && (
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/60">
            {publisher.publisher_type ? (
              <div className="min-w-[150px] rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                <span>{isRtl ? "نوع الناشر" : "Publisher Type"}</span>
                <div className="mt-1 text-sm text-white">
                  {displayedPublisherType}
                </div>
              </div>
            ) : null}

            {publisher.city ? (
              <div className="min-w-[150px] rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                <span>{isRtl ? "المدينة" : "City"}</span>
                <div className="mt-1 text-sm text-white">{displayedCity}</div>
              </div>
            ) : null}
          </div>
        )}

        <div
          aria-live="polite"
          className={`mt-4 inline-flex max-w-md flex-col rounded-2xl border px-5 py-4 ${accountStatus.color}`}
        >
          <div className="flex items-center gap-2">
            {isApproved && !isSuspended ? (
              <ShieldCheck size={17} aria-hidden="true" />
            ) : null}
            <span className="font-medium">{accountStatus.label}</span>
          </div>
          <span className="mt-1 text-xs leading-6 opacity-80">
            {accountStatus.description}
          </span>
        </div>

        {isApproved && isOrganization && !isVerifiedOrganization ? (
          <div className="mt-4 flex max-w-2xl flex-col gap-3 rounded-2xl border border-gold/15 bg-gold/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/75">
                {isRtl ? "توثيق الجهة اختياري" : "Organization verification is optional"}
              </p>
              <p className="mt-1 text-xs leading-6 text-white/40">
                {isRtl
                  ? "وثّق ارتباطك بالجهة للحصول على شارة التوثيق وزيادة الثقة لدى المواهب."
                  : "Verify your organization connection to earn the badge and build more trust with talent."}
              </p>
            </div>
            <Button
              href={`/${safeLocale}/publisher-dashboard/verification`}
              variant="outline"
            >
              <ShieldCheck size={16} />
              {isRtl ? "بدء التوثيق" : "Start Verification"}
            </Button>
          </div>
        ) : null}
      </Card>

      {applicantsCount > 0 ? (
        <Card className="overflow-hidden border-gold/20 bg-gradient-to-br from-gold/[0.10] via-gold/[0.04] to-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08] text-gold">
                <UsersRound size={21} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
                  {isRtl ? "يتطلب انتباهك" : "Needs Your Attention"}
                </p>
                <h2 className="mt-2 text-xl font-light text-white sm:text-2xl">
                  {isRtl
                    ? applicantsCount === 1
                      ? "لديك متقدم على فرصك"
                      : `لديك ${applicantsCount} متقدمين على فرصك`
                    : applicantsCount === 1
                      ? "You have 1 applicant"
                      : `You have ${applicantsCount} applicants`}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  {isRtl
                    ? "راجع المتقدمين وملفاتهم واتخذ القرار المناسب لكل طلب."
                    : "Review applicants and their profiles, then take action on each application."}
                </p>
              </div>
            </div>

            <Link
              href={`/${safeLocale}/publisher-dashboard/applicants`}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.08] px-5 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "مراجعة المتقدمين" : "Review Applicants"}
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/${safeLocale}/publisher-dashboard/opportunities`}
          className="block transition hover:scale-[1.02]"
        >
          <StatCard
            icon={<BriefcaseBusiness size={18} />}
            label={isRtl ? "إجمالي الفرص" : "Total Opportunities"}
            value={allOpportunities.length}
          />
        </Link>

        <Link
          href={`/${safeLocale}/publisher-dashboard/opportunities?status=pending_review`}
          className="block transition hover:scale-[1.02]"
        >
          <StatCard
            icon={<Clock3 size={18} />}
            label={isRtl ? "قيد المراجعة" : "Pending Review"}
            value={reviewCount}
          />
        </Link>

        <Link
          href={`/${safeLocale}/publisher-dashboard/opportunities?status=published`}
          className="block transition hover:scale-[1.02]"
        >
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label={isRtl ? "الفرص المنشورة" : "Published"}
            value={publishedCount}
          />
        </Link>
      </section>

      <Card className="p-6 sm:p-8">
        <div className="mb-8">
          <SectionHeader
            eyebrow={isRtl ? "آخر الفرص" : "Latest Opportunities"}
            title={isRtl ? "إدارة الفرص" : "Opportunity Management"}
            action={
              <Button
                href={`/${safeLocale}/publisher-dashboard/opportunities`}
                variant="ghost"
              >
                {isRtl ? "عرض جميع الفرص" : "View All Opportunities"}
              </Button>
            }
          />
        </div>

        {opportunities.length > 0 ? (
          <div className="divide-y divide-white/10 overflow-hidden rounded-[1.5rem] border border-white/10">
            {opportunities.map((item) => {
              const formattedDate = formatOpportunityDate(item.created_at);

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 bg-black/20 p-5 transition hover:bg-white/[0.025] md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="text-xl font-light text-white">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/35">
                      <span className="arabic-safe uppercase tracking-[0.18em]">
                        {getOpportunityStatusLabel(
                          item.status ?? "",
                          statusLocale,
                        )}
                      </span>
                      {formattedDate && item.created_at ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="h-1 w-1 rounded-full bg-white/20"
                          />
                          <time dateTime={item.created_at}>{formattedDate}</time>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <Button
                    href={`/${safeLocale}/publisher-dashboard/opportunities/${item.id}`}
                    variant="outline"
                  >
                    {isRtl ? "إدارة" : "Manage"}
                  </Button>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={
              isRtl ? "لا توجد فرص حتى الآن" : "No opportunities yet"
            }
            description={
              canCreateOpportunity
                ? isRtl
                  ? "أنشئ أول فرصة لتبدأ باستقبال طلبات المواهب بعد اعتمادها ونشرها."
                  : "Create your first opportunity to start receiving talent applications once it is approved and published."
                : isSuspended
                  ? isRtl
                    ? "الحساب موقوف حاليًا، لذلك لا يمكن إنشاء فرص جديدة."
                    : "This account is currently suspended, so new opportunities cannot be created."
                  : isRtl
                    ? "يمكنك إنشاء الفرص بعد اعتماد ملف الناشر من الإدارة."
                    : "You can create opportunities after your publisher profile is approved."
            }
            action={
              canCreateOpportunity ? (
                <Button
                  href={`/${safeLocale}/publisher-dashboard/opportunities/new`}
                  variant="gold"
                >
                  <Plus size={16} />
                  {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                </Button>
              ) : !isSuspended ? (
                <Button
                  href={`/${safeLocale}/publisher-dashboard/profile`}
                  variant="gold"
                >
                  {profileActionLabel}
                </Button>
              ) : undefined
            }
          />
        )}
      </Card>
    </div>
  );
}
