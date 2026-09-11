import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function CastingClientProjectsPage({ params, searchParams }: { params: Promise<{ locale?: string }>; searchParams: Promise<{ claimed?: string }> }) {
  const [{ locale: rawLocale = "ar" }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale === "en" ? "en" : "ar";
  const ar = locale === "ar";

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const admin = createAdminClient();
  const { data: projects, error } = await admin
    .from("casting_projects")
    .select("id,project_title,company_name,status,city,work_date,package_code,client_access_token,updated_at")
    .eq("service_mode", "managed")
    .eq("client_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) console.error("[CastingClientProjectsPage]", error);

  return <main dir={ar ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 pb-24 pt-24 text-white sm:px-6 lg:pt-32">
    <div className="mx-auto max-w-6xl">
      <header className="rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-9">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CLIENT</p>
        <h1 className="mt-4 text-3xl font-light sm:text-5xl">{ar ? "مشاريع الكاستينغ الخاصة بك" : "Your casting projects"}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">{ar ? "كل مشروع Managed Casting قمت بحفظه في حسابك يظهر هنا، مع إمكانية فتح مساحة المشروع الآمنة في أي وقت." : "Every Managed Casting project claimed to your account appears here, with secure access to each project workspace."}</p>
      </header>

      {query.claimed === "1" ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5 text-sm text-emerald-100">{ar ? "تم حفظ المشروع في حسابك بنجاح. لن تحتاج للاعتماد على رابط واحد فقط للوصول إلى مشاريعك القادمة." : "Project saved to your account successfully. You can now return to your managed projects from one place."}</div> : null}

      <section className="mt-6">
        {(projects ?? []).length === 0 ? <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8"><p className="text-lg font-light text-white/70">{ar ? "لا توجد مشاريع محفوظة بعد" : "No saved projects yet"}</p><p className="mt-3 text-sm leading-7 text-white/35">{ar ? "يمكنك حفظ أي مشروع Managed Casting من داخل رابط مساحة العميل الخاصة به." : "You can claim a Managed Casting project from its private client workspace."}</p><Link href={`/${locale}/casting`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/25 px-5 text-sm text-gold">{ar ? "ابدأ مشروع كاستينغ" : "Start a casting project"}</Link></div> : <div className="grid gap-4 md:grid-cols-2">{(projects ?? []).map((project) => {
          const status = statusLabels[project.status] ?? { ar: project.status, en: project.status };
          return <article key={project.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.2em] text-gold">PROJECT #{project.id}</p><h2 className="mt-3 truncate text-xl font-light text-white">{project.project_title}</h2><p className="mt-2 text-xs text-white/35">{project.company_name || (ar ? "Managed Casting by MLAMH" : "Managed Casting by MLAMH")}</p></div><span className="shrink-0 rounded-full border border-gold/20 bg-gold/[0.05] px-3 py-1.5 text-[11px] text-gold">{ar ? status.ar : status.en}</span></div>
            <div className="mt-5 grid gap-2 text-xs text-white/40 sm:grid-cols-2"><p>{ar ? "المدينة" : "City"}: <span className="text-white/65">{project.city || "—"}</span></p><p>{ar ? "تاريخ العمل" : "Work date"}: <span className="text-white/65">{project.work_date || "—"}</span></p><p>{ar ? "الباقة" : "Package"}: <span className="text-white/65">{project.package_code || "—"}</span></p><p>{ar ? "آخر تحديث" : "Updated"}: <span className="text-white/65">{project.updated_at ? new Date(project.updated_at).toLocaleDateString(ar ? "ar-SA" : "en-US") : "—"}</span></p></div>
            {project.client_access_token ? <Link href={`/${locale}/casting/status/${project.client_access_token}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gold px-5 text-sm font-medium text-black">{ar ? "فتح مساحة المشروع" : "Open project workspace"}</Link> : null}
          </article>;
        })}</div>}
      </section>
    </div>
  </main>;
}
