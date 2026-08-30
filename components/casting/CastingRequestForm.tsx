"use client";

import { useState } from "react";

type Props = {
  locale: "ar" | "en";
};

export function CastingRequestForm({ locale }: Props) {
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/casting/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, locale }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");

      setSuccessId(Number(data.requestId) || 0);
      event.currentTarget.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : isRtl
            ? "تعذر إرسال الطلب."
            : "Could not submit the request.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (successId !== null) {
    return (
      <div className="rounded-[2rem] border border-gold/25 bg-gold/[0.06] p-7 sm:p-9">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">
          {isRtl ? "تم استلام الـ Brief" : "Brief received"}
        </p>
        <h2 className="mt-4 text-3xl font-light">
          {isRtl ? "بدأنا من هنا." : "We’ll take it from here."}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-8 text-white/60">
          {isRtl
            ? "وصل طلبك إلى فريق MLAMH Casting. سنراجع الاحتياج قبل تقديم أي عرض أو نشر أي فرصة، وسنتواصل معك على بيانات التواصل المرسلة."
            : "Your request is now with the MLAMH Casting team. We will review the brief before any proposal or opportunity is published and contact you using the details you provided."}
        </p>
        {successId ? (
          <p className="mt-5 text-xs text-white/35">#{successId}</p>
        ) : null}
      </div>
    );
  }

  const inputClass =
    "min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50";

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <input name="company_website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "الاسم" : "Your name"} *</span>
          <input name="client_name" maxLength={120} required className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "الشركة / الجهة" : "Company / organization"}</span>
          <input name="company_name" maxLength={160} className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "البريد الإلكتروني" : "Email"}</span>
          <input name="contact_email" type="email" maxLength={180} className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "رقم التواصل" : "Contact number"}</span>
          <input name="contact_phone" type="tel" maxLength={50} className={inputClass} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs text-white/45">{isRtl ? "اسم المشروع" : "Project title"} *</span>
        <input name="project_title" maxLength={180} required className={inputClass} />
      </label>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "المواهب المطلوبة" : "Talent needed"} *</span>
          <select name="talent_type" required defaultValue="" className={inputClass}>
            <option value="" disabled>{isRtl ? "اختر" : "Select"}</option>
            <option value="actor">{isRtl ? "ممثلون" : "Actors"}</option>
            <option value="model">{isRtl ? "مودلز" : "Models"}</option>
            <option value="mixed">{isRtl ? "ممثلون ومودلز" : "Actors & Models"}</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "العدد التقريبي" : "Approx. count"}</span>
          <input name="required_count" type="number" min="1" max="1000" defaultValue="1" className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "المدينة" : "City"}</span>
          <input name="city" maxLength={100} className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-xs text-white/45">{isRtl ? "تاريخ العمل" : "Work date"}</span>
          <input name="work_date" type="date" className={inputClass} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-xs text-white/45">{isRtl ? "الميزانية أو نطاق الأجر" : "Budget or compensation range"}</span>
        <input
          name="budget"
          maxLength={100}
          placeholder={isRtl ? "مثال: 5,000 ريال أو حسب الاتفاق" : "Example: SAR 5,000 or negotiable"}
          className={inputClass}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs text-white/45">{isRtl ? "الـ Brief" : "Casting brief"} *</span>
        <textarea
          name="brief"
          maxLength={5000}
          required
          rows={8}
          placeholder={
            isRtl
              ? "اشرح نوع المشروع، الأدوار أو المواصفات المطلوبة، الاستخدام، مكان التصوير، المدة، وأي تفاصيل مهمة."
              : "Describe the project, roles or profiles needed, usage, location, duration, and any important details."
          }
          className={`${inputClass} py-4`}
        />
      </label>

      <p className="text-xs leading-6 text-white/35">
        {isRtl
          ? "إرسال الطلب لا يعني قبول المشروع أو وجود التزام مالي. نراجع الـ Brief أولًا ثم نحدد النطاق والخدمة المناسبة قبل البدء."
          : "Submitting a request does not create a booking or payment obligation. We review the brief first and confirm scope before work begins."}
      </p>

      {error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="min-h-14 rounded-xl bg-gold px-6 py-4 font-medium text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? isRtl ? "جاري الإرسال..." : "Submitting..."
          : isRtl ? "إرسال الـ Brief إلى MLAMH Casting" : "Send brief to MLAMH Casting"}
      </button>
    </form>
  );
}
