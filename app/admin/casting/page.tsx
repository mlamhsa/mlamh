import Link from "next/link";

import { AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";

import { requireAdminAccess } from "@/lib/auth/require-admin";
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

const packageLabels: Record<string, string> = {
  starter: "Managed Basic",
  pro: "Managed Pro",
  custom: "Managed Enterprise",
};

export default async function AdminCastingPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = lang === "en" ? "en" : "ar";
  const ar = language === "ar";
  const admin = createAdminClient();

  const { data: projects, error } = await admin
    .from("casting_projects")
    .select("id,status,client_name,company_name,project_title,talent_type,city,required_count,package_code,quoted_amount,currency,contact_email,contact_phone,created_at,opportunity_id,commercial_status")
    .eq("service_mode", "managed")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) console.error("[AdminCastingPage]", error);
  const rows = projects ?? [];
  const activeCount = rows.filter((item) => ["active", "screening", "shortlist_ready", "client_review"].includes(item.status)).length;
  const newCount = rows.filter((item) => item.status === "new").length;
  const completedCount = rows.filter((item) => item.status === "completed").length;

  return (
    <div dir={ar ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow="MLAMH MANAGED CASTING"
          title={ar ? "إدارة مشاريع الكاستينغ" : "Managed Casting Pipeline"}
          description={
            ar
              ? "مسار الكاستينغ المُدار من استلام الـBrief حتى المطابقة والفرز واختيار العميل والتأكيد والحجز والتسليم."
              : "Managed casting from brief intake through matching, screening, client selection, confirmation, booking, and delivery."
          }
          actions={
            <>
              <Link href={`/admin/casting/commercial?lang=${language}`} className="inline-flex h-10 items-center justify-center rounded-lg border border-gold/25 px-4 text-xs font-medium text-gold transition hover:bg-gold/[0.06]">
                {ar ? "المبيعات والتحصيل" : "Commercial pipeline"}
              </Link>
              <Link href={`/admin/casting/analytics?lang=${language}`} className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] px-4 text-xs font-medium text-white/55 transition hover:border-gold/20 hover:text-gold">
                {ar ? "التحليلات" : "Analytics"}
              </Link>
              <Link href={`/${language}/casting`} className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] px-4 text-xs font-medium text-white/55 transition hover:border-gold/20 hover:text-gold">
                {ar ? "صفحة الخدمة" : "Service page"}
              </Link>
            </>
          }
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminStatCard label={ar ? "طلبات جديدة" : "New requests"} value={newCount} active={newCount > 0} />
          <AdminStatCard label={ar ? "مشاريع نشطة" : "Active projects"} value={activeCount} active={activeCount > 0} />
          <AdminStatCard label={ar ? "مكتملة" : "Completed"} value={completedCount} />
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {rows.length === 0 ? <div className="p-10 text-center"><p className="text-sm text-white/40">{ar ? "لا توجد طلبات Managed Casting حاليًا." : "No Managed Casting requests yet."}</p><Link href={`/${language}/casting`} className="mt-4 inline-flex rounded-xl border border-gold/25 px-4 py-2.5 text-xs text-gold">{ar ? "عرض نموذج الخدمة" : "View service intake"}</Link></div> : <div className="divide-y divide-white/[0.07]">{rows.map((project)=>{ const status = statusLabels[project.status] ?? { ar: project.status, en: project.status }; const packageLabel = project.package_code ? packageLabels[project.package_code] || project.package_code : "—"; return <article key={project.id} className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/35">#{project.id}</span><span className="rounded-full border border-gold/20 bg-gold/[0.06] px-2.5 py-1 text-[10px] text-gold">{ar ? status.ar : status.en}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/35">{project.commercial_status || "lead"}</span></div><Link href={`/admin/casting/${project.id}?lang=${language}`} className="mt-3 block truncate text-xl font-light text-white hover:text-gold">{project.project_title}</Link><p className="mt-2 text-xs text-white/35">{project.company_name || project.client_name || "—"} · {project.city || "—"} · {project.talent_type} × {project.required_count}</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[430px]"><div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] text-white/30">{ar ? "الباقة" : "Package"}</p><p className="mt-1 text-xs text-white/70">{packageLabel}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] text-white/30">{ar ? "العرض" : "Quote"}</p><p className="mt-1 text-xs text-white/70">{project.quoted_amount == null ? "—" : `${Number(project.quoted_amount).toLocaleString()} ${project.currency || "SAR"}`}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-[10px] text-white/30">{ar ? "الفرصة" : "Opportunity"}</p><p className="mt-1 text-xs text-white/70">{project.opportunity_id ? `#${project.opportunity_id}` : "—"}</p></div></div></div><div className="mt-4 flex flex-wrap gap-2"><Link href={`/admin/casting/${project.id}?lang=${language}`} className="rounded-xl border border-gold/25 bg-gold/[0.05] px-4 py-2.5 text-xs text-gold">{ar ? "فتح المشروع" : "Open project"}</Link><Link href={`/admin/casting/${project.id}/applications?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/55">{ar ? "الفرز" : "Screening"}</Link><Link href={`/admin/casting/${project.id}/supply?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/55">{ar ? "المطابقة" : "Matching"}</Link><Link href={`/admin/casting/${project.id}/sales?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/55">{ar ? "المبيعات" : "Sales"}</Link></div></article>;})}</div>}
        </section>
      </AdminPageContainer>
    </div>
  );
}
