import Link from "next/link";
import { notFound } from "next/navigation";

import { addCastingShortlistAction, updateCastingShortlistStatusAction } from "@/lib/actions/admin-casting";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function CastingApplicationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string; role?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  const language = query.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const selectedRoleId = Number(query.role || 0) || null;
  const admin = createAdminClient();

  const [{ data: project }, { data: roles }, { data: shortlist }] = await Promise.all([
    admin.from("casting_projects").select("id,project_title,opportunity_id,status").eq("id", projectId).maybeSingle(),
    admin.from("casting_roles").select("id,title,title_en,opportunity_id,status,sort_order").eq("casting_project_id", projectId).order("sort_order", { ascending: true }),
    admin.from("casting_shortlist").select("id,application_id,casting_role_id,status").eq("casting_project_id", projectId),
  ]);
  if (!project) notFound();

  const roleRows = roles ?? [];
  const opportunityToRole = new Map<number, any>();
  for (const role of roleRows) if (role.opportunity_id) opportunityToRole.set(Number(role.opportunity_id), role);
  const opportunityIds = Array.from(new Set([
    ...(project.opportunity_id ? [Number(project.opportunity_id)] : []),
    ...roleRows.map((role) => Number(role.opportunity_id)).filter((value) => Number.isInteger(value) && value > 0),
  ]));

  const { data: applications } = opportunityIds.length
    ? await admin.from("opportunity_applications").select("id,opportunity_id,talent_id,status,created_at").in("opportunity_id", opportunityIds).order("created_at", { ascending: false })
    : { data: [] as any[] };
  const allApplications = applications ?? [];
  const appRows = selectedRoleId
    ? allApplications.filter((app) => Number(opportunityToRole.get(Number(app.opportunity_id))?.id) === selectedRoleId)
    : allApplications;
  const talentIds = Array.from(new Set(appRows.map((item) => Number(item.talent_id)).filter(Boolean)));
  const { data: talents } = talentIds.length
    ? await admin.from("talents").select("id,name_ar,name_en,display_name_ar,display_name_en,slug,image_url,city_ar,city_en,category_ar,category_en").in("id", talentIds)
    : { data: [] as any[] };
  const talentMap = new Map((talents ?? []).map((talent) => [Number(talent.id), talent]));
  const shortlistMap = new Map((shortlist ?? []).map((item) => [Number(item.application_id), item]));
  const roleCounts = roleRows.map((role) => ({ ...role, count: allApplications.filter((app) => Number(app.opportunity_id) === Number(role.opportunity_id)).length }));

  return <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <div className="border-b border-white/10 pb-6"><Link href={`/admin/casting/${projectId}?lang=${language}`} className="text-xs text-gold hover:underline">{isArabic ? "← العودة للمشروع" : "← Back to project"}</Link><p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">MULTI-ROLE APPLICATIONS</p><h1 className="mt-2 text-3xl font-light text-white">{project.project_title}</h1><p className="mt-3 text-sm text-white/40">{isArabic ? "جميع طلبات فرص الأدوار في شاشة فرز واحدة." : "All role-opportunity applications in one screening workspace."}</p></div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className={`rounded-2xl border p-4 ${!selectedRoleId ? "border-gold/30 bg-gold/[0.06]" : "border-white/10 bg-white/[0.02]"}`}><p className="text-xs text-white/40">{isArabic ? "كل الأدوار" : "All roles"}</p><p className="mt-2 text-2xl text-white">{allApplications.length}</p></Link>{roleCounts.map((role) => <Link key={role.id} href={`/admin/casting/${projectId}/applications?lang=${language}&role=${role.id}`} className={`rounded-2xl border p-4 ${selectedRoleId === Number(role.id) ? "border-gold/30 bg-gold/[0.06]" : "border-white/10 bg-white/[0.02]"}`}><p className="truncate text-xs text-white/55">{isArabic ? role.title : role.title_en || role.title}</p><p className="mt-2 text-2xl text-white">{role.count}</p><p className="mt-1 text-[11px] text-white/30">{role.opportunity_id ? `Opportunity #${role.opportunity_id}` : isArabic ? "لا توجد فرصة" : "No opportunity"}</p></Link>)}</div>

    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-light text-white">{isArabic ? "طلبات المواهب" : "Talent applications"}</h2><span className="text-sm text-white/35">{appRows.length}</span></div>{appRows.length === 0 ? <p className="mt-6 text-sm text-white/35">{isArabic ? "لا توجد طلبات ضمن هذا الفلتر حتى الآن." : "No applications in this filter yet."}</p> : <div className="mt-5 space-y-3">{appRows.map((application) => { const talent:any = talentMap.get(Number(application.talent_id)); const role:any = opportunityToRole.get(Number(application.opportunity_id)); const short:any = shortlistMap.get(Number(application.id)); const name = isArabic ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar; return <div key={application.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4">{talent?.image_url ? <img src={talent.image_url} alt="" className="h-14 w-14 rounded-xl object-cover"/> : <div className="h-14 w-14 rounded-xl border border-white/10"/>}<div><p className="text-sm font-medium text-white/85">{name || `Talent #${application.talent_id}`}</p><p className="mt-1 text-xs text-white/35">{isArabic ? talent?.city_ar : talent?.city_en || talent?.city_ar} · {application.status || "pending"}</p><p className="mt-1 text-[11px] text-gold/70">{role ? `${isArabic ? role.title : role.title_en || role.title} · Opportunity #${application.opportunity_id}` : `Opportunity #${application.opportunity_id}`}</p></div></div><div className="flex flex-wrap gap-2">{talent?.slug ? <Link href={`/${language}/talent/${talent.slug}`} target="_blank" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-gold">{isArabic ? "الملف" : "Profile"}</Link> : null}{!short ? <form action={addCastingShortlistAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="application_id" value={application.id}/>{role ? <input type="hidden" name="casting_role_id" value={role.id}/> : null}<button className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold">{isArabic ? "إضافة للقائمة" : "Shortlist"}</button></form> : <form action={updateCastingShortlistStatusAction} className="flex gap-2"><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="shortlist_id" value={short.id}/><select name="status" defaultValue={short.status} className="rounded-lg border border-gold/20 bg-black px-3 py-2 text-xs text-gold"><option value="shortlisted">Shortlisted</option><option value="presented">Presented</option><option value="selected">Selected</option><option value="declined">Declined</option><option value="withdrawn">Withdrawn</option></select><button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">{isArabic ? "حفظ" : "Save"}</button></form>}</div></div></div>; })}</div>}</section>
  </div></div>;
}
