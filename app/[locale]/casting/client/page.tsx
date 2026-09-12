import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const statusLabels: Record<string, { ar: string; en: string }> = {
  new: { ar: "جديد", en: "New" },
  qualified: { ar: "مؤهل", en: "Qualified" },
  proposal: { ar: "عرض", en: "Proposal" },
  awaiting_client: { ar: "بانتظارك", en: "Awaiting you" },
  active: { ar: "نشط", en: "Active" },
  screening: { ar: "فرز", en: "Screening" },
  shortlist_ready: { ar: "القائمة جاهزة", en: "Shortlist ready" },
  client_review: { ar: "مراجعة الاختيارات", en: "Selection review" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export default async function CastingClientProjectsPage({ params, searchParams }: { params: Promise<{ locale?: string }>; searchParams: Promise<{ claimed?: string }> }) {
  const [{ locale: rawLocale = "ar" }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale === "en" ? "en" : "ar";
  const ar = locale === "ar";

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/casting/client/login`);

  const admin = createAdminClient();
  const { data: projects, error } = await admin
    .from("casting_projects")
    .select("id,project_title,company_name,status,city,work_date,package_code,client_access_token,updated_at,currency")
    .eq("service_mode", "managed")
    .eq("client_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) console.error("[CastingClientProjectsPage]", error);

  const projectRows = projects ?? [];
  const projectIds = projectRows.map((project) => Number(project.id));
  const [{ data: bookings }, { data: payments }, { data: files }] = projectIds.length
    ? await Promise.all([
        admin.from("talent_bookings").select("id,managed_casting_project_id,status").in("managed_casting_project_id", projectIds),
        admin.from("casting_payments").select("id,casting_project_id,status,amount,currency").in("casting_project_id", projectIds),
        admin.from("casting_project_files").select("id,casting_project_id").in("casting_project_id", projectIds).eq("visible_to_client", true),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const bookingRows = bookings ?? [];
  const paymentRows = payments ?? [];
  const fileRows = files ?? [];
  const confirmedBookings = bookingRows.filter((booking) => ["confirmed", "completed"].includes(String(booking.status))).length;
  const pendingPayments = paymentRows.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingCurrency = paymentRows.find((payment) => payment.status === "pending")?.currency || "SAR";

  return <main dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 pb-24 pt-24 text-white sm:px-6 lg:pt-32">
    <div className="mx-auto max-w-6xl">
      <header className="rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CLIENT</p><h1 className="mt-4 text-3xl font-light sm:text-5xl">{ar ? "مشاريع الكاستينغ الخاصة بك" : "Your casting projects"}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">{ar ? "كل مشروع Managed Casting محفوظ على بريدك يظهر هنا، مع الحجوزات والمدفوعات والملفات المشتركة في مكان واحد." : "Every Managed Casting project saved to your email appears here with bookings, payments, and shared files in one place."}</p></div><Link href={`/${locale}/casting`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 px-5 text-sm text-gold">{ar ? "مشروع جديد" : "New project"}</Link></div>
      </header>

      {query.claimed === "1" ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5 text-sm text-emerald-100">{ar ? "تم حفظ المشروع وربط سجل مشاريع Managed Casting السابقة على البريد نفسه بحسابك." : "Project saved. Older Managed Casting projects using the same verified email were linked to your account as well."}</div> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [ar ? "المشاريع" : "Projects", projectRows.length],
          [ar ? "الحجوزات المؤكدة" : "Confirmed bookings", confirmedBookings],
          [ar ? "الملفات المشتركة" : "Shared files", fileRows.length],
          [ar ? "دفعات مستحقة" : "Payments due", pendingPayments > 0 ? `${money(pendingPayments)} ${pendingCurrency}` : "—"],
        ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs text-white/35">{label}</p><p className="mt-3 text-2xl font-light text-white">{value}</p></div>)}
      </section>

      <section className="mt-6">
        {projectRows.length === 0 ? <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8"><p className="text-lg font-light text-white/70">{ar ? "لا توجد مشاريع محفوظة بعد" : "No saved projects yet"}</p><p className="mt-3 text-sm leading-7 text-white/35">{ar ? "يمكنك حفظ أي مشروع Managed Casting من داخل رابط مساحة العميل الخاصة به." : "You can claim a Managed Casting project from its private client workspace."}</p><Link href={`/${locale}/casting`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/25 px-5 text-sm text-gold">{ar ? "ابدأ مشروع كاستينغ" : "Start a casting project"}</Link></div> : <div className="grid gap-4 md:grid-cols-2">{projectRows.map((project) => {
          const status = statusLabels[project.status] ?? { ar: project.status, en: project.status };
          const projectBookings = bookingRows.filter((booking) => Number(booking.managed_casting_project_id) === Number(project.id));
          const projectFiles = fileRows.filter((file) => Number(file.casting_project_id) === Number(project.id)).length;
          const projectDue = paymentRows.filter((payment) => Number(payment.casting_project_id) === Number(project.id) && payment.status === "pending").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
          return <article key={project.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.2em] text-gold">PROJECT #{project.id}</p><h2 className="mt-3 truncate text-xl font-light text-white">{project.project_title}</h2><p className="mt-2 text-xs text-white/35">{project.company_name || "Managed Casting by MLAMH"}</p></div><span className="shrink-0 rounded-full border border-gold/20 bg-gold/[0.05] px-3 py-1.5 text-[11px] text-gold">{ar ? status.ar : status.en}</span></div>
            <div className="mt-5 grid gap-2 text-xs text-white/40 sm:grid-cols-2"><p>{ar ? "المدينة" : "City"}: <span className="text-white/65">{project.city || "—"}</span></p><p>{ar ? "تاريخ العمل" : "Work date"}: <span className="text-white/65">{project.work_date || "—"}</span></p><p>{ar ? "الباقة" : "Package"}: <span className="text-white/65">{project.package_code || "—"}</span></p><p>{ar ? "آخر تحديث" : "Updated"}: <span className="text-white/65">{project.updated_at ? new Date(project.updated_at).toLocaleDateString(ar ? "ar-SA" : "en-US") : "—"}</span></p></div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4 text-[11px]"><span className="rounded-full border border-white/10 px-3 py-1.5 text-white/45">{projectBookings.length} {ar ? "حجوزات" : "bookings"}</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-white/45">{projectFiles} {ar ? "ملفات" : "files"}</span>{projectDue > 0 ? <span className="rounded-full border border-amber-300/20 px-3 py-1.5 text-amber-200">{money(projectDue)} {project.currency || "SAR"} {ar ? "مستحق" : "due"}</span> : null}</div>
            {project.client_access_token ? <Link href={`/${locale}/casting/status/${project.client_access_token}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gold px-5 text-sm font-medium text-black">{ar ? "فتح مساحة المشروع" : "Open project workspace"}</Link> : null}
          </article>;
        })}</div>}
      </section>
    </div>
  </main>;
}
