import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function CastingAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const adminClient = createAdminClient();

  const { data: projects, error: projectsError } = await adminClient
    .from("casting_projects")
    .select("id,status,package_code,quoted_amount,currency,opportunity_id,created_at");

  if (projectsError) {
    console.error("[CastingAnalyticsPage projects]", projectsError);
  }

  const rows = projects ?? [];
  const opportunityIds = rows
    .map((item) => Number(item.opportunity_id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const [{ data: applications }, { data: shortlist }] = await Promise.all([
    opportunityIds.length
      ? adminClient
          .from("opportunity_applications")
          .select("id,opportunity_id,status")
          .in("opportunity_id", opportunityIds)
      : Promise.resolve({ data: [] }),
    rows.length
      ? adminClient
          .from("casting_shortlist")
          .select("id,casting_project_id,status")
          .in("casting_project_id", rows.map((item) => item.id))
      : Promise.resolve({ data: [] }),
  ]);

  const appRows = applications ?? [];
  const shortlistRows = shortlist ?? [];
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
  const linkedProjects = rows.filter((item) => item.opportunity_id).length;
  const activeProjects = rows.filter((item) => activeStatuses.has(item.status)).length;
  const completedProjects = rows.filter((item) => item.status === "completed").length;
  const shortlisted = shortlistRows.filter((item) => ["shortlisted", "presented", "selected"].includes(item.status)).length;
  const selected = shortlistRows.filter((item) => item.status === "selected").length;
  const quotedPipeline = rows.reduce((sum, item) => sum + number(item.quoted_amount), 0);

  const conversion = totalBriefs > 0 ? Math.round((linkedProjects / totalBriefs) * 100) : 0;
  const selectionRate = appRows.length > 0 ? Math.round((selected / appRows.length) * 100) : 0;

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
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href={`/admin/casting?lang=${language}`} className="text-xs text-gold hover:underline">
              {isArabic ? "← العودة إلى MLAMH Casting" : "← Back to MLAMH Casting"}
            </Link>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">CASTING ANALYTICS</p>
            <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
              {isArabic ? "أداء Managed Casting" : "Managed Casting Performance"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
              {isArabic
                ? "مؤشرات تشغيلية من الـ Brief حتى الفرصة والطلبات والقائمة المختصرة والاختيار. قيمة العروض أدناه ليست إيرادًا محصلًا."
                : "Operational metrics from brief intake through opportunity, applications, shortlist, and selection. Quoted value below is not collected revenue."}
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [isArabic ? "إجمالي الـ Briefs" : "Total briefs", totalBriefs],
            [isArabic ? "Briefs مؤهلة" : "Qualified briefs", qualifiedBriefs],
            [isArabic ? "مشاريع مرتبطة بفرص" : "Linked opportunities", linkedProjects],
            [isArabic ? "مشاريع نشطة" : "Active projects", activeProjects],
            [isArabic ? "إجمالي الطلبات" : "Applications", appRows.length],
            [isArabic ? "القائمة المختصرة" : "Shortlisted", shortlisted],
            [isArabic ? "تم اختيارهم" : "Selected", selected],
            [isArabic ? "مشاريع مكتملة" : "Completed", completedProjects],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs text-white/40">{label}</p>
              <p className="mt-3 text-3xl font-light text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-6">
            <p className="text-xs text-gold">{isArabic ? "Brief → Opportunity" : "Brief → Opportunity"}</p>
            <p className="mt-3 text-4xl font-light text-white">{conversion}%</p>
            <p className="mt-2 text-xs leading-6 text-white/35">
              {isArabic ? "نسبة المشاريع التي تم تحويلها إلى فرصة مرتبطة." : "Share of briefs converted into a linked opportunity."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs text-white/40">{isArabic ? "Application → Selected" : "Application → Selected"}</p>
            <p className="mt-3 text-4xl font-light text-white">{selectionRate}%</p>
            <p className="mt-2 text-xs leading-6 text-white/35">
              {isArabic ? "مؤشر مبكر لجودة الفرز، وليس معدل توظيف نهائي." : "An early screening-quality signal, not a final hiring rate."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <p className="text-xs text-white/40">{isArabic ? "قيمة العروض" : "Quoted pipeline"}</p>
            <p className="mt-3 text-4xl font-light text-white">
              {new Intl.NumberFormat("en-US").format(quotedPipeline)} <span className="text-base text-white/35">SAR</span>
            </p>
            <p className="mt-2 text-xs leading-6 text-white/35">
              {isArabic ? "إجمالي الأسعار المعروضة داخل المشاريع. لا يُحسب كإيراد حتى يتم تسجيل التحصيل لاحقًا." : "Total quoted value across projects. It is not revenue until payment collection is tracked."}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <h2 className="text-xl font-light text-white">{isArabic ? "توزيع الباقات" : "Package mix"}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {packageCounts.map((item) => (
              <div key={item.packageCode} className="rounded-xl border border-white/[0.08] bg-black/20 p-5">
                <p className="capitalize text-sm text-gold">{item.packageCode}</p>
                <p className="mt-3 text-3xl font-light text-white">{item.count}</p>
                <p className="mt-2 text-xs text-white/35">
                  {new Intl.NumberFormat("en-US").format(item.quoted)} SAR {isArabic ? "عروض" : "quoted"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
