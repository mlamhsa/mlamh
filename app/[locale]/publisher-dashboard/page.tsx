import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Plus,
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
  const isRtl = locale === "ar";
  const statusLocale = isRtl ? "ar" : "en";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: allData, error: allError } = await adminClient
    .from("opportunities")
    .select("id, status")
    .eq("publisher_id", publisher.id);

  if (allError) console.error("Publisher all opportunities error:", allError);

  const { data: latestData, error: latestError } = await adminClient
    .from("opportunities")
    .select("id, title, status, created_at")
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (latestError) console.error("Publisher latest opportunities error:", latestError);

  const allOpportunities = allData ?? [];
  const opportunities: Opportunity[] = latestData ?? [];

  const reviewCount = allOpportunities.filter(
    (item) => item.status === "pending_review"
  ).length;

  const publishedCount = allOpportunities.filter(
    (item) => item.status === "published" || item.status === "open"
  ).length;

  const publisherName =
    publisher.company_name || publisher.contact_name || "MLAMH Publisher";

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <Card className="overflow-hidden bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-gold/[0.06] p-8 md:p-10">
          <SectionHeader
            eyebrow={isRtl ? "مساحة الشركة" : "Company Workspace"}
            title={isRtl ? `مرحباً، ${publisherName}` : `Welcome, ${publisherName}`}
            description={
              isRtl
                ? "أدر فرصك، المتقدمين، وتدفق اختيار المواهب من مكان واحد."
                : "Manage opportunities, applicants, and talent selection in one place."
            }
            action={
              <div className="flex flex-wrap gap-3">
                <Button href={`/${locale}/opportunities/new`} variant="gold" size="lg">
                  <Plus size={16} />
                  {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                </Button>

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
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<BriefcaseBusiness size={18} />}
            label={isRtl ? "الفرص" : "Opportunities"}
            value={allOpportunities.length}
          />

          <StatCard
            icon={<Clock3 size={18} />}
            label={isRtl ? "قيد المراجعة" : "In Review"}
            value={reviewCount}
          />

          <StatCard
            icon={<CheckCircle2 size={18} />}
            label={isRtl ? "منشورة" : "Published"}
            value={publishedCount}
          />
        </section>

        <Card className="p-8">
          <div className="mb-8">
            <SectionHeader
              eyebrow={isRtl ? "آخر الفرص" : "Latest Opportunities"}
              title={isRtl ? "إدارة الفرص" : "Opportunity Management"}
              action={
                <Button
                  href={`/${locale}/publisher-dashboard/opportunities`}
                  variant="ghost"
                >
                  {isRtl ? "عرض الكل" : "View All"}
                </Button>
              }
            />
          </div>

          {opportunities.length > 0 ? (
            <div className="divide-y divide-white/10 overflow-hidden rounded-[1.5rem] border border-white/10">
              {opportunities.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 bg-black/20 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h3 className="text-xl font-light text-white">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">
                      {getOpportunityStatusLabel(item.status ?? "", statusLocale)}
                    </p>
                  </div>

                  <Button
                    href={`/${locale}/publisher-dashboard/opportunities/${item.id}`}
                    variant="outline"
                  >
                    {isRtl ? "عرض" : "View"}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={isRtl ? "ابدأ بنشر أول فرصة" : "Create your first opportunity"}
              description={
                isRtl
                  ? "ستظهر فرصك هنا بعد إنشائها."
                  : "Your opportunities will appear here after creation."
              }
              action={
                <Button href={`/${locale}/opportunities/new`} variant="gold">
                  {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                </Button>
              }
            />
          )}
        </Card>
      </div>
    </PublisherShell>
  );
}