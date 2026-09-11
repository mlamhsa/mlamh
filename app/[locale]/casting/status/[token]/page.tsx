/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

type CastingApplication = { id: number; opportunity_id: number; talent_id: number; status: string };
type CastingRole = { id: number; title: string; title_en: string | null; opportunity_id: number | null; status: string; required_count: number; sort_order: number | null };
type ShortlistTalent = {
  id: number; slug: string | null; display_name_ar: string | null; display_name_en: string | null;
  name_ar: string | null; name_en: string | null; image_url: string | null; city_ar: string | null;
  city_en: string | null; category_ar: string | null; category_en: string | null;
};
type BookingRow = {
  id: number; application_id: number; talent_id: number; status: string; work_date: string | null; work_time: string | null;
  work_duration: string | null; location_text: string | null; compensation_type: string; compensation_amount: number | null; currency: string;
};
type ClientReviewRow = { booking_id: number; rating: number; comment: string | null };

const statusLabels: Record<string, { ar: string; en: string }> = {
  new: { ar: "تم استلام الطلب", en: "Brief received" }, qualified: { ar: "تمت مراجعة الاحتياج", en: "Brief qualified" },
  proposal: { ar: "إعداد العرض", en: "Proposal in progress" }, awaiting_client: { ar: "بانتظار موافقة العميل", en: "Awaiting client approval" },
  active: { ar: "المشروع نشط", en: "Casting active" }, screening: { ar: "جاري فرز المتقدمين", en: "Screening applications" },
  shortlist_ready: { ar: "القائمة المختصرة جاهزة", en: "Shortlist ready" }, client_review: { ar: "مراجعة واختيارات العميل", en: "Client review & selections" },
  completed: { ar: "اكتمل المشروع", en: "Casting completed" }, cancelled: { ar: "تم إغلاق المشروع", en: "Project closed" },
};
const stages = ["new", "qualified", "proposal", "awaiting_client", "active", "screening", "shortlist_ready", "client_review", "completed"];
const shortlistStatusLabels: Record<string, { ar: string; en: string }> = {
  shortlisted: { ar: "مرشح", en: "Shortlisted" }, presented: { ar: "معروض للمراجعة", en: "Presented" },
  reserved: { ar: "احتياط", en: "Reserve" }, selected: { ar: "تم الاختيار", en: "Selected" },
  declined: { ar: "غير مختار", en: "Not selected" }, withdrawn: { ar: "منسحب", en: "Withdrawn" },
};
function money(value: unknown) { const parsed = Number(value); return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number.isFinite(parsed) ? parsed : 0); }

export default async function CastingStatusPage({ params }: { params: Promise<{ locale?: string; token: string }> }) {
  const { locale = "ar", token } = await params;
  const language = locale === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const cleanToken = token.trim();
  if (!cleanToken || cleanToken.length > 100) notFound();

  const adminClient = createAdminClient();
  const { data: project, error } = await adminClient.from("casting_projects")
    .select("id,project_title,company_name,status,service_mode,package_code,quoted_amount,currency,work_date,city,required_count,talent_type,client_status_note,client_selection_confirmed_at,client_selection_note,opportunity_id,created_at,updated_at")
    .eq("client_access_token", cleanToken).maybeSingle();
  if (error) console.error("[CastingStatusPage project]", error);
  if (!project || project.service_mode !== "managed") notFound();
  const projectId = Number(project.id);

  const [{ data: roles }, { data: shortlist }, { data: payments }] = await Promise.all([
    adminClient.from("casting_roles").select("id,title,title_en,opportunity_id,status,required_count,sort_order").eq("casting_project_id", projectId).order("sort_order", { ascending: true }),
    adminClient.from("casting_shortlist").select("id,application_id,casting_role_id,status,rank,created_at").eq("casting_project_id", projectId).order("rank", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }),
    adminClient.from("casting_payments").select("id,status,amount,currency,paid_at,created_at").eq("casting_project_id", projectId).order("created_at", { ascending: false }),
  ]);
  const roleRows = (roles ?? []) as CastingRole[];
  const legacyOpportunityId = project.opportunity_id ? Number(project.opportunity_id) : null;
  const roleOpportunityIds = roleRows.map((role) => Number(role.opportunity_id)).filter((value) => Number.isInteger(value) && value > 0);
  const opportunityIds = Array.from(new Set([...(legacyOpportunityId ? [legacyOpportunityId] : []), ...roleOpportunityIds]));

  const [{ data: applications }, { data: opportunities }] = await Promise.all([
    opportunityIds.length ? adminClient.from("opportunity_applications").select("id,opportunity_id,talent_id,status").in("opportunity_id", opportunityIds) : Promise.resolve({ data: [] }),
    opportunityIds.length ? adminClient.from("opportunities").select("id,slug,published,status").in("id", opportunityIds) : Promise.resolve({ data: [] }),
  ]);
  const applicationRows = (applications ?? []) as CastingApplication[];
  const applicationMap = new Map<number, CastingApplication>(applicationRows.map((item) => [Number(item.id), item]));
  const roleMap = new Map<number, CastingRole>(roleRows.map((role) => [Number(role.id), role]));
  const opportunityRoleMap = new Map<number, CastingRole>(roleRows.filter((role) => role.opportunity_id).map((role) => [Number(role.opportunity_id), role]));
  const shortlistRows = shortlist ?? [];
  const talentIds = Array.from(new Set(shortlistRows.map((item) => applicationMap.get(Number(item.application_id))?.talent_id).map(Number).filter((id) => Number.isInteger(id) && id > 0)));
  const { data: shortlistTalents } = talentIds.length
    ? await adminClient.from("talents").select("id,slug,display_name_ar,display_name_en,name_ar,name_en,image_url,city_ar,city_en,category_ar,category_en").in("id", talentIds)
    : { data: [] as ShortlistTalent[] };
  const talentMap = new Map<number, ShortlistTalent>(((shortlistTalents ?? []) as ShortlistTalent[]).map((talent) => [Number(talent.id), talent]));

  const selectedApplicationIds = shortlistRows.filter((item) => item.status === "selected").map((item) => Number(item.application_id));
  const { data: bookingsData } = selectedApplicationIds.length
    ? await adminClient.from("talent_bookings").select("id,application_id,talent_id,status,work_date,work_time,work_duration,location_text,compensation_type,compensation_amount,currency").eq("managed_casting_project_id", projectId).in("application_id", selectedApplicationIds)
    : { data: [] as BookingRow[] };
  const bookingRows = (bookingsData ?? []) as BookingRow[];
  const bookingIds = bookingRows.map((booking) => Number(booking.id));
  const { data: reviewsData } = bookingIds.length
    ? await adminClient.from("managed_casting_client_reviews").select("booking_id,rating,comment").eq("casting_project_id", projectId).in("booking_id", bookingIds)
    : { data: [] as ClientReviewRow[] };
  const reviewMap = new Map<number, ClientReviewRow>(((reviewsData ?? []) as ClientReviewRow[]).map((review) => [Number(review.booking_id), review]));

  const activeShortlistStatuses = ["shortlisted", "presented", "reserved", "selected"];
  const shortlistCount = shortlistRows.filter((item) => activeShortlistStatuses.includes(item.status)).length;
  const selectedCount = shortlistRows.filter((item) => item.status === "selected").length;
  const reserveCount = shortlistRows.filter((item) => item.status === "reserved").length;
  const currentIndex = project.status === "cancelled" ? -1 : stages.indexOf(project.status);
  const statusLabel = statusLabels[project.status] ?? { ar: project.status, en: project.status };
  const canReviewShortlist = ["shortlist_ready", "client_review"].includes(project.status);
  const paymentRows = payments ?? [];
  const paid = paymentRows.filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const refunded = paymentRows.filter((item) => item.status === "refunded").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const collected = Math.max(0, paid - refunded);
  const quote = Number(project.quoted_amount || 0);
  const outstanding = Math.max(0, quote - collected);
  const currency = project.currency || "SAR";

  async function updateClientSelectionAction(formData: FormData) {
    "use server";
    const submittedToken = String(formData.get("token") || "").trim();
    const shortlistId = Number(formData.get("shortlist_id"));
    const decision = String(formData.get("decision") || "");
    if (submittedToken !== cleanToken || !Number.isInteger(shortlistId) || shortlistId <= 0 || !["selected", "reserved", "declined"].includes(decision)) return;
    const serverClient = createAdminClient();
    const { data: verifiedProject } = await serverClient.from("casting_projects").select("id,status,service_mode,opportunity_id,required_count").eq("id", projectId).eq("client_access_token", submittedToken).maybeSingle();
    if (!verifiedProject || verifiedProject.service_mode !== "managed" || !["shortlist_ready", "client_review"].includes(verifiedProject.status)) return;
    const { data: shortlistItem } = await serverClient.from("casting_shortlist").select("id,application_id,casting_role_id,status").eq("id", shortlistId).eq("casting_project_id", verifiedProject.id).maybeSingle();
    if (!shortlistItem || shortlistItem.status === "withdrawn") return;
    const { data: existingBooking } = await serverClient.from("talent_bookings").select("id").eq("application_id", shortlistItem.application_id).maybeSingle();
    if (existingBooking) return;
    const { data: application } = await serverClient.from("opportunity_applications").select("id,opportunity_id").eq("id", shortlistItem.application_id).maybeSingle();
    if (!application) return;
    let requiredCount = Number(verifiedProject.required_count || 1);
    if (shortlistItem.casting_role_id) {
      const { data: role } = await serverClient.from("casting_roles").select("id,opportunity_id,status,required_count").eq("id", shortlistItem.casting_role_id).eq("casting_project_id", verifiedProject.id).maybeSingle();
      if (!role || role.status === "cancelled" || !role.opportunity_id || Number(role.opportunity_id) !== Number(application.opportunity_id)) return;
      requiredCount = Number(role.required_count || 1);
    } else if (!verifiedProject.opportunity_id || Number(verifiedProject.opportunity_id) !== Number(application.opportunity_id)) return;
    if (decision === "selected" && shortlistItem.status !== "selected") {
      let countQuery = serverClient.from("casting_shortlist").select("id", { count: "exact", head: true }).eq("casting_project_id", verifiedProject.id).eq("status", "selected");
      countQuery = shortlistItem.casting_role_id ? countQuery.eq("casting_role_id", shortlistItem.casting_role_id) : countQuery.is("casting_role_id", null);
      const { count } = await countQuery;
      if ((count ?? 0) >= requiredCount) return;
    }
    const now = new Date().toISOString();
    const { error: updateError } = await serverClient.from("casting_shortlist").update({ status: decision, updated_at: now }).eq("id", shortlistId).eq("casting_project_id", verifiedProject.id);
    if (updateError) { console.error("[CastingStatusPage client selection]", updateError); return; }
    await serverClient.from("casting_projects").update({ status: verifiedProject.status === "shortlist_ready" ? "client_review" : verifiedProject.status, client_selection_confirmed_at: null, client_selection_note: null, updated_at: now }).eq("id", verifiedProject.id);
    revalidatePath(`/${language}/casting/status/${submittedToken}`);
  }

  async function confirmClientSelectionsAction(formData: FormData) {
    "use server";
    const submittedToken = String(formData.get("token") || "").trim();
    if (submittedToken !== cleanToken) return;
    const note = String(formData.get("note") || "").trim().slice(0, 2000);
    const serverClient = createAdminClient();
    const { data: verifiedProject } = await serverClient.from("casting_projects").select("id,status,service_mode").eq("id", projectId).eq("client_access_token", submittedToken).maybeSingle();
    if (!verifiedProject || verifiedProject.service_mode !== "managed" || !["shortlist_ready", "client_review"].includes(verifiedProject.status)) return;
    const { count } = await serverClient.from("casting_shortlist").select("id", { count: "exact", head: true }).eq("casting_project_id", verifiedProject.id).eq("status", "selected");
    if ((count ?? 0) < 1) return;
    const now = new Date().toISOString();
    const { error: updateError } = await serverClient.from("casting_projects").update({
      status: "client_review", client_selection_confirmed_at: now, client_selection_note: note || null,
      client_status_note: language === "ar" ? "تم اعتماد اختياراتكم. يعمل فريق MLAMH الآن على تأكيد توفر المواهب وتجهيز الخطوة التالية." : "Your selections are confirmed. The MLAMH team is now confirming talent availability and preparing the next step.", updated_at: now,
    }).eq("id", verifiedProject.id);
    if (updateError) { console.error("[CastingStatusPage confirm selections]", updateError); return; }
    revalidatePath(`/${language}/casting/status/${submittedToken}`);
  }

  async function submitManagedClientReviewAction(formData: FormData) {
    "use server";
    const submittedToken = String(formData.get("token") || "").trim();
    const bookingId = Number(formData.get("booking_id"));
    const rating = Number(formData.get("rating"));
    const comment = String(formData.get("comment") || "").trim().slice(0, 3000);
    if (submittedToken !== cleanToken || !Number.isInteger(bookingId) || bookingId <= 0 || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
    const serverClient = createAdminClient();
    const { data: verifiedProject } = await serverClient.from("casting_projects").select("id,service_mode").eq("id", projectId).eq("client_access_token", submittedToken).maybeSingle();
    if (!verifiedProject || verifiedProject.service_mode !== "managed") return;
    const { data: booking } = await serverClient.from("talent_bookings").select("id,talent_id,status,managed_casting_project_id").eq("id", bookingId).eq("managed_casting_project_id", projectId).maybeSingle();
    if (!booking || booking.status !== "completed") return;
    const now = new Date().toISOString();
    const { error: reviewError } = await serverClient.from("managed_casting_client_reviews").upsert({
      casting_project_id: projectId, booking_id: booking.id, talent_id: booking.talent_id, rating, comment: comment || null, updated_at: now,
    }, { onConflict: "casting_project_id,booking_id" });
    if (reviewError) { console.error("[CastingStatusPage managed review]", reviewError); return; }
    revalidatePath(`/${language}/casting/status/${submittedToken}`);
  }

  const navItems = [
    ["overview", isArabic ? "نظرة عامة" : "Overview"], ["roles", isArabic ? "الأدوار" : "Roles"],
    ["shortlist", isArabic ? "القائمة المختصرة" : "Shortlist"], ["selections", isArabic ? "اختياراتي" : "Selections"],
    ["bookings", isArabic ? "الحجوزات" : "Bookings"], ["payments", isArabic ? "المدفوعات" : "Payments"], ["files", isArabic ? "الملفات" : "Files"],
  ];

  return <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-24 pt-24 text-white sm:px-6 lg:pt-32"><div className="mx-auto max-w-6xl">
    <header id="overview" className="scroll-mt-28 rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-9"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH MANAGED CASTING</p><span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] text-white/40">PRIVATE CLIENT WORKSPACE</span></div><h1 className="mt-4 text-3xl font-light sm:text-5xl">{project.project_title}</h1><p className="mt-3 text-sm text-white/45">{project.company_name || (isArabic ? "مشروع Casting مُدار بواسطة ملامح" : "Managed casting project by MLAMH")}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-2 text-sm text-gold">{isArabic ? statusLabel.ar : statusLabel.en}</span>{project.client_selection_confirmed_at ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-2 text-xs text-emerald-200">{isArabic ? "الاختيارات معتمدة" : "Selections confirmed"}</span> : null}</div></div></header>

    <nav className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-2" aria-label={isArabic ? "أقسام مساحة العميل" : "Client workspace sections"}>{navItems.map(([id,label]) => <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-xl px-4 py-2.5 text-xs text-white/50 transition hover:bg-white/[0.05] hover:text-gold">{label}</a>)}</nav>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[[isArabic ? "الأدوار" : "Roles", roleRows.length],[isArabic ? "الطلبات" : "Applications", applicationRows.length],[isArabic ? "القائمة المختصرة" : "Shortlist", shortlistCount],[isArabic ? "الاحتياط" : "Reserve", reserveCount],[isArabic ? "الاختيارات" : "Selected", selectedCount]].map(([title,value]) => <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs text-white/35">{title}</p><p className="mt-3 text-3xl font-light text-white">{value}</p></div>)}</section>

    <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><h2 className="text-xl font-light text-white">{isArabic ? "آخر تحديث من فريق ملامح" : "Latest update from MLAMH"}</h2><p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-white/55">{project.client_status_note || (isArabic ? "سيظهر هنا آخر تحديث مخصص لكم من فريق MLAMH Casting." : "Your latest project update from the MLAMH Casting team will appear here.")}</p></div><div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><h2 className="text-xl font-light text-white">{isArabic ? "تفاصيل المشروع" : "Project details"}</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><dt className="text-white/35">{isArabic ? "المدينة" : "City"}</dt><dd className="text-white/70">{project.city || "—"}</dd></div><div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><dt className="text-white/35">{isArabic ? "تاريخ العمل" : "Work date"}</dt><dd className="text-white/70">{project.work_date || "—"}</dd></div><div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3"><dt className="text-white/35">{isArabic ? "الباقة" : "Package"}</dt><dd className="capitalize text-white/70">{project.package_code || "—"}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/35">{isArabic ? "العرض" : "Quote"}</dt><dd className="text-white/70">{project.quoted_amount != null ? `${money(project.quoted_amount)} ${currency}` : "—"}</dd></div></dl></div></section>

    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><h2 className="text-xl font-light text-white">{isArabic ? "تقدم المشروع" : "Project progress"}</h2><div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{stages.map((stage,index) => { const stageLabel = statusLabels[stage]; const completed = currentIndex >= index; return <div key={stage} className={`rounded-xl border p-4 text-xs leading-6 ${completed ? "border-gold/25 bg-gold/[0.06] text-gold" : "border-white/[0.07] bg-black/20 text-white/30"}`}>{isArabic ? stageLabel.ar : stageLabel.en}</div>; })}</div></section>

    <section id="roles" className="mt-6 scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><p className="text-xs uppercase tracking-[0.25em] text-gold">ROLES</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "أدوار المشروع" : "Project roles"}</h2>{roleRows.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{roleRows.map((role) => { const count = applicationRows.filter((app) => Number(app.opportunity_id) === Number(role.opportunity_id)).length; const shortCount = shortlistRows.filter((item) => Number(item.casting_role_id) === Number(role.id) && activeShortlistStatuses.includes(item.status)).length; const selectedForRole = shortlistRows.filter((item) => Number(item.casting_role_id) === Number(role.id) && item.status === "selected").length; return <div key={role.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white/80">{isArabic ? role.title : role.title_en || role.title}</p><span className="text-[10px] text-gold">{role.status}</span></div><p className="mt-3 text-xs text-white/35">{role.required_count} {isArabic ? "مطلوب" : "required"} · {count} {isArabic ? "طلبات" : "applications"} · {shortCount} shortlist · {selectedForRole} {isArabic ? "مختار" : "selected"}</p></div>; })}</div> : <p className="mt-5 text-sm text-white/35">{isArabic ? "سيضيف فريق ملامح أدوار المشروع بعد مراجعة الـBrief." : "MLAMH will add project roles after reviewing the brief."}</p>}</section>

    <section id="shortlist" className="mt-6 scroll-mt-28 rounded-[2rem] border border-gold/15 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.08),transparent_38%),rgba(255,255,255,0.025)] p-6 sm:p-8"><p className="text-xs uppercase tracking-[0.25em] text-gold">SHORTLIST REVIEW</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "القائمة المختصرة حسب الأدوار" : "Shortlist by role"}</h2><p className="mt-2 text-sm leading-7 text-white/40">{canReviewShortlist ? (isArabic ? "راجع المرشحين واختر الأساسي أو الاحتياط أو استبعد المرشح. بعد بدء تأكيد موهبة يتم قفل قرارها." : "Review candidates and mark each as selected, reserve, or passed. Once talent confirmation begins, that decision is locked.") : (isArabic ? "ستصبح قرارات القائمة متاحة عندما يجهز فريق ملامح الـShortlist للمراجعة." : "Shortlist decisions become available when MLAMH marks the shortlist ready for review.")}</p>{shortlistRows.length > 0 ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{shortlistRows.map((shortlistItem) => {
      const application = applicationMap.get(Number(shortlistItem.application_id)); const talent = application ? talentMap.get(Number(application.talent_id)) : undefined;
      const role = shortlistItem.casting_role_id ? roleMap.get(Number(shortlistItem.casting_role_id)) : application ? opportunityRoleMap.get(Number(application.opportunity_id)) : undefined;
      const talentName = isArabic ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar;
      const city = isArabic ? talent?.city_ar || talent?.city_en : talent?.city_en || talent?.city_ar; const category = isArabic ? talent?.category_ar || talent?.category_en : talent?.category_en || talent?.category_ar;
      const itemLabel = shortlistStatusLabels[shortlistItem.status] ?? { ar: shortlistItem.status, en: shortlistItem.status };
      const hasBooking = bookingRows.some((booking) => Number(booking.application_id) === Number(shortlistItem.application_id));
      const tone = shortlistItem.status === "selected" ? "border-emerald-300/25 bg-emerald-300/[0.06]" : shortlistItem.status === "reserved" ? "border-amber-300/25 bg-amber-300/[0.05]" : shortlistItem.status === "declined" ? "border-white/[0.06] bg-black/20 opacity-70" : "border-white/10 bg-black/20";
      return <article key={shortlistItem.id} className={`rounded-2xl border p-4 ${tone}`}><div className="flex items-center gap-4">{talent?.image_url ? <img src={talent.image_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover"/> : <div className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03]"/>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-medium text-white/85">{talentName || (isArabic ? "موهبة" : "Talent")}</h3><span className="rounded-full border border-gold/20 px-2.5 py-1 text-[10px] text-gold">{isArabic ? itemLabel.ar : itemLabel.en}</span>{hasBooking ? <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/40">{isArabic ? "قيد التأكيد" : "Confirmation started"}</span> : null}</div><p className="mt-2 text-xs text-white/35">{[category,city].filter(Boolean).join(" · ") || "—"}</p>{role ? <p className="mt-1 text-xs text-gold/70">{isArabic ? role.title : role.title_en || role.title}</p> : null}</div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">{talent?.slug ? <Link href={`/${language}/talent/${talent.slug}`} target="_blank" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/55">{isArabic ? "عرض الملف" : "View profile"}</Link> : null}{canReviewShortlist && shortlistItem.status !== "withdrawn" && !hasBooking ? <><DecisionForm action={updateClientSelectionAction} token={cleanToken} shortlistId={shortlistItem.id} decision="selected" label={isArabic ? "اختيار" : "Select"} className="border-emerald-300/25 bg-emerald-300/[0.06] text-emerald-200"/><DecisionForm action={updateClientSelectionAction} token={cleanToken} shortlistId={shortlistItem.id} decision="reserved" label={isArabic ? "احتياط" : "Reserve"} className="border-amber-300/25 bg-amber-300/[0.05] text-amber-200"/><DecisionForm action={updateClientSelectionAction} token={cleanToken} shortlistId={shortlistItem.id} decision="declined" label={isArabic ? "استبعاد" : "Pass"} className="border-white/10 text-white/45"/></> : null}</div></article>;
    })}</div> : <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/35">{isArabic ? "لم يتم تسليم قائمة مختصرة بعد." : "No shortlist has been delivered yet."}</p>}</section>

    <section id="selections" className="mt-6 scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-gold">SELECTIONS</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "اعتماد الاختيارات" : "Confirm selections"}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">{isArabic ? "بعد الاعتماد تبدأ ملامح بتأكيد توفر المواهب المختارة. الاحتياط يبقى جاهزًا للاستبدال عند الحاجة." : "Once confirmed, MLAMH starts verifying availability with selected talent. Reserve choices stay ready as backup."}</p></div><div className="flex gap-2"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.05] px-3 py-2 text-xs text-emerald-200">{selectedCount} {isArabic ? "مختار" : "selected"}</span><span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2 text-xs text-amber-200">{reserveCount} {isArabic ? "احتياط" : "reserve"}</span></div></div>{project.client_selection_confirmed_at ? <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-5"><p className="text-sm font-medium text-emerald-200">{isArabic ? "تم اعتماد الاختيارات" : "Selections confirmed"}</p><p className="mt-2 text-xs leading-6 text-white/40">{isArabic ? "فريق ملامح يعمل الآن على تأكيد المواهب وتجهيز الحجوزات." : "MLAMH is now confirming talent and preparing bookings."}</p>{project.client_selection_note ? <p className="mt-3 text-xs text-white/55">{project.client_selection_note}</p> : null}</div> : canReviewShortlist ? <form action={confirmClientSelectionsAction} className="mt-6 grid gap-3"><input type="hidden" name="token" value={cleanToken}/><textarea name="note" maxLength={2000} rows={3} placeholder={isArabic ? "ملاحظة اختيارية لفريق ملامح قبل التأكيد" : "Optional note for MLAMH before confirmation"} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/40"/><button disabled={selectedCount < 1} className="min-h-12 rounded-xl bg-gold px-6 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40">{isArabic ? "اعتماد الاختيارات وبدء التأكيد" : "Confirm selections & start talent confirmation"}</button></form> : null}</section>

    <section id="bookings" className="mt-6 scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><p className="text-xs uppercase tracking-[0.25em] text-gold">BOOKINGS</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "التأكيد والحجوزات" : "Talent confirmation & bookings"}</h2>{bookingRows.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{bookingRows.map((booking) => { const application = applicationMap.get(Number(booking.application_id)); const talent = application ? talentMap.get(Number(application.talent_id)) : undefined; const shortlistItem = shortlistRows.find((item) => Number(item.application_id) === Number(booking.application_id)); const role = shortlistItem?.casting_role_id ? roleMap.get(Number(shortlistItem.casting_role_id)) : application ? opportunityRoleMap.get(Number(application.opportunity_id)) : undefined; const name = isArabic ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar; const review = reviewMap.get(Number(booking.id)); return <div key={booking.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white/80">{name || (isArabic ? "موهبة مختارة" : "Selected talent")}</p><span className="rounded-full border border-gold/20 px-3 py-1 text-[10px] text-gold">{booking.status}</span></div>{role ? <p className="mt-2 text-xs text-gold/60">{isArabic ? role.title : role.title_en || role.title}</p> : null}<div className="mt-4 space-y-2 text-xs text-white/40"><p>{isArabic ? "التاريخ" : "Date"}: {booking.work_date || "—"}</p><p>{isArabic ? "الموقع" : "Location"}: {booking.location_text || "—"}</p><p>{isArabic ? "المقابل" : "Compensation"}: {booking.compensation_type === "fixed" && booking.compensation_amount != null ? `${money(booking.compensation_amount)} ${booking.currency}` : booking.compensation_type}</p></div>{booking.status === "completed" ? review ? <div className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4"><p className="text-xs text-emerald-200">{isArabic ? `تم التقييم: ${review.rating}/5` : `Rated: ${review.rating}/5`}</p>{review.comment ? <p className="mt-2 text-xs leading-6 text-white/45">{review.comment}</p> : null}</div> : <form action={submitManagedClientReviewAction} className="mt-4 space-y-3 border-t border-white/[0.07] pt-4"><input type="hidden" name="token" value={cleanToken}/><input type="hidden" name="booking_id" value={booking.id}/><p className="text-xs text-white/50">{isArabic ? "قيّم الموهبة بعد اكتمال العمل" : "Rate the talent after completion"}</p><select name="rating" defaultValue="5" className="min-h-10 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select><textarea name="comment" maxLength={3000} rows={2} placeholder={isArabic ? "تعليق اختياري" : "Optional comment"} className="w-full rounded-xl border border-white/10 bg-black p-3 text-xs text-white outline-none"/><button className="min-h-10 w-full rounded-xl border border-gold/25 bg-gold/[0.06] px-4 text-xs text-gold">{isArabic ? "إرسال التقييم" : "Submit rating"}</button></form> : null}</div>; })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6"><p className="text-sm text-white/50">{isArabic ? "لا توجد حجوزات بعد." : "No booking records yet."}</p><p className="mt-2 text-xs leading-6 text-white/30">{project.client_selection_confirmed_at ? (isArabic ? "الاختيارات وصلت إلى فريق ملامح. ستظهر الحجوزات هنا عند بدء تأكيد المواهب." : "Your selections are with MLAMH. Bookings appear here once talent confirmation starts.") : (isArabic ? "بعد اعتماد الاختيارات يبدأ فريق ملامح مرحلة تأكيد المواهب والحجز." : "After you confirm selections, MLAMH begins talent confirmation and booking.")}</p></div>}</section>

    <section id="payments" className="mt-6 scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><p className="text-xs uppercase tracking-[0.25em] text-gold">PAYMENTS</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "الحالة المالية" : "Commercial summary"}</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "قيمة العرض" : "Quoted"}</p><p className="mt-2 text-2xl font-light">{project.quoted_amount != null ? `${money(quote)} ${currency}` : "—"}</p></div><div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.03] p-5"><p className="text-xs text-emerald-200/60">{isArabic ? "المحصّل" : "Collected"}</p><p className="mt-2 text-2xl font-light">{money(collected)} {currency}</p></div><div className="rounded-2xl border border-white/[0.08] bg-black/20 p-5"><p className="text-xs text-white/35">{isArabic ? "المتبقي" : "Outstanding"}</p><p className="mt-2 text-2xl font-light">{project.quoted_amount != null ? `${money(outstanding)} ${currency}` : "—"}</p></div></div><p className="mt-4 text-xs leading-6 text-white/30">{isArabic ? "تعرض هذه الصفحة ملخص الحالة المالية فقط. أي فاتورة أو رابط دفع رسمي يصدر من ملامح بشكل منفصل." : "This workspace shows a financial summary only. Any formal invoice or payment link is issued separately by MLAMH."}</p></section>

    <section id="files" className="mt-6 scroll-mt-28 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8"><p className="text-xs uppercase tracking-[0.25em] text-gold">FILES</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "ملفات المشروع" : "Project files"}</h2><div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6"><p className="text-sm text-white/45">{isArabic ? "لا توجد ملفات مشتركة حاليًا." : "No shared files yet."}</p><p className="mt-2 text-xs leading-6 text-white/30">{isArabic ? "عند مشاركة Call Sheet أو تعليمات أو ملفات تسليم مرتبطة بالمشروع ستظهر في هذا القسم." : "Call sheets, instructions, and other project deliverables will appear here when shared by MLAMH."}</p></div></section>

    {(opportunities ?? []).some((item) => item.published && item.slug) ? <div className="mt-6 flex flex-wrap gap-2">{(opportunities ?? []).filter((item) => item.published && item.slug).map((item) => { const role = opportunityRoleMap.get(Number(item.id)); return <Link key={item.id} href={`/${language}/opportunities/${item.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gold/30 px-6 text-sm text-gold">{role ? (isArabic ? role.title : role.title_en || role.title) : isArabic ? "عرض فرصة المشروع" : "View project opportunity"}</Link>; })}</div> : null}
    <p className="mt-8 text-xs leading-6 text-white/25">{isArabic ? "هذا رابط خاص بمساحة مشروعك. لا تشاركه خارج فريقك. قرارات الاختيار تبدأ إجراءات التأكيد ولا تمثل حجزًا نهائيًا حتى تؤكد الموهبة تفاصيل العمل." : "This is a private project workspace link. Do not share it outside your team. Selection decisions start confirmation and do not become final bookings until the talent confirms the work details."}</p>
  </div></main>;
}

function DecisionForm({ action, token, shortlistId, decision, label, className }: { action: (formData: FormData) => Promise<void>; token: string; shortlistId: number; decision: string; label: string; className: string }) {
  return <form action={action}><input type="hidden" name="token" value={token}/><input type="hidden" name="shortlist_id" value={shortlistId}/><input type="hidden" name="decision" value={decision}/><button className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 text-xs ${className}`}>{label}</button></form>;
}
