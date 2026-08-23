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

import {
  Button,
  Card,
  EmptyState,
  SectionHeader,
  StatCard,
} from "@/components/ui";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
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

  const { profile, publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: allData, error: allError } = await adminClient
    .from("opportunities")
    .select("id, status")
    .eq("publisher_id", publisher.id);

  if (allError) {
    console.error("Publisher all opportunities error:", allError);
  }

  const { data: latestData, error: latestError } = await adminClient
    .from("opportunities")
    .select("id, title, status, created_at")
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false })
    .limit(5);

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

  const opportunityIds = allOpportunities.map(
    (item) => item.id,
  );
  
  let applicantsCount = 0;
  
  if (opportunityIds.length > 0) {
    const {
      data: applicantRows,
      error: applicantsCountError,
    } = await adminClient
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
  (isRtl ? "حساب الناشر" : "Publisher Account");

    const approvalStatus =
    profile.approval_status ?? "not_submitted";
  
  const isApproved = approvalStatus === "approved";
  const isOrganization =
  publisher.publisher_type !== "individual";

const isVerifiedOrganization =
  !isOrganization ||
  (
    publisher.verified === true &&
    publisher.verification_status === "verified"
  );
  const isPending = approvalStatus === "pending";
  const isChangesRequested =
    approvalStatus === "changes_requested";
  const isRejected = approvalStatus === "rejected";
  const isSuspended = publisher.status === "suspended";
  const isNotSubmitted =
  approvalStatus === "not_submitted";

  const canCreateOpportunity =
  isApproved &&
  !isSuspended &&
  isVerifiedOrganization;
  
    const isProfileComplete =
  Boolean(publisher.company_name?.trim()) &&
  Boolean(publisher.contact_name?.trim()) &&
  Boolean(publisher.publisher_type?.trim()) &&
  Boolean(publisher.city?.trim()) &&
  Boolean(publisher.description?.trim());

  const publisherTypeValue = String(
    publisher.publisher_type ?? "",
  ).toLowerCase();
  
  const cityValue = String(publisher.city ?? "").toLowerCase();
  
  const displayedPublisherType =
    publisherTypeLabels[publisherTypeValue]?.[isRtl ? "ar" : "en"] ||
    publisher.publisher_type;
  
  const displayedCity =
    cityLabels[cityValue]?.[isRtl ? "ar" : "en"] ||
    publisher.city;

    const accountStatus = isSuspended
  ? {
      label: isRtl
        ? "الحساب موقوف"
        : "Account Suspended",
      color:
        "border-red-500/20 bg-red-500/10 text-red-300",
      description: isRtl
        ? "يرجى التواصل مع الإدارة لإعادة تفعيل الحساب."
        : "Please contact the administration to reactivate your account.",
    }
  : isApproved &&
      isOrganization &&
      !isVerifiedOrganization
    ? {
        label: isRtl
          ? "توثيق الجهة مطلوب"
          : "Organization Verification Required",
        color:
          "border-amber-500/20 bg-amber-500/10 text-amber-300",
        description: isRtl
          ? "تم اعتماد ملف الجهة، لكن يجب توثيق ارتباطك بها قبل نشر الفرص واستقبال المتقدمين."
          : "Your organization profile is approved, but your connection to the organization must be verified before publishing opportunities and receiving applicants.",
      }
    : isApproved
      ? {
          label: isRtl
            ? "الحساب معتمد"
            : "Account Approved",
          color:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
          description: isRtl
            ? "يمكنك إنشاء ونشر الفرص واستقبال المتقدمين."
            : "You can create and publish opportunities and receive applicants.",
        }
      : isChangesRequested
        ? {
            label: isRtl
              ? "مطلوب تعديل الملف"
              : "Changes Requested",
            color:
              "border-amber-500/20 bg-amber-500/10 text-amber-300",
            description: isRtl
              ? "طلبت الإدارة تعديل بعض بيانات ملف الشركة. راجع ملفك وأكمل التعديلات المطلوبة ثم أعد إرساله للمراجعة."
              : "The administration requested changes to your company profile. Review the requested changes, update your profile, and resubmit it for review.",
          }
        : isRejected
          ? {
              label: isRtl
                ? "لم يتم اعتماد الحساب"
                : "Account Not Approved",
              color:
                "border-red-500/20 bg-red-500/10 text-red-300",
              description: isRtl
                ? "لم يتم اعتماد ملف الشركة. راجع حالة الملف لمعرفة التفاصيل."
                : "Your company profile was not approved. Review your profile status for details.",
            }
          : isPending
            ? {
                label: isRtl
                  ? "قيد مراجعة الإدارة"
                  : "Pending Admin Review",
                color:
                  "border-amber-500/20 bg-amber-500/10 text-amber-300",
                description: isRtl
                  ? "تم إرسال ملف الشركة وهو قيد مراجعة الإدارة."
                  : "Your company profile has been submitted and is under administrative review.",
              }
            : {
                label: isRtl
                  ? "ملف الشركة غير مكتمل"
                  : "Company Profile Incomplete",
                color:
                  "border-gold/25 bg-gold/[0.07] text-gold",
                description: isRtl
                  ? "أكمل بيانات الشركة ثم أرسل الملف للمراجعة."
                  : "Complete your company details, then submit the profile for review.",
              };

  function formatOpportunityDate(value: string | null) {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);

if (Number.isNaN(parsedDate.getTime())) {
  return null;
}
    return new Intl.DateTimeFormat(isRtl ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(parsedDate);
  }

  return (
      <div className="space-y-8">
        <Card className="overflow-hidden bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-6 sm:p-8 md:p-10">
          <SectionHeader
            eyebrow={isRtl ? "مساحة الشركة" : "Company Workspace"}
            title={
              isRtl
                ? `مرحباً، ${publisherName}`
                : `Welcome, ${publisherName}`
            }
            description={
              isRtl
                ? "أدر فرصك، المتقدمين، وتدفق اختيار المواهب من مكان واحد."
                : "Manage opportunities, applicants, and talent selection in one place."
            }
            action={
              <div className="flex flex-wrap gap-3">
                {canCreateOpportunity ? (
  <Button
  href={`/${locale}/publisher-dashboard/opportunities/new`}
    variant="gold"
    size="lg"
  >
    <Plus size={16} />
    {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
  </Button>
) : !isSuspended ? (
  isApproved &&
  isOrganization &&
  !isVerifiedOrganization ? (
    <Button
      href={`/${locale}/publisher-dashboard/verification`}
      variant="gold"
    >
      <ShieldCheck size={16} />
      {isRtl
        ? "توثيق الجهة"
        : "Verify Organization"}
    </Button>
  ) : (
    <Button
      href={`/${locale}/publisher-dashboard/profile`}
      variant="gold"
    >
      {isPending
        ? isRtl
          ? "عرض ملف الجهة"
          : "View Organization Profile"
        : isChangesRequested || isRejected
          ? isRtl
            ? "تعديل ملف الجهة"
            : "Update Organization Profile"
          : isProfileComplete
            ? isRtl
              ? "مراجعة وإرسال الملف"
              : "Review and Submit"
            : isRtl
              ? "إكمال ملف الجهة"
              : "Complete Organization Profile"}
    </Button>
  )
) : null}

                <Button
                  href={`/${locale}/publisher-dashboard/applicants`}
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
                  <span>{isRtl ? "نوع الشركة" : "Company Type"}</span>

                  <div className="mt-1 text-sm text-white">
                    {displayedPublisherType}
                  </div>
                </div>
              ) : null}

              {publisher.city ? (
                <div className="min-w-[150px] rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                  <span>{isRtl ? "المدينة" : "City"}</span>

                  <div className="mt-1 text-sm text-white">
                  {displayedCity}
                  </div>
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

  <span className="font-medium">
    {accountStatus.label}
  </span>
</div>
            <span className="mt-1 text-xs leading-6 opacity-80">
              {accountStatus.description}
            </span>
          </div>
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
            {isRtl
              ? "يتطلب انتباهك"
              : "Needs Your Attention"}
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
        href={`/${locale}/publisher-dashboard/applicants`}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.08] px-5 text-sm text-gold transition hover:bg-gold hover:text-black"
      >
        {isRtl
          ? "مراجعة المتقدمين"
          : "Review Applicants"}

        {isRtl ? (
          <ArrowLeft size={16} />
        ) : (
          <ArrowRight size={16} />
        )}
      </Link>
    </div>
  </Card>
) : null}

        <section className="grid gap-4 md:grid-cols-3">

  <Link
    href={`/${locale}/publisher-dashboard/opportunities`}
    className="block transition hover:scale-[1.02]"
  >
    <StatCard
      icon={<BriefcaseBusiness size={18} />}
      label={isRtl ? "إجمالي الفرص" : "Total Opportunities"}
      value={allOpportunities.length}
    />
  </Link>

  <Link
    href={`/${locale}/publisher-dashboard/opportunities?status=pending_review`}
    className="block transition hover:scale-[1.02]"
  >
    <StatCard
      icon={<Clock3 size={18} />}
      label={isRtl ? "قيد المراجعة" : "Pending Review"}
      value={reviewCount}
    />
  </Link>

  <Link
    href={`/${locale}/publisher-dashboard/opportunities?status=published`}
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
                  href={`/${locale}/publisher-dashboard/opportunities`}
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

                            <time dateTime={item.created_at}>
                              {formattedDate}
                            </time>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      href={`/${locale}/publisher-dashboard/opportunities/${item.id}`}
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
                isRtl
                  ? "لا توجد فرص حتى الآن"
                  : "No opportunities yet"
              }
              description={
                canCreateOpportunity
                  ? isRtl
                    ? "أنشئ أول فرصة لتبدأ باستقبال طلبات المواهب."
                    : "Create your first opportunity to start receiving applications."
                  : isSuspended
                    ? isRtl
                      ? "الحساب موقوف حاليًا، لذلك لا يمكن إنشاء فرص جديدة."
                      : "This account is currently suspended, so new opportunities cannot be created."
                    : isApproved &&
                        isOrganization &&
                        !isVerifiedOrganization
                      ? isRtl
                        ? "ملف الجهة معتمد، لكن يجب توثيق ارتباطك بالجهة قبل إنشاء ونشر الفرص."
                        : "Your organization profile is approved, but your connection to the organization must be verified before creating opportunities."
                      : isRtl
                        ? "يمكنك إنشاء الفرص بعد اعتماد ملف الجهة من الإدارة."
                        : "You can create opportunities after your organization profile is approved."
              }
              action={
  canCreateOpportunity ? (
    <Button
      href={`/${locale}/publisher-dashboard/opportunities/new`}
      variant="gold"
    >
      <Plus size={16} />
      {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
    </Button>
  ) : !isSuspended ? (
    isApproved &&
    isOrganization &&
    !isVerifiedOrganization ? (
      <Button
        href={`/${locale}/publisher-dashboard/verification`}
        variant="gold"
      >
        <ShieldCheck size={16} />
        {isRtl
          ? "توثيق الجهة"
          : "Verify Organization"}
      </Button>
    ) : (
      <Button
        href={`/${locale}/publisher-dashboard/profile`}
        variant="gold"
      >
        {isPending
          ? isRtl
            ? "عرض ملف الجهة"
            : "View Organization Profile"
          : isChangesRequested || isRejected
            ? isRtl
              ? "تعديل ملف الجهة"
              : "Update Organization Profile"
            : isProfileComplete
              ? isRtl
                ? "مراجعة وإرسال الملف"
                : "Review and Submit"
              : isRtl
                ? "إكمال ملف الجهة"
                : "Complete Organization Profile"}
      </Button>
    )
  ) : undefined
}
            />
          )}
        </Card>
      </div>
  );
}
