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

type TalentRequestFormProps = {
  talentId: number;
  locale: "ar" | "en";
  embedded?: boolean;
};

const fieldClassName =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-gold/50 focus:bg-black/40";

export function TalentRequestForm({
  talentId,
  locale,
  embedded = false,
}: TalentRequestFormProps) {
  const isRtl = locale === "ar";

  const [state, formAction, isPending] = useActionState(
    submitTalentRequestAction,
    initialState
  );

  if (state.success) {
    return (
      <div
        className={`rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 text-sm leading-7 text-emerald-300 ${
          embedded ? "" : "mt-10"
        }`}
      >
        {isRtl
          ? "تم إرسال الطلب بنجاح. سيتم التواصل معك قريبًا."
          : "Request submitted successfully. We will contact you soon."}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className={
        embedded
          ? ""
          : "mt-10 rounded-3xl border border-white/[0.08] bg-black/20 p-5 sm:p-6"
      }
    >
      <input type="hidden" name="talent_id" value={talentId} />

      {!embedded ? (
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl ? "ابدأ مشروعك" : "Start your project"}
          </p>
          <h3 className="mt-3 text-2xl font-light text-white">
            {isRtl ? "طلب الموهبة" : "Request Talent"}
          </h3>
        </div>
      ) : null}

      {state.message ? (
        <p className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-300">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "الاسم الكامل" : "Full name"} *
          </span>
          <input
            name="full_name"
            required
            autoComplete="name"
            placeholder={isRtl ? "اكتب الاسم الكامل" : "Enter full name"}
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "الشركة" : "Company"}
          </span>
          <input
            name="company"
            autoComplete="organization"
            placeholder={isRtl ? "اسم الشركة" : "Company name"}
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "البريد الإلكتروني" : "Email"} *
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder={isRtl ? "name@example.com" : "name@example.com"}
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "رقم الجوال" : "Phone"}
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={
              isRtl
                ? "05xxxxxxxx (اختياري)"
                : "Phone number (optional)"
            }
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "نوع المشروع" : "Project type"}
          </span>
          <input
            name="project_type"
            placeholder={
              isRtl ? "إعلان، فيلم، فعالية..." : "Commercial, film, event..."
            }
            className={fieldClassName}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "الميزانية المتوقعة" : "Estimated budget"}
          </span>
          <input
            name="budget"
            inputMode="decimal"
            placeholder={
              isRtl
                ? "مثال: 5,000 ريال"
                : "Example: 5,000 SAR"
            }
            className={fieldClassName}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs text-white/45">
            {isRtl ? "تاريخ المشروع" : "Project date"}
          </span>
          <input
            name="project_date"
            type="date"
            className={`${fieldClassName} [color-scheme:dark]`}
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs text-white/45">
          {isRtl ? "تفاصيل المشروع" : "Project details"} *
          </span>
          <textarea
  name="project_details"
  rows={5}
  required
  maxLength={2000}
  placeholder={
    isRtl
      ? "اشرح طبيعة المشروع، الموقع، المدة وأي متطلبات مهمة."
      : "Describe the project, location, duration and key requirements."
  }
  className={`${fieldClassName} min-h-32 resize-y`}
/>  
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-7 text-xs font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
