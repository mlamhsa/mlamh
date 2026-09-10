import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, MapPin, WalletCards } from "lucide-react";

import {
  markBookingCompletedAction,
  proposeBookingAction,
  respondToBookingAction,
  submitBookingRatingAction,
} from "@/lib/actions/booking-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string; conversationId: string }>;
};

function moneyLabel(amount: number | null, currency: string, isArabic: boolean) {
  if (amount === null) return isArabic ? "حسب الاتفاق" : "Negotiable";
  return `${new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US").format(amount)} ${currency}`;
}

export default async function BookingWorkflowPage({ params }: PageProps) {
  const { locale, conversationId: rawId } = await params;
  const isArabic = locale === "ar";
  const conversationId = Number(rawId);
  if (!Number.isInteger(conversationId) || conversationId <= 0) redirect(`/${locale}`);

  const auth = await createServerSupabaseClient();
  const admin = createAdminClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_type, approval_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || !["publisher", "talent"].includes(profile.account_type)) redirect(`/${locale}/login`);

  const role = profile.account_type as "publisher" | "talent";
  let participantId: number | null = null;
  if (role === "publisher") {
    const { data } = await admin.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
    participantId = data?.id ?? null;
  } else {
    const { data } = await admin.from("talents").select("id").eq("user_id", user.id).maybeSingle();
    participantId = data?.id ?? null;
  }
  if (!participantId) redirect(`/${locale}`);

  let conversationQuery = admin
    .from("conversations")
    .select("id, application_id, opportunity_id, publisher_id, talent_id, status")
    .eq("id", conversationId);
  conversationQuery = role === "publisher"
    ? conversationQuery.eq("publisher_id", participantId)
    : conversationQuery.eq("talent_id", participantId);
  const { data: conversation } = await conversationQuery.maybeSingle();
  if (!conversation?.application_id) redirect(role === "publisher" ? `/${locale}/publisher-dashboard/messages` : `/${locale}/talent-dashboard/messages`);

  const [{ data: application }, { data: opportunity }, { data: booking }, { data: reviews }] = await Promise.all([
    admin.from("opportunity_applications").select("id, status").eq("id", conversation.application_id).maybeSingle(),
    admin.from("opportunities").select("id, title, work_date, work_time, work_duration, compensation_type, budget, currency, city_ar, city_en").eq("id", conversation.opportunity_id).maybeSingle(),
    admin.from("talent_bookings").select("*").eq("conversation_id", conversation.id).maybeSingle(),
    admin.from("talent_booking_reviews").select("id, reviewer_user_id, reviewer_role, rating, comment").eq("booking_id", (await admin.from("talent_bookings").select("id").eq("conversation_id", conversation.id).maybeSingle()).data?.id ?? -1),
  ]);

  if (!application || application.status !== "accepted") redirect(role === "publisher" ? `/${locale}/publisher-dashboard/messages` : `/${locale}/talent-dashboard/messages`);

  const ownReview = (reviews ?? []).find((review) => review.reviewer_user_id === user.id);
  const backHref = role === "publisher"
    ? `/${locale}/publisher-dashboard/messages/${conversation.id}`
    : `/${locale}/talent-dashboard/messages/${conversation.id}`;

  const statusLabel: Record<string, string> = isArabic
    ? { proposed: "بانتظار تأكيد الموهبة", changes_requested: "مطلوب تعديل التفاصيل", confirmed: "الحجز مؤكد", completed: "تم تنفيذ العمل", cancelled: "ملغي" }
    : { proposed: "Awaiting talent confirmation", changes_requested: "Changes requested", confirmed: "Booking confirmed", completed: "Work completed", cancelled: "Cancelled" };

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-24 pt-28 text-white sm:px-6 lg:pb-10">
      <div className="mx-auto max-w-3xl">
        <Link href={backHref} className="text-sm text-white/55 transition hover:text-gold">
          {isArabic ? "← العودة إلى المحادثة" : "← Back to conversation"}
        </Link>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">MLAMH Booking</p>
          <h1 className="mt-3 text-3xl font-light sm:text-4xl">
            {isArabic ? "تأكيد تفاصيل العمل" : "Confirm Work Details"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            {opportunity?.title ?? (isArabic ? "الفرصة" : "Opportunity")}
          </p>

          {booking ? (
            <div className="mt-6 inline-flex rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-xs text-gold">
              {statusLabel[booking.status] ?? booking.status}
            </div>
          ) : null}

          {role === "publisher" && (!booking || ["proposed", "changes_requested"].includes(booking.status)) ? (
            <form action={proposeBookingAction} className="mt-8 space-y-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="conversationId" value={conversation.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={isArabic ? "تاريخ العمل" : "Work date"} icon={<CalendarDays size={16} />}>
                  <input type="date" name="workDate" defaultValue={booking?.work_date ?? opportunity?.work_date ?? ""} className="field" />
                </Field>
                <Field label={isArabic ? "وقت البدء (اختياري)" : "Start time (optional)"} icon={<Clock3 size={16} />}>
                  <input type="time" name="workTime" defaultValue={booking?.work_time?.slice?.(0,5) ?? opportunity?.work_time?.slice?.(0,5) ?? ""} className="field" />
                </Field>
              </div>
              <Field label={isArabic ? "الموقع / مكان العمل" : "Location"} icon={<MapPin size={16} />}>
                <input name="locationText" defaultValue={booking?.location_text ?? (isArabic ? opportunity?.city_ar : opportunity?.city_en) ?? ""} placeholder={isArabic ? "مثال: الرياض - حي العليا" : "e.g. Riyadh - Al Olaya"} className="field" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={isArabic ? "مدة العمل" : "Duration"} icon={<Clock3 size={16} />}>
                  <input name="workDuration" defaultValue={booking?.work_duration ?? opportunity?.work_duration ?? ""} placeholder={isArabic ? "مثال: ساعتان" : "e.g. 2 hours"} className="field" />
                </Field>
                <Field label={isArabic ? "المقابل" : "Compensation"} icon={<WalletCards size={16} />}>
                  <select name="compensationType" defaultValue={booking?.compensation_type ?? opportunity?.compensation_type ?? "negotiable"} className="field">
                    <option value="fixed">{isArabic ? "مبلغ محدد" : "Fixed"}</option>
                    <option value="negotiable">{isArabic ? "حسب الاتفاق" : "Negotiable"}</option>
                    <option value="unpaid">{isArabic ? "غير مدفوع" : "Unpaid"}</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <input name="compensationAmount" type="number" min="0" step="0.01" defaultValue={booking?.compensation_amount ?? ""} placeholder={isArabic ? "المبلغ" : "Amount"} className="field" />
                <input name="currency" defaultValue={booking?.currency ?? opportunity?.currency ?? "SAR"} maxLength={3} className="field uppercase" />
              </div>
              <textarea name="notes" defaultValue={booking?.notes ?? ""} rows={3} placeholder={isArabic ? "تفاصيل إضافية للموهبة — اختياري" : "Additional details — optional"} className="field resize-none" />
              <button className="min-h-12 w-full rounded-full bg-gold px-6 font-medium text-black transition hover:bg-gold-soft">
                {booking ? (isArabic ? "إرسال التفاصيل المحدثة" : "Send updated details") : (isArabic ? "إرسال التفاصيل للموهبة" : "Send details to talent")}
              </button>
            </form>
          ) : null}

          {booking ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Info label={isArabic ? "التاريخ" : "Date"} value={booking.work_date || "—"} />
              <Info label={isArabic ? "الوقت" : "Time"} value={booking.work_time?.slice?.(0,5) || "—"} />
              <Info label={isArabic ? "الموقع" : "Location"} value={booking.location_text || "—"} />
              <Info label={isArabic ? "المدة" : "Duration"} value={booking.work_duration || "—"} />
              <Info label={isArabic ? "المقابل" : "Compensation"} value={booking.compensation_type === "fixed" ? moneyLabel(Number(booking.compensation_amount), booking.currency, isArabic) : booking.compensation_type === "unpaid" ? (isArabic ? "غير مدفوع" : "Unpaid") : (isArabic ? "حسب الاتفاق" : "Negotiable")} />
              <Info label={isArabic ? "ملاحظات" : "Notes"} value={booking.notes || "—"} />
            </div>
          ) : null}

          {role === "talent" && booking?.status === "proposed" ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <form action={respondToBookingAction}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="response" value="confirm" />
                <button className="min-h-12 w-full rounded-full bg-gold px-6 font-medium text-black">{isArabic ? "تأكيد الحجز" : "Confirm booking"}</button>
              </form>
              <form action={respondToBookingAction} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="response" value="request_changes" />
                <input name="responseNote" placeholder={isArabic ? "ما التعديل المطلوب؟" : "What should change?"} className="field" />
                <button className="min-h-12 w-full rounded-full border border-white/15 px-6 text-white/75">{isArabic ? "طلب تعديل" : "Request changes"}</button>
              </form>
            </div>
          ) : null}

          {booking?.status === "confirmed" ? (
            <form action={markBookingCompletedAction} className="mt-8">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="role" value={role} />
              <button disabled={role === "publisher" ? Boolean(booking.publisher_completed_at) : Boolean(booking.talent_completed_at)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/[0.08] px-6 text-emerald-200 disabled:opacity-50">
                <CheckCircle2 size={18} />
                {role === "publisher"
                  ? booking.publisher_completed_at ? (isArabic ? "تم تأكيد التنفيذ من طرفك" : "You confirmed completion") : (isArabic ? "تأكيد تنفيذ العمل" : "Confirm work completed")
                  : booking.talent_completed_at ? (isArabic ? "تم تأكيد التنفيذ من طرفك" : "You confirmed completion") : (isArabic ? "تم تنفيذ العمل" : "Work completed")}
              </button>
            </form>
          ) : null}

          {booking?.status === "completed" && !ownReview ? (
            <form action={submitBookingRatingAction} className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="role" value={role} />
              <h2 className="text-xl font-light">{isArabic ? "قيّم التجربة" : "Rate the experience"}</h2>
              <p className="mt-2 text-sm text-white/45">{isArabic ? "تقييمك يساعد ملامح على بناء مجتمع أكثر موثوقية." : "Your rating helps MLAMH build a more trusted community."}</p>
              <select name="rating" required defaultValue="5" className="field mt-4">
                {[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} / 5</option>)}
              </select>
              <textarea name="comment" rows={3} placeholder={isArabic ? "تعليق اختياري" : "Optional comment"} className="field mt-3 resize-none" />
              <button className="mt-4 min-h-11 w-full rounded-full bg-gold px-6 text-black">{isArabic ? "إرسال التقييم" : "Submit rating"}</button>
            </form>
          ) : null}

          {ownReview ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm text-white/65">
              {isArabic ? `تم إرسال تقييمك: ${ownReview.rating}/5` : `Your rating was submitted: ${ownReview.rating}/5`}
            </div>
          ) : null}
        </section>
      </div>
      <style>{`.field{width:100%;min-height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);padding:12px 14px;color:white;outline:none}.field:focus{border-color:rgba(205,170,90,.55)}.field option{background:#111;color:white}`}</style>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-xs text-white/45">{icon}{label}</span>{children}</label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-gold/65">{label}</p><p className="mt-2 text-sm leading-6 text-white/75">{value}</p></div>;
}
