import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export default async function CastingAnalyticsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const adminClient = createAdminClient();

  const { data: projects, error: projectsError } = await adminClient
    .from("casting_projects")
    .select("id,status,commercial_status,package_code,quoted_amount,currency,opportunity_id,created_at");
  if (projectsError) console.error("[CastingAnalyticsPage projects]", projectsError);

  const rows = projects ?? [];
  const projectIds = rows.map((item) => Number(item.id)).filter((id) => Number.isInteger(id) && id > 0);

  const { data: roles, error: rolesError } = projectIds.length
    ? await adminClient
        .from("casting_roles")
        .select("id,casting_project_id,opportunity_id,status")
        .in("casting_project_id", projectIds)
    : { data: [], error: null };
  if (rolesError) console.error("[CastingAnalyticsPage roles]", rolesError);

  const roleRows = roles ?? [];
  const opportunityIds = Array.from(
    new Set([
      ...rows
        .map((item) => Number(item.opportunity_id))
        .filter((id) => Number.isInteger(id) && id > 0),
      ...roleRows
        .map((item) => Number(item.opportunity_id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ]),
  );

  const projectIdsWithRoleOpportunity = new Set(
    roleRows
      .filter((role) => Number.isInteger(Number(role.opportunity_id)) && Number(role.opportunity_id) > 0)
      .map((role) => Number(role.casting_project_id)),
  );

  const [{ data: applications }, { data: shortlist }, { data: payments, error: paymentsError }] = await Promise.all([
    opportunityIds.length
      ? adminClient
          .from("opportunity_applications")
          .select("id,opportunity_id,status")
          .in("opportunity_id", opportunityIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? adminClient
          .from("casting_shortlist")
          .select("id,casting_project_id,status")
          .in("casting_project_id", projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? adminClient
          .from("casting_payments")
          .select("id,casting_project_id,status,amount,currency,paid_at,created_at")
          .in("casting_project_id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (paymentsError) console.error("[CastingAnalyticsPage payments]", paymentsError);

  const appRows = applications ?? [];
  const shortlistRows = shortlist ?? [];
  const paymentRows = payments ?? [];
  const activeStatuses = new Set(["active", "screening", "shortlist_ready", "client_review"]);
  const qualifiedStatuses = new Set([
    "qualified",
    "proposal",
    "awaiting_client",
    "active",
    "screening",
    "shortlist_ready",
    "client_review",
    "completed",
  ]);

  const totalBriefs = rows.length;
  const qualifiedBriefs = rows.filter((item) => qualifiedStatuses.has(item.status)).length;
  const linkedProjects = rows.filter(
    (item) => Boolean(item.opportunity_id) || projectIdsWithRoleOpportunity.has(Number(item.id)),
  ).length;
  const activeProjects = rows.filter((item) => activeStatuses.has(item.status)).length;
  const completedProjects = rows.filter((item) => item.status === "completed").length;
  const activeRoles = roleRows.filter((item) => activeStatuses.has(item.status)).length;
  const linkedRoles = roleRows.filter((item) => item.opportunity_id).length;
  const shortlisted = shortlistRows.filter((item) => ["shortlisted", "presented", "selected"].includes(item.status)).length;
  const selected = shortlistRows.filter((item) => item.status === "selected").length;

  const quotedPipeline = rows.reduce((sum, item) => sum + number(item.quoted_amount), 0);
  const openPipeline = rows
    .filter((item) => ["lead", "proposal"].includes(item.commercial_status || "lead"))
    .reduce((sum, item) => sum + number(item.quoted_amount), 0);
  const wonProjects = rows.filter((item) => item.commercial_status === "won");
  const wonValue = wonProjects.reduce((sum, item) => sum + number(item.quoted_amount), 0);
  const lostProjects = rows.filter((item) => item.commercial_status === "lost").length;
  const paidRows = paymentRows.filter((item) => item.status === "paid");
  const collectedRevenue = paidRows.reduce((sum, item) => sum + number(item.amount), 0);
  const refunded = paymentRows
    .filter((item) => item.status === "refunded")
    .reduce((sum, item) => sum + number(item.amount), 0);
  const netCollected = Math.max(0, collectedRevenue - refunded);
  const pendingPayments = paymentRows
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + number(item.amount), 0);
  const outstandingWon = Math.max(0, wonValue - netCollected);

  const conversion = totalBriefs > 0 ? Math.round((linkedProjects / totalBriefs) * 100) : 0;
  const selectionRate = appRows.length > 0 ? Math.round((selected / appRows.length) * 100) : 0;
  const decidedDeals = wonProjects.length + lostProjects;
  const winRate = decidedDeals > 0 ? Math.round((wonProjects.length / decidedDeals) * 100) : 0;
  const collectionRate = wonValue > 0 ? Math.min(100, Math.round((netCollected / wonValue) * 100)) : 0;

  const packageCounts = ["starter", "pro", "custom"].map((packageCode) => ({
    packageCode,
    count: rows.filter((item) => item.package_code === packageCode).length,
    quoted: rows
      .filter((item) => item.package_code === packageCode)
      .reduce((sum, item) => sum + number(item.quoted_amount), 0),
  }));

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-white/10 pb-6">
          <Link href={`/admin/casting?lang=${language}`} className="text-xs text-gold hover:underline">
            {isArabic ? "← العودة إلى MLAMH Casting" : "← Back to MLAMH Casting"}
          </Link>
          <p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">CASTING ANALYTICS</p>
          <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
            {isArabic ? "أداء Managed Casting" : "Managed Casting Performance"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
            {isArabic
              ? "لوحة موحدة للتشغيل والمبيعات والتحصيل، وتشمل جميع فرص الأدوار داخل كل مشروع. الإيراد المحصل = دفعات Paid ناقص سجلات Refunded، ولا تُعامل قيمة العروض كإيراد."
              : "One view for operations, sales, and collections, including every role opportunity in each project. Collected revenue = Paid entries less Refunded entries; quoted value is not revenue."}
          </p>
        </div>

        <section className="mt-6">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">
            {isArabic ? "التشغيل" : "OPERATIONS"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [isArabic ? "إجمالي الـ Briefs" : "Total briefs", totalBriefs],
              [isArabic ? "Briefs مؤهلة" : "Qualified briefs", qualifiedBriefs],
              [isArabic ? "مشاريع مرتبطة بفرص" : "Projects with opportunities", linkedProjects],
              [isArabic ? "مشاريع نشطة" : "Active projects", activeProjects],
              [isArabic ? "أدوار مرتبطة بفرص" : "Roles with opportunities", linkedRoles],
              [isArabic ? "أدوار نشطة" : "Active roles", activeRoles],
              [isArabic ? "إجمالي الطلبات" : "Applications", appRows.length],
              [isArabic ? "القائمة المختصرة" : "Shortlisted", shortlisted],
              [isArabic ? "تم اختيارهم" : "Selected", selected],
              [isArabic ? "مشاريع مكتملة" : "Completed", completedProjects],
            ].map(([itemLabel, value]) => (
              <div key={String(itemLabel)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs text-white/40">{itemLabel}</p>
                <p className="mt-3 text-3xl font-light text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">
            {isArabic ? "التجاري والإيرادات" : "COMMERCIAL & REVENUE"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs text-white/40">{isArabic ? "Pipeline مفتوح" : "Open pipeline"}</p>
              <p className="mt-3 text-3xl font-light text-white">{money(openPipeline)} <span className="text-sm text-white/35">SAR</span></p>
            </div>
            <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-5">
              <p className="text-xs text-gold">{isArabic ? "صفقات Won" : "Won deals"}</p>
              <p className="mt-3 text-3xl font-light text-white">{wonProjects.length}</p>
              <p className="mt-2 text-xs text-white/35">{money(wonValue)} SAR</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
              <p className="text-xs text-emerald-300">{isArabic ? "الإيراد المحصل" : "Collected revenue"}</p>
              <p className="mt-3 text-3xl font-light text-white">{money(netCollected)} <span className="text-sm text-white/35">SAR</span></p>
              <p className="mt-2 text-xs text-white/35">{isArabic ? "Paid ناقص Refunded" : "Paid less refunded"}</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
              <p className="text-xs text-amber-200">{isArabic ? "متبقي على الصفقات الرابحة" : "Outstanding won value"}</p>
              <p className="mt-3 text-3xl font-light text-white">{money(outstandingWon)} <span className="text-sm text-white/35">SAR</span></p>
              <p className="mt-2 text-xs text-white/35">
                {isArabic ? `دفعات Pending مسجلة: ${money(pendingPayments)} SAR` : `Recorded pending payments: ${money(pendingPayments)} SAR`}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-4">
          {[
            ["Brief → Opportunity", `${conversion}%`, isArabic ? "المشاريع التي أصبحت لها فرصة رئيسية أو فرصة Role." : "Projects with either a legacy or role opportunity."],
            ["Application → Selected", `${selectionRate}%`, isArabic ? "مؤشر مبكر لجودة الفرز عبر جميع الأدوار." : "Early screening-quality signal across all roles."],
            [isArabic ? "معدل الفوز" : "Win rate", `${winRate}%`, isArabic ? "Won من الصفقات التي حُسمت Won/Lost." : "Won among deals decided Won/Lost."],
            [isArabic ? "معدل التحصيل" : "Collection rate", `${collectionRate}%`, isArabic ? "المحصل الصافي مقارنة بقيمة Won." : "Net collected compared with Won value."],
          ].map(([itemLabel, value, description]) => (
            <div key={String(itemLabel)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs text-white/40">{itemLabel}</p>
              <p className="mt-3 text-4xl font-light text-white">{value}</p>
              <p className="mt-2 text-xs leading-6 text-white/35">{description}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-xl font-light text-white">{isArabic ? "قيمة العروض" : "Quoted pipeline"}</h2>
            <p className="mt-4 text-4xl font-light text-white">{money(quotedPipeline)} <span className="text-base text-white/35">SAR</span></p>
            <p className="mt-3 text-xs leading-6 text-white/35">{isArabic ? "مؤشر Pipeline فقط. لا يُحسب كإيراد محصل." : "Pipeline indicator only. It is not collected revenue."}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-xl font-light text-white">{isArabic ? "حركة المدفوعات" : "Payment activity"}</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div><p className="text-xs text-white/35">Paid</p><p className="mt-2 text-xl text-white">{paidRows.length}</p></div>
              <div><p className="text-xs text-white/35">Pending</p><p className="mt-2 text-xl text-white">{paymentRows.filter((item) => item.status === "pending").length}</p></div>
              <div><p className="text-xs text-white/35">Refunded</p><p className="mt-2 text-xl text-white">{paymentRows.filter((item) => item.status === "refunded").length}</p></div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <h2 className="text-xl font-light text-white">{isArabic ? "توزيع الباقات" : "Package mix"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {packageCounts.map((item) => (
              <div key={item.packageCode} className="rounded-xl border border-white/[0.08] bg-black/20 p-5">
                <p className="capitalize text-sm text-gold">{item.packageCode}</p>
                <p className="mt-3 text-3xl font-light text-white">{item.count}</p>
                <p className="mt-2 text-xs text-white/35">{money(item.quoted)} SAR {isArabic ? "عروض" : "quoted"}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
