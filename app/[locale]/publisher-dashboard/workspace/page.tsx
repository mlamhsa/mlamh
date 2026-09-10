import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Plus, UsersRound } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ locale: string }> };

export default async function PublisherWorkspacePage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_type, approval_status, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.account_type !== "publisher") redirect(`/${locale}/login`);

  const { data: publisher } = await admin
    .from("publishers")
    .select("id, publisher_type, company_name, contact_name, status")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!publisher) redirect(`/${locale}/join/publisher`);

  const blocked = profile.approval_status !== "approved" || ["suspended", "blocked", "banned", "disabled"].includes(String(profile.status)) || ["suspended", "blocked", "banned", "disabled"].includes(String(publisher.status));
  if (blocked) redirect(`/${locale}/publisher-dashboard`);

  const { data: projects, error } = await admin
    .from("casting_projects")
    .select("id, project_title, talent_type, city, required_count, status, service_mode, created_at")
    .eq("publisher_id", publisher.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`[PublisherWorkspacePage] ${error.message}`);

  const projectIds = (projects ?? []).map((project) => project.id);
  const [{ data: roles }, { data: shortlist }] = await Promise.all([
    projectIds.length
      ? admin.from("casting_roles").select("id, casting_project_id, status").in("casting_project_id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? admin.from("casting_shortlist").select("id, casting_project_id, status").in("casting_project_id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const countByProject = (rows: Array<{ casting_project_id: number }> | null) => {
    const map = new Map<number, number>();
    for (const row of rows ?? []) map.set(row.casting_project_id, (map.get(row.casting_project_id) ?? 0) + 1);
    return map;
  };
  const roleCounts = countByProject(roles as Array<{ casting_project_id: number }> | null);
  const shortlistCounts = countByProject(shortlist as Array<{ casting_project_id: number }> | null);

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-6 pb-24 lg:pb-10">
      <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
        <Link href={`/${locale}/publisher-dashboard`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
          <ArrowLeft size={16} className={isArabic ? "rotate-180" : ""} />
          {isArabic ? "العودة إلى لوحة التحكم" : "Back to dashboard"}
        </Link>
        <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-gold">MLAMH CASTING WORKSPACE</p>
            <h1 className="mt-3 text-4xl font-light sm:text-5xl">{isArabic ? "مساحة العمل" : "Workspace"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              {isArabic
                ? "أدر مشاريع الكاستينغ والأدوار والقوائم المختصرة من مكان واحد. الفرص السريعة تبقى مستقلة للمهمات اليومية."
                : "Manage casting projects, roles, and shortlists in one place. Quick opportunities remain separate for day-to-day hiring."}
            </p>
          </div>
          <Link href={`/${locale}/publisher-dashboard/workspace/new`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft">
            <Plus size={17} />
            {isArabic ? "مشروع كاستينغ جديد" : "New casting project"}
          </Link>
        </div>
      </header>

      {(projects ?? []).length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center sm:py-20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.06] text-gold"><BriefcaseBusiness size={25} /></div>
          <h2 className="mt-5 text-2xl font-light">{isArabic ? "ابدأ أول مشروع كاستينغ" : "Start your first casting project"}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/45">{isArabic ? "أنشئ البريف، قسّمه إلى أدوار، ثم راقب توفر المواهب وابنِ القائمة المختصرة." : "Create the brief, split it into roles, check talent supply, and build a shortlist."}</p>
          <Link href={`/${locale}/publisher-dashboard/workspace/new`} className="mt-6 inline-flex min-h-11 items-center rounded-full border border-gold/35 bg-gold/[0.07] px-6 text-sm text-gold">{isArabic ? "إنشاء المشروع" : "Create project"}</Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {(projects ?? []).map((project) => (
            <Link key={project.id} href={`/${locale}/publisher-dashboard/workspace/${project.id}`} className="group rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-gold/30 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">{project.service_mode === "self_service" ? (isArabic ? "إدارة ذاتية" : "Self-service") : (isArabic ? "كاستينغ مُدار" : "Managed casting")}</p>
                  <h2 className="mt-2 truncate text-xl font-medium sm:text-2xl">{project.project_title}</h2>
                  <p className="mt-2 text-xs text-white/40">{project.city || (isArabic ? "كل المدن" : "All cities")} · {project.talent_type === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model")}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] text-white/50">{project.status}</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <Metric label={isArabic ? "الأدوار" : "Roles"} value={roleCounts.get(project.id) ?? 0} />
                <Metric label={isArabic ? "المطلوب" : "Needed"} value={project.required_count ?? 0} />
                <Metric label={isArabic ? "المختصر" : "Shortlist"} value={shortlistCounts.get(project.id) ?? 0} icon />
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value, icon = false }: { label: string; value: number; icon?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="flex items-center gap-1 text-[10px] text-white/35">{icon ? <UsersRound size={12} /> : null}{label}</p><p className="mt-1 text-xl font-light">{value}</p></div>;
}
