import Link from "next/link";
import { notFound } from "next/navigation";

import { updateManagedBookingDetailsAction } from "@/lib/actions/admin-managed-booking";
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
    admin.from("talent_bookings").select("id,conversation_id,opportunity_id,talent_id,status,work_date,work_time,work_duration,location_text,compensation_type,compensation_amount,currency,notes,talent_response_note").eq("id", bookingId).eq("managed_casting_project_id", projectId).maybeSingle(),
  ]);
  if (!project || project.service_mode !== "managed" || !booking) notFound();
  const { data: talent } = await admin.from("talents").select("display_name_ar,display_name_en,name_ar,name_en").eq("id", booking.talent_id).maybeSingle();
  const name = ar ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar;
  const editable = ["proposed", "changes_requested"].includes(booking.status);

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
      <Link href={`/admin/messages/${booking.conversation_id}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm text-white/55 hover:text-gold">{ar ? "فتح محادثة الموهبة" : "Open talent conversation"}</Link>
    </div>
    <style>{`.field{min-height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:#080808;padding:10px 12px;color:white;outline:none}.field:focus{border-color:rgba(201,169,98,.5)}.field option{background:#080808;color:white}`}</style>
  </div></div>;
}
