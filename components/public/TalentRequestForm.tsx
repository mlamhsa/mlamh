"use client";

import { useActionState } from "react";
import {
  submitTalentRequestAction,
  type SubmitTalentRequestState,
} from "@/lib/actions/submit-talent-request";

const initialState: SubmitTalentRequestState = {
  success: false,
  message: null,
};

export function TalentRequestForm({
  talentId,
  locale,
}: {
  talentId: number;
  locale: "ar" | "en";
}) {
  const isRtl = locale === "ar";

  const [state, formAction, isPending] = useActionState(
    submitTalentRequestAction,
    initialState
  );

  if (state.success) {
    return (
      <div className="mt-10 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-emerald-300">
        {isRtl
          ? "تم إرسال الطلب بنجاح. سيتم التواصل معك قريبًا."
          : "Request submitted successfully. We will contact you soon."}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-10 rounded-3xl border border-white/[0.08] bg-black/20 p-6"
    >
      <input type="hidden" name="talent_id" value={talentId} />

      <h3 className="mb-6 text-2xl font-light text-white">
        {isRtl ? "طلب الموهبة" : "Request Talent"}
      </h3>

      {state.message ? (
        <p className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="full_name"
          required
          placeholder={isRtl ? "الاسم الكامل *" : "Full name *"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
        />

        <input
          name="company"
          placeholder={isRtl ? "الشركة" : "Company"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
        />

        <input
          name="email"
          type="email"
          required
          placeholder={isRtl ? "البريد الإلكتروني *" : "Email *"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
        />

        <input
          name="phone"
          placeholder={isRtl ? "رقم الجوال" : "Phone"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
        />

        <input
          name="project_type"
          placeholder={isRtl ? "نوع المشروع" : "Project type"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
        />

        <input
          name="budget"
          placeholder={isRtl ? "الميزانية المتوقعة" : "Estimated budget"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
        />

        <input
          name="project_date"
          placeholder={isRtl ? "تاريخ المشروع" : "Project date"}
          className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50 md:col-span-2"
        />

        <textarea
          name="project_details"
          rows={4}
          placeholder={isRtl ? "تفاصيل المشروع" : "Project details"}
          className="resize-y border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/50 md:col-span-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 rounded-full border border-gold/40 bg-gold/[0.06] px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
      >
        {isPending
          ? isRtl
            ? "جاري الإرسال..."
            : "Submitting..."
          : isRtl
            ? "إرسال الطلب"
            : "Submit Request"}
      </button>
    </form>
  );
}