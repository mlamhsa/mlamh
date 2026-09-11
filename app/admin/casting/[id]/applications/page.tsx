/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { addCastingShortlistAction, updateCastingShortlistStatusAction } from "@/lib/actions/admin-casting";
import { markManagedBookingCompletedAction, startManagedTalentConfirmationAction } from "@/lib/actions/admin-managed-booking";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CastingRoleRow = { id: number; title: string; title_en: string | null; opportunity_id: number | null; status: string; sort_order: number | null };
type ApplicationRow = { id: number; opportunity_id: number; talent_id: number; status: string | null; created_at: string };
type TalentRow = { id: number; name_ar: string | null; name_en: string | null; display_name_ar: string | null; display_name_en: string | null; slug: string | null; image_url: string | null; city_ar: string | null; city_en: string | null; category_ar: string | null; category_en: string | null };
type ShortlistRow = { id: number; application_id: number; casting_role_id: number | null; status: string };
type BookingRow = { id: number; application_id: number; conversation_id: number; status: string; publisher_completed_at: string | null; talent_completed_at: string | null };

export default async function CastingApplicationsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string; role?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  const language = query.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const selectedRoleId = Number(query.role || 0) || null;
  const admin = createAdminClient();

  const [{ data: project }, { data: roles }, { data: shortlist }] = await Promise.all([
    admin.from("casting_projects").select("id,project_title,opportunity_id,status,service_mode,client_selection_confirmed_at").eq("id", projectId).maybeSingle(),
    admin.from("casting_roles").select("id,title,title_en,opportunity_id,status,sort_order").eq("casting_project_id", projectId).order("sort_order", { ascending: true }),
    admin.from("casting_shortlist").select("id,application_id,casting_role_id,status").eq("casting_project_id", projectId),
  ]);
  if (!project) notFound();

  const roleRows = (roles ?? []) as CastingRoleRow[];
  const opportunityToRole = new Map<number, CastingRoleRow>();
  for (const role of roleRows) if (role.opportunity_id) opportunityToRole.set(Number(role.opportunity_id), role);
  const opportunityIds = Array.from(new Set([...(project.opportunity_id ? [Number(project.opportunity_id)] : []), ...roleRows.map((role) => Number(role.opportunity_id)).filter((value) => Number.isInteger(value) && value > 0)]));
  const { data: applications } = opportunityIds.length
    ? await admin.from("opportunity_applications").select("id,opportunity_id,talent_id,status,created_at").in("opportunity_id", opportunityIds).order("created_at", { ascending: false })
    : { data: [] as ApplicationRow[] };
  const allApplications = (applications ?? []) as ApplicationRow[];
  const appRows = selectedRoleId ? allApplications.filter((app) => Number(opportunityToRole.get(Number(app.opportunity_id))?.id) === selectedRoleId) : allApplications;
  const talentIds = Array.from(new Set(appRows.map((item) => Number(item.talent_id)).filter(Boolean)));
  const applicationIds = allApplications.map((item) => Number(item.id)).filter((value) => Number.isInteger(value) && value > 0);
  const [{ data: talents }, { data: bookings }] = await Promise.all([
    talentIds.length ? admin.from("talents").select("id,name_ar,name_en,display_name_ar,display_name_en,slug,image_url,city_ar,city_en,category_ar,category_en").in("id", talentIds) : Promise.resolve({ data: [] as TalentRow[] }),
    applicationIds.length ? admin.from("talent_bookings").select("id,application_id,conversation_id,status,publisher_completed_at,talent_completed_at").in("application_id", applicationIds) : Promise.resolve({ data: [] as BookingRow[] }),
  ]);
  const talentMap = new Map<number, TalentRow>(((talents ?? []) as TalentRow[]).map((talent) => [Number(talent.id), talent]));
  const shortlistMap = new Map<number, ShortlistRow>(((shortlist ?? []) as ShortlistRow[]).map((item) => [Number(item.application_id), item]));
  const bookingMap = new Map<number, BookingRow>(((bookings ?? []) as BookingRow[]).map((item) => [Number(item.application_id), item]));
  const roleCounts = roleRows.map((role) => ({ ...role, count: allApplications.filter((app) => Number(app.opportunity_id) === Number(role.opportunity_id)).length }));
  const canStartManagedConfirmation = project.service_mode === "managed" && Boolean(project.client_selection_confirmed_at);

  return <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><Link href={`/admin/casting/${projectId}?lang=${language}`} className="text-xs text-gold hover:underline">{isArabic ? "← العودة للمشروع" : "← Back to project"}</Link><p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">MULTI-ROLE APPLICATIONS</p><h1 className="mt-2 text-3xl font-light text-white">{project.project_title}</h1><p className="mt-3 text-sm text-white/40">{isArabic ? "جميع طلبات فرص الأدوار في شاشة فرز واحدة." : "All role-opportunity applications in one screening workspace."}</p>{project.service_mode === "managed" ? <p className={`mt-3 text-xs ${canStartManagedConfirmation ? "text-emerald-300" : "text-amber-200"}`}>{canStartManagedConfirmation ? (isArabic ? "اعتمد العميل اختياراته — يمكنك بدء تأكيد المواهب المختارة." : "Client selections confirmed — talent confirmation can start.") : (isArabic ? "انتظار اعتماد العميل النهائي للاختيارات قبل بدء تأكيد المواهب." : "Waiting for the client's final selection approval before talent confirmation.")}</p> : null}</div>{project.service_mode === "managed" ? <Link href={`/admin/casting/${projectId}/supply?lang=${language}`} className="rounded-xl border border-gold/25 px-4 py-2.5 text-sm text-gold hover:bg-gold/10">{isArabic ? "المطابقة الداخلية" : "Internal supply"}</Link> : null}</div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className={`rounded-2xl border p-4 ${!selectedRoleId ? "border-gold/30 bg-gold/[0.06]" : "border-white/10 bg-white/[0.02]"}`}><p className="text-xs text-white/40">{isArabic ? "كل الأدوار" : "All roles"}</p><p className="mt-2 text-2xl text-white">{allApplications.length}</p></Link>{roleCounts.map((role) => <Link key={role.id} href={`/admin/casting/${projectId}/applications?lang=${language}&role=${role.id}`} className={`rounded-2xl border p-4 ${selectedRoleId === Number(role.id) ? "border-gold/30 bg-gold/[0.06]" : "border-white/10 bg-white/[0.02]"}`}><p className="truncate text-xs text-white/55">{isArabic ? role.title : role.title_en || role.title}</p><p className="mt-2 text-2xl text-white">{role.count}</p><p className="mt-1 text-[11px] text-white/30">{role.opportunity_id ? `Opportunity #${role.opportunity_id}` : isArabic ? "لا توجد فرصة" : "No opportunity"}</p></Link>)}</div>

    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-light text-white">{isArabic ? "طلبات المواهب" : "Talent applications"}</h2><span className="text-sm text-white/35">{appRows.length}</span></div>{appRows.length === 0 ? <p className="mt-6 text-sm text-white/35">{isArabic ? "لا توجد طلبات ضمن هذا الفلتر حتى الآن." : "No applications in this filter yet."}</p> : <div className="mt-5 space-y-3">{appRows.map((application) => {
      const talent = talentMap.get(Number(application.talent_id)); const role = opportunityToRole.get(Number(application.opportunity_id)); const short = shortlistMap.get(Number(application.id)); const booking = bookingMap.get(Number(application.id));
      const name = isArabic ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar;
      return <div key={application.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4">{talent?.image_url ? <img src={talent.image_url} alt="" className="h-14 w-14 rounded-xl object-cover"/> : <div className="h-14 w-14 rounded-xl border border-white/10"/>}<div><p className="text-sm font-medium text-white/85">{name || `Talent #${application.talent_id}`}</p><p className="mt-1 text-xs text-white/35">{(isArabic ? talent?.city_ar : talent?.city_en || talent?.city_ar) || "—"} · {application.status || "pending"}</p><p className="mt-1 text-[11px] text-gold/70">{role ? `${isArabic ? role.title : role.title_en || role.title} · Opportunity #${application.opportunity_id}` : `Opportunity #${application.opportunity_id}`}</p>{booking ? <p className="mt-1 text-[11px] text-emerald-300">Booking #{booking.id} · {booking.status}</p> : null}</div></div><div className="flex flex-wrap gap-2">{talent?.slug ? <Link href={`/${language}/talent/${talent.slug}`} target="_blank" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-gold">{isArabic ? "الملف" : "Profile"}</Link> : null}{booking ? <><Link href={`/admin/messages/${booking.conversation_id}`} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200">{isArabic ? "محادثة التأكيد" : "Confirmation chat"}</Link>{["proposed","changes_requested"].includes(booking.status) ? <Link href={`/admin/casting/${projectId}/booking/${booking.id}?lang=${language}`} className="rounded-lg border border-amber-300/20 px-3 py-2 text-xs text-amber-200">{isArabic ? "تعديل تفاصيل الحجز" : "Edit booking details"}</Link> : null}</> : null}{booking?.status === "confirmed" && !booking.publisher_completed_at ? <form action={markManagedBookingCompletedAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="booking_id" value={booking.id}/><button className="rounded-lg border border-emerald-300/25 px-3 py-2 text-xs text-emerald-200">{isArabic ? "تأكيد التنفيذ من ملامح" : "Confirm MLAMH completion"}</button></form> : null}{!booking && canStartManagedConfirmation && short?.status === "selected" ? <form action={startManagedTalentConfirmationAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="shortlist_id" value={short.id}/><button className="rounded-lg bg-gold px-3 py-2 text-xs font-medium text-black">{isArabic ? "بدء تأكيد الموهبة" : "Start talent confirmation"}</button></form> : null}{!short ? <form action={addCastingShortlistAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="application_id" value={application.id}/>{role ? <input type="hidden" name="casting_role_id" value={role.id}/> : null}<button className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold">{isArabic ? "إضافة للقائمة" : "Shortlist"}</button></form> : booking ? <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/35">{isArabic ? `القرار مقفل: ${short.status}` : `Locked: ${short.status}`}</span> : <form action={updateCastingShortlistStatusAction} className="flex gap-2"><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="shortlist_id" value={short.id}/><select name="status" defaultValue={short.status} className="rounded-lg border border-gold/20 bg-black px-3 py-2 text-xs text-gold"><option value="shortlisted">Shortlisted</option><option value="presented">Presented</option><option value="reserved">Reserve</option><option value="selected">Selected</option><option value="declined">Declined</option><option value="withdrawn">Withdrawn</option></select><button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">{isArabic ? "حفظ" : "Save"}</button></form>}</div></div></div>;
    })}</div>}</section>
  </div></div>;
}
