import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

const statusLabels: Record<string, { ar: string; en: string }> = {
  new: { ar: "جديد", en: "New" },
  qualified: { ar: "مؤهل", en: "Qualified" },
  proposal: { ar: "عرض", en: "Proposal" },
  awaiting_client: { ar: "بانتظار العميل", en: "Awaiting Client" },
  active: { ar: "نشط", en: "Active" },
  screening: { ar: "فرز", en: "Screening" },
  shortlist_ready: { ar: "Shortlist جاهزة", en: "Shortlist Ready" },
  client_review: { ar: "مراجعة العميل", en: "Client Review" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

export default async function AdminCastingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  const adminClient = createAdminClient();
  const { data: projects, error } = await adminClient
    .from("casting_projects")
    .select("id, status, client_name, company_name, project_title, talent_type, city, required_count, package_code, quoted_amount, currency, contact_email, contact_phone, created_at, opportunity_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[AdminCastingPage]", error);
  }

  const rows = projects ?? [];
  const activeCount = rows.filter((item) => ["active", "screening", "shortlist_ready", "client_review"].includes(item.status)).length;
  const newCount = rows.filter((item) => item.status === "new").length;
  const completedCount = rows.filter((item) => item.status === "completed").length;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CASTING</p>
            <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
              {isArabic ? "إدارة مشاريع الكاستينغ" : "Managed Casting Pipeline"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
              {isArabic
                ? "مسار تشغيلي لطلبات Managed Casting من استلام الـ Brief حتى الفرز والـ Shortlist ومراجعة العميل."
                : "Operational pipeline for managed casting requests, from brief intake through screening, shortlist, and client review."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/casting/analytics?lang=${language}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:border-gold/25 hover:text-gold"
            >
              {isArabic ? "تحليلات Casting" : "Casting analytics"}
            </Link>
            <Link
              href={`/${language}/casting`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/25 px-4 py-2 text-sm text-gold transition hover:bg-gold/10"
            >
              {isArabic ? "عرض صفحة الخدمة" : "View service page"}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [isArabic ? "طلبات جديدة" : "New requests", newCount],
            [isArabic ? "مشاريع نشطة" : "Active projects", activeCount],
            [isArabic ? "مكتملة" : "Completed", completedCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs text-white/40">{label}</p>
              <p className="mt-3 text-3xl font-light text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          {rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/40">
              {isArabic ? "لا توجد طلبات Casting حتى الآن." : "No casting requests yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="border-b border-white/10 bg-white/[0.025] text-xs text-white/35">
                  <tr>
                    <th className="px-4 py-4 text-start">#</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "المشروع" : "Project"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "العميل" : "Client"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "المواهب" : "Talent"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "الحالة" : "Status"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "الباقة" : "Package"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "التواصل" : "Contact"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "الفرصة" : "Opportunity"}</th>
                    <th className="px-4 py-4 text-start">{isArabic ? "إدارة" : "Manage"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {rows.map((project) => {
                    const status = statusLabels[project.status] ?? { ar: project.status, en: project.status };
                    return (
                      <tr key={project.id} className="text-white/65 hover:bg-white/[0.02]">
                        <td className="px-4 py-4 text-white/35">{project.id}</td>
                        <td className="px-4 py-4">
                          <Link href={`/admin/casting/${project.id}?lang=${language}`} className="font-medium text-white/85 hover:text-gold">
                            {project.project_title}
                          </Link>
                          <p className="mt-1 text-xs text-white/35">{project.city || "—"}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p>{project.company_name || project.client_name}</p>
                          {project.company_name ? <p className="mt-1 text-xs text-white/35">{project.client_name}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <span className="capitalize">{project.talent_type}</span>
                          <span className="ms-2 text-white/35">× {project.required_count}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-gold/20 bg-gold/[0.07] px-3 py-1 text-xs text-gold">
                            {isArabic ? status.ar : status.en}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="capitalize">{project.package_code || "—"}</p>
                          {project.quoted_amount != null ? (
                            <p className="mt-1 text-xs text-white/35">{project.quoted_amount} {project.currency}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-xs leading-6">
                          <p>{project.contact_phone || "—"}</p>
                          <p className="text-white/35">{project.contact_email || ""}</p>
                        </td>
                        <td className="px-4 py-4">
                          {project.opportunity_id ? (
                            <Link href={`/admin/opportunities/${project.opportunity_id}?lang=${language}`} className="text-gold hover:underline">
                              #{project.opportunity_id}
                            </Link>
                          ) : (
                            <span className="text-white/25">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/admin/casting/${project.id}?lang=${language}`} className="rounded-lg border border-gold/25 px-3 py-2 text-xs text-gold hover:bg-gold/10">
                            {isArabic ? "فتح المشروع" : "Open"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
