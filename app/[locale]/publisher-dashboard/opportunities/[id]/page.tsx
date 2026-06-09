import Link from "next/link";
import PublisherShell from "@/components/publisher/PublisherShell";
import {
  archiveOpportunityAction,
  closeOpportunityAction,
  restoreOpportunityAction,
} from "@/lib/actions/opportunity-status-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function statusLabel(status: string, isRtl: boolean) {
  switch (status) {
    case "draft":
      return isRtl ? "مسودة" : "Draft";
    case "open":
      return isRtl ? "مفتوحة" : "Open";
    case "published":
      return isRtl ? "منشورة" : "Published";
    case "closed":
      return isRtl ? "مغلقة" : "Closed";
    case "archived":
      return isRtl ? "مؤرشفة" : "Archived";
    default:
      return "-";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "draft":
      return "border-white/15 bg-white/5 text-white/50";
    case "open":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "published":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "closed":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "archived":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}

export default async function OpportunityDetailsPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return <p>{isRtl ? "يرجى تسجيل الدخول أولاً" : "Please login first"}</p>;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) return <p>{isRtl ? "لم يتم العثور على الملف الشخصي" : "Profile not found"}</p>;

  const { data: publisher } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher) return <p>{isRtl ? "لم يتم العثور على حساب الناشر" : "Publisher account not found"}</p>;

  const { data: opportunity } = await adminClient
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (!opportunity) return <p>{isRtl ? "الفرصة غير موجودة أو لا تملك صلاحية الوصول" : "Opportunity not found or access denied"}</p>;

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select("id, status, talent_id, created_at")
    .eq("opportunity_id", id)
    .order("created_at", { ascending: false });

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <Link
              href={`/${locale}/publisher-dashboard/opportunities`}
              className="text-sm text-gold underline underline-offset-4"
            >
              {isRtl ? "← العودة إلى الفرص" : "← Back to Opportunities"}
            </Link>
            <p className="text-xs uppercase tracking-[0.35em] text-gold mt-6">
              {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
            </p>
            <h1 className="mt-2 text-4xl font-light text-white">{opportunity.title}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(opportunity.status)}`}
          >
            {statusLabel(opportunity.status, isRtl)}
          </span>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`}
              className="border border-blue-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-blue-300 hover:bg-blue-400 hover:text-black"
            >
              {isRtl ? "تعديل" : "Edit"}
            </Link>

            <Link
              href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/applicants`}
              className="border border-gold/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-gold hover:bg-gold hover:text-black"
            >
              {isRtl ? "المتقدمون" : "Applicants"}
            </Link>

            {opportunity.status === "open" && (
              <form action={closeOpportunityAction.bind(null, opportunity.id)}>
                <button className="border border-yellow-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-yellow-300 hover:bg-yellow-400 hover:text-black">
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </form>
            )}

            {opportunity.status !== "archived" ? (
              <form action={archiveOpportunityAction.bind(null, opportunity.id)}>
                <button className="border border-red-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-red-300 hover:bg-red-400 hover:text-black">
                  {isRtl ? "أرشفة" : "Archive"}
                </button>
              </form>
            ) : (
              <form action={restoreOpportunityAction.bind(null, opportunity.id)}>
                <button className="border border-emerald-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-300 hover:bg-emerald-400 hover:text-black">
                  {isRtl ? "استعادة" : "Restore"}
                </button>
              </form>
            )}
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5">
          {applications && applications.length > 0 ? (
            <div className="divide-y divide-white/10">
              {applications.map((app) => (
                <div key={app.id} className="grid lg:grid-cols-[2fr_0.8fr] gap-5 p-5 hover:bg-white/[0.03]">
                  <div>
                    <p className="text-white">{app.talent_id}</p>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(app.status ?? "pending")}`}>
                      {statusLabel(app.status ?? "pending", isRtl)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-10 text-white/50 text-center">
              {isRtl ? "لا يوجد متقدمون بعد" : "No applicants yet"}
            </div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}