import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import PublisherShell from "@/components/publisher/PublisherShell";
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

  const { publisher } = await requirePublisher(locale);
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

  const publisherName =
    publisher.company_name ||
    publisher.contact_name ||
    "MLAMH Publisher";

  const isVerified = publisher.verified === true;
  const isSuspended = publisher.status === "suspended";
  const canCreateOpportunity = isVerified && !isSuspended;
  
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
        label: isRtl ? "الحساب موقوف" : "Account Suspended",
        color: "border-red-500/20 bg-red-500/10 text-red-300",
        description: isRtl
          ? "يرجى التواصل مع الإدارة لإعادة تفعيل الحساب."
          : "Please contact the administration to reactivate your account.",
      }
    : isVerified
      ? {
          label: isRtl ? "الحساب معتمد" : "Account Verified",
          color:
            "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
          description: isRtl
            ? "يمكنك إنشاء ونشر الفرص واستقبال المتقدمين."
            : "You can create and publish opportunities and receive applicants.",
        }
      : {
          label: isRtl
            ? "قيد مراجعة الإدارة"
            : "Pending Admin Review",
          color: "border-amber-500/20 bg-amber-500/10 text-amber-300",
          description: isRtl
            ? "ملف الشركة قيد مراجعة الإدارة. يمكنك تعديل بياناتك أثناء فترة المراجعة."
            : "Your company profile is under review. You may continue updating it during the review period.",
        };

  function formatOpportunityDate(value: string | null) {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);

if (Number.isNaN(parsedDate.getTime())) {
  return null;
}

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
    <PublisherShell locale={locale} isRtl={isRtl}>
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
                    href={`/${locale}/opportunities/new`}
                    variant="gold"
                    size="lg"
                  >
                    <Plus size={16} />
                    {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                  </Button>
                ) : !isSuspended ? (
                  <Button
                    href={`/${locale}/publisher-dashboard/profile`}
                    variant="gold"
                    size="lg"
                  >
                    {isRtl
                      ? "مراجعة ملف الشركة"
                      : "Review Company Profile"}
                  </Button>
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
  {isVerified && !isSuspended ? (
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

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<BriefcaseBusiness size={18} />}
            label={isRtl ? "إجمالي الفرص" : "Total Opportunities"}
            value={allOpportunities.length}
          />

          <StatCard
            icon={<Clock3 size={18} />}
            label={isRtl ? "قيد المراجعة" : "Pending Review"}
            value={reviewCount}
          />

          <StatCard
            icon={<CheckCircle2 size={18} />}
            label={isRtl ? "الفرص المنشورة" : "Published"}
            value={publishedCount}
          />
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
                    : isRtl
                      ? "يمكنك إنشاء الفرص بعد اعتماد ملف الشركة من الإدارة."
                      : "You can create opportunities after your company profile is approved."
              }
              action={
                canCreateOpportunity ? (
                  <Button
                    href={`/${locale}/opportunities/new`}
                    variant="gold"
                  >
                    <Plus size={16} />
                    {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                  </Button>
                ) : !isSuspended ? (
                  <Button
                    href={`/${locale}/publisher-dashboard/profile`}
                    variant="gold"
                  >
                    {isRtl
                      ? "مراجعة ملف الشركة"
                      : "Review Company Profile"}
                  </Button>
                ) : undefined
              }
            />
          )}
        </Card>
      </div>
    </PublisherShell>
  );
}
