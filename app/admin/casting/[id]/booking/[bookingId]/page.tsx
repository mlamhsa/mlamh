import Link from "next/link";
import { notFound } from "next/navigation";

import { replaceManagedTalentWithReserveAction, updateManagedBookingDetailsAction } from "@/lib/actions/admin-managed-booking";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function ManagedBookingAdminPage({ params, searchParams }: { params: Promise<{ id: string; bookingId: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requireAdminAccess();
  const [{ id, bookingId: rawBookingId }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  const bookingId = Number(rawBookingId);
  if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(bookingId) || bookingId <= 0) notFound();
  const language = query.lang === "en" ? "en" : "ar";
  const ar = language === "ar";
  const admin = createAdminClient();
  const [{ data: project }, { data: booking }] = await Promise.all([
    admin.from("casting_projects").select("id,project_title,service_mode").eq("id", projectId).maybeSingle(),
    admin.from("talent_bookings").select("id,application_id,conversation_id,opportunity_id,talent_id,status,work_date,work_time,work_duration,location_text,compensation_type,compensation_amount,currency,notes,talent_response_note").eq("id", bookingId).eq("managed_casting_project_id", projectId).maybeSingle(),
  ]);
  if (!project || project.service_mode !== "managed" || !booking) notFound();

  const [{ data: talent }, { data: currentShortlist }, { data: replacementHistory }] = await Promise.all([
    admin.from("talents").select("display_name_ar,display_name_en,name_ar,name_en").eq("id", booking.talent_id).maybeSingle(),
    admin.from("casting_shortlist").select("id,application_id,casting_role_id,status").eq("casting_project_id", projectId).eq("application_id", booking.application_id).maybeSingle(),
    admin.from("managed_casting_replacements").select("id,status,reason,replacement_talent_id,replacement_booking_id,created_at").eq("replaced_booking_id", booking.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const name = ar ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar;
  const editable = ["proposed", "changes_requested"].includes(booking.status);
  const replaceable = ["proposed", "changes_requested", "confirmed"].includes(booking.status) && currentShortlist?.status === "selected" && !replacementHistory;

  let reserveOptions: Array<{ shortlistId: number; talentId: number; name: string; applicationId: number }> = [];
  if (replaceable) {
    let reserveQuery = admin.from("casting_shortlist")
      .select("id,application_id,casting_role_id,status")
      .eq("casting_project_id", projectId)
      .eq("status", "reserved");
    reserveQuery = currentShortlist?.casting_role_id
      ? reserveQuery.eq("casting_role_id", currentShortlist.casting_role_id)
      : reserveQuery.is("casting_role_id", null);
    const { data: reserves } = await reserveQuery;
    const reserveApplicationIds = (reserves ?? []).map((row) => Number(row.application_id)).filter(Boolean);
    const { data: reserveApplications } = reserveApplicationIds.length
      ? await admin.from("opportunity_applications").select("id,opportunity_id,talent_id,status").in("id", reserveApplicationIds).eq("opportunity_id", booking.opportunity_id)
      : { data: [] as Array<{ id: number; opportunity_id: number; talent_id: number; status: string }> };
    const eligibleApplications = (reserveApplications ?? []).filter((row) => ["pending", "reviewing", "shortlisted", "accepted"].includes(String(row.status)));
    const talentIds = eligibleApplications.map((row) => Number(row.talent_id));
    const { data: reserveTalents } = talentIds.length
      ? await admin.from("talents").select("id,display_name_ar,display_name_en,name_ar,name_en").in("id", talentIds)
      : { data: [] as Array<{ id: number; display_name_ar: string | null; display_name_en: string | null; name_ar: string | null; name_en: string | null }> };
    const talentMap = new Map((reserveTalents ?? []).map((row) => [Number(row.id), row]));
    const shortlistMap = new Map((reserves ?? []).map((row) => [Number(row.application_id), row]));
    reserveOptions = eligibleApplications.map((application) => {
      const reserveTalent = talentMap.get(Number(application.talent_id));
      const displayName = ar
        ? reserveTalent?.display_name_ar || reserveTalent?.name_ar || reserveTalent?.display_name_en || reserveTalent?.name_en
        : reserveTalent?.display_name_en || reserveTalent?.name_en || reserveTalent?.display_name_ar || reserveTalent?.name_ar;
      return {
        shortlistId: Number(shortlistMap.get(Number(application.id))?.id),
        talentId: Number(application.talent_id),
        applicationId: Number(application.id),
        name: displayName || `Talent #${application.talent_id}`,
      };
    }).filter((item) => Number.isInteger(item.shortlistId) && item.shortlistId > 0);
  }

  let replacementTalentName: string | null = null;
  if (replacementHistory?.replacement_talent_id) {
    const { data: replacementTalent } = await admin.from("talents").select("display_name_ar,display_name_en,name_ar,name_en").eq("id", replacementHistory.replacement_talent_id).maybeSingle();
    replacementTalentName = ar
      ? replacementTalent?.display_name_ar || replacementTalent?.name_ar || replacementTalent?.display_name_en || replacementTalent?.name_en || null
      : replacementTalent?.display_name_en || replacementTalent?.name_en || replacementTalent?.display_name_ar || replacementTalent?.name_ar || null;
  }

  return <div dir={ar ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl">
    <Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className="text-xs text-gold hover:underline">{ar ? "← العودة لمركز الفرز" : "← Back to screening"}</Link>
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">MANAGED BOOKING</p>
      <h1 className="mt-2 text-3xl font-light text-white">{name || (ar ? "تفاصيل تأكيد الموهبة" : "Talent confirmation details")}</h1>
      <p className="mt-2 text-sm text-white/35">{project.project_title} · Booking #{booking.id} · {booking.status}</p>
      {booking.talent_response_note ? <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4"><p className="text-xs text-amber-200">{ar ? "طلب التعديل من الموهبة" : "Talent change request"}</p><p className="mt-2 text-sm leading-7 text-white/60">{booking.talent_response_note}</p></div> : null}
      {editable ? <form action={updateManagedBookingDetailsAction} className="mt-6 grid gap-4">
        <input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="booking_id" value={booking.id}/>
        <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "تاريخ العمل" : "Work date"} *</span><input required type="date" name="work_date" defaultValue={booking.work_date || ""} className="field"/></label><label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "وقت البدء" : "Start time"}</span><input type="time" name="work_time" defaultValue={booking.work_time?.slice?.(0,5) || ""} className="field"/></label></div>
        <label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "الموقع" : "Location"} *</span><input required name="location_text" defaultValue={booking.location_text || ""} className="field"/></label>
        <label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "مدة العمل" : "Duration"}</span><input name="work_duration" defaultValue={booking.work_duration || ""} className="field"/></label>
        <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "نوع المقابل" : "Compensation"}</span><select name="compensation_type" defaultValue={booking.compensation_type || "negotiable"} className="field"><option value="fixed">Fixed</option><option value="negotiable">Negotiable</option><option value="unpaid">Unpaid</option></select></label><label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "المبلغ" : "Amount"}</span><input type="number" min="0" step="0.01" name="compensation_amount" defaultValue={booking.compensation_amount ?? ""} className="field"/></label><label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "العملة" : "Currency"}</span><input name="currency" maxLength={3} defaultValue={booking.currency || "SAR"} className="field uppercase"/></label></div>
        <label className="grid gap-2"><span className="text-xs text-white/40">{ar ? "ملاحظات للموهبة" : "Talent notes"}</span><textarea name="notes" rows={4} defaultValue={booking.notes || ""} className="field min-h-28"/></label>
        <button className="min-h-12 rounded-xl bg-gold px-5 text-sm font-medium text-black">{ar ? "إرسال التفاصيل المحدثة للموهبة" : "Send updated details to talent"}</button>
      </form> : <div className="mt-6 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4 text-sm text-emerald-100/70">{ar ? "تم تأكيد هذا الحجز ولا يمكن تعديل تفاصيله من هذه الشاشة." : "This booking is confirmed and can no longer be edited here."}</div>}

      {replacementHistory ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">REPLACEMENT GUARANTEE</p>
        <h2 className="mt-2 text-lg font-light text-white">{ar ? "تم تفعيل ضمان الاستبدال" : "Replacement guarantee activated"}</h2>
        <p className="mt-2 text-sm leading-7 text-white/50">{ar ? `تم تحويل هذا الحجز إلى موهبة احتياط${replacementTalentName ? `: ${replacementTalentName}` : ""}. الحالة الحالية: ${replacementHistory.status}.` : `This booking was replaced with a reserve talent${replacementTalentName ? `: ${replacementTalentName}` : ""}. Current status: ${replacementHistory.status}.`}</p>
        {replacementHistory.reason ? <p className="mt-3 text-xs leading-6 text-white/35">{ar ? "السبب" : "Reason"}: {replacementHistory.reason}</p> : null}
        {replacementHistory.replacement_booking_id ? <Link href={`/admin/casting/${projectId}/booking/${replacementHistory.replacement_booking_id}?lang=${language}`} className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-amber-300/20 px-4 text-xs text-amber-100">{ar ? "فتح حجز البديل" : "Open replacement booking"}</Link> : null}
      </div> : replaceable ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200">CASTING GUARANTEE</p>
        <h2 className="mt-2 text-xl font-light text-white">{ar ? "استبدال بموهبة من الاحتياط" : "Replace with reserve talent"}</h2>
        <p className="mt-2 text-xs leading-6 text-white/40">{ar ? "إذا تعذّر على الموهبة الاستمرار قبل التنفيذ، يمكن تفعيل الاستبدال بدون إعادة اختيارات العميل. سيتم إلغاء هذا الحجز وبدء تأكيد البديل فورًا مع حفظ سجل تدقيق كامل." : "If the talent can no longer proceed before delivery, activate the guarantee without restarting client selection. This booking is cancelled and reserve confirmation starts immediately with a full audit trail."}</p>
        {reserveOptions.length ? <form action={replaceManagedTalentWithReserveAction} className="mt-5 grid gap-3">
          <input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="booking_id" value={booking.id}/>
          <select required name="reserve_shortlist_id" defaultValue="" className="field"><option value="" disabled>{ar ? "اختر موهبة الاحتياط" : "Choose reserve talent"}</option>{reserveOptions.map((option) => <option key={option.shortlistId} value={option.shortlistId}>{option.name}</option>)}</select>
          <textarea name="reason" maxLength={2000} rows={3} placeholder={ar ? "سبب الاستبدال — مثال: الموهبة لم تعد متاحة في موعد التنفيذ" : "Replacement reason — e.g. talent is no longer available on the work date"} className="field min-h-24"/>
          <button className="min-h-11 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 text-sm font-medium text-amber-100">{ar ? "تفعيل ضمان الاستبدال" : "Activate replacement guarantee"}</button>
        </form> : <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/35">{ar ? "لا توجد موهبة احتياط مؤهلة لهذا الدور حاليًا. أضف احتياطًا من مركز الفرز أولًا." : "No eligible reserve talent is available for this role. Add a reserve candidate from screening first."}</div>}
      </div> : null}

      <Link href={`/admin/messages/${booking.conversation_id}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm text-white/55 hover:text-gold">{ar ? "فتح محادثة الموهبة" : "Open talent conversation"}</Link>
    </div>
    <style>{`.field{min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#080808;padding:10px 12px;color:white;outline:none}.field:focus{border-color:rgba(201,169,98,.5)}.field option{background:#080808;color:white}`}</style>
  </div></div>;
}
