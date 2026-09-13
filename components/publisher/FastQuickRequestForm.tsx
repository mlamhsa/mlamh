"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { parseQuickRequestText } from "@/lib/intelligence/opportunities/quick-request-parser";

type Draft = ReturnType<typeof parseQuickRequestText>["draft"];

type Props = {
  locale: "ar" | "en";
  isRtl: boolean;
  fallbackCity?: string | null;
};

function resolveCityValue(value?: string | null) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  const match = SAUDI_CITIES.find(
    (city) =>
      city.slug.toLowerCase() === normalized ||
      city.ar.toLowerCase() === normalized ||
      city.en.toLowerCase() === normalized,
  );
  return match?.slug ?? String(value ?? "").trim();
}

export default function FastQuickRequestForm({ locale, isRtl, fallbackCity }: Props) {
  const router = useRouter();
  const [requestText, setRequestText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const defaultCity = useMemo(() => resolveCityValue(fallbackCity), [fallbackCity]);

  function parseRequest() {
    setError("");
    const clean = requestText.trim();
    if (clean.length < 10) {
      setError(
        isRtl
          ? "اكتب احتياجك بشكل أوضح قليلًا، مثل: احتاج مودل بالرياض غدًا لتصوير منتجات."
          : "Please describe your need a little more clearly, e.g. I need a model in Riyadh tomorrow for a product shoot.",
      );
      return;
    }

    const parsed = parseQuickRequestText({
      text: clean,
      locale,
      fallbackCity: defaultCity,
    });

    setDraft({ ...parsed.draft, city: resolveCityValue(parsed.draft.city) });
    setFollowUp(parsed.needs_follow_up ? parsed.follow_up_question : null);
  }

  function setTalentType(value: "actor" | "model") {
    setDraft((current) => (current ? { ...current, opportunity_type: value } : current));
    setFollowUp(null);
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function submitRequest() {
    if (!draft) return;
    setError("");

    if (!draft.opportunity_type) {
      setFollowUp(
        isRtl ? "تبحث عن ممثل/ممثلة أم مودل؟" : "Are you looking for an actor or a model?",
      );
      return;
    }

    if (!draft.city) {
      setError(isRtl ? "اختر مدينة العمل." : "Choose the work city.");
      return;
    }

    if (!draft.title.trim() || !draft.description.trim()) {
      setError(isRtl ? "راجع عنوان الطلب ووصفه." : "Review the request title and description.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          posting_mode: "quick",
          title: draft.title.trim(),
          description: draft.description.trim(),
          city: draft.city,
          required_gender: draft.required_gender,
          min_age: null,
          max_age: null,
          compensation_type: draft.compensation_type,
          budget: draft.compensation_type === "fixed" ? draft.budget : null,
          opportunity_type: draft.opportunity_type,
          application_days: 3,
          required_count: draft.required_count,
          work_date: draft.work_date,
          work_time: draft.work_time,
          work_duration: draft.work_duration,
          role_requirements: {},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create request");

      router.push(
        `/${locale}/publisher-dashboard/opportunities?created=1&id=${data.opportunityId}`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRtl
            ? "تعذر إنشاء الطلب. حاول مرة أخرى."
            : "Unable to create the request. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <Link
            href={`/${locale}/publisher-dashboard`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 text-xs text-white/55 transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? "الرجوع للوحة الناشر" : "Back to publisher dashboard"}
          </Link>
        </div>

        <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-5 sm:p-8">
          <div className="inline-flex rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs text-gold">
            ⚡ {isRtl ? "طلب سريع" : "Quick request"}
          </div>
          <h1 className="mt-5 text-3xl font-light sm:text-5xl">
            {isRtl ? "وش تحتاج؟" : "What do you need?"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            {isRtl
              ? "اكتب طلبك مثل ما تكتبه في واتساب. ملامح يرتب التفاصيل لك قبل الإرسال."
              : "Write your request naturally, like a WhatsApp message. MLAMH will organize the details before submission."}
          </p>

          <textarea
            value={requestText}
            onChange={(event) => {
              setRequestText(event.target.value);
              setError("");
            }}
            rows={5}
            maxLength={1200}
            placeholder={
              isRtl
                ? "مثال: احتاج مودل بنت بالرياض بكرة لتصوير عبايات ساعتين، الميزانية 700 ريال"
                : "Example: I need a female model in Riyadh tomorrow for a 2-hour abaya shoot, budget SAR 700"
            }
            className="mt-7 w-full resize-none rounded-[1.5rem] border border-white/10 bg-black/60 p-5 text-base leading-8 text-white outline-none placeholder:text-white/25 focus:border-gold/45"
          />

          {!draft ? (
            <button
              type="button"
              onClick={parseRequest}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-black transition hover:opacity-90 sm:w-auto"
            >
              {isRtl ? "رتّب طلبي" : "Organize my request"}
            </button>
          ) : null}
        </section>

        {followUp && draft ? (
          <section className="mt-5 rounded-[1.75rem] border border-amber-400/20 bg-amber-400/[0.04] p-5 sm:p-6">
            <p className="text-xs text-amber-300">{isRtl ? "سؤال واحد فقط" : "One quick question"}</p>
            <h2 className="mt-2 text-xl font-light">{followUp}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTalentType("actor")} className="min-h-12 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white transition hover:border-gold/40 hover:text-gold">
                🎭 {isRtl ? "ممثل / ممثلة" : "Actor"}
              </button>
              <button type="button" onClick={() => setTalentType("model")} className="min-h-12 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white transition hover:border-gold/40 hover:text-gold">
                ◉ {isRtl ? "مودل" : "Model"}
              </button>
            </div>
          </section>
        ) : null}

        {draft && !followUp ? (
          <section className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-gold">{isRtl ? "راجع الطلب" : "Review request"}</p>
                <h2 className="mt-2 text-2xl font-light">{isRtl ? "هذه التفاصيل التي فهمناها" : "Here is what we understood"}</h2>
              </div>
              <button type="button" onClick={() => { setDraft(null); setFollowUp(null); }} className="text-xs text-white/45 transition hover:text-gold">
                {isRtl ? "تعديل النص من البداية" : "Edit original text"}
              </button>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Field label={isRtl ? "عنوان الطلب" : "Request title"}>
                <input value={draft.title} onChange={(e) => updateDraft("title", e.target.value)} maxLength={120} className="input" />
              </Field>

              <Field label={isRtl ? "نوع الموهبة" : "Talent type"}>
                <select value={draft.opportunity_type ?? ""} onChange={(e) => updateDraft("opportunity_type", e.target.value as "actor" | "model")} className="input">
                  <option value="actor">{isRtl ? "ممثل / ممثلة" : "Actor"}</option>
                  <option value="model">{isRtl ? "مودل" : "Model"}</option>
                </select>
              </Field>

              <Field label={isRtl ? "المدينة" : "City"}>
                <select value={draft.city} onChange={(e) => updateDraft("city", e.target.value)} className="input">
                  <option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>
                  {SAUDI_CITIES.map((city) => (
                    <option key={city.slug} value={city.slug}>{isRtl ? city.ar : city.en}</option>
                  ))}
                </select>
              </Field>

              <Field label={isRtl ? "الجنس المطلوب" : "Required gender"}>
                <select value={draft.required_gender} onChange={(e) => updateDraft("required_gender", e.target.value as Draft["required_gender"])} className="input">
                  <option value="any">{isRtl ? "الجميع" : "Any"}</option>
                  <option value="female">{isRtl ? "أنثى" : "Female"}</option>
                  <option value="male">{isRtl ? "ذكر" : "Male"}</option>
                </select>
              </Field>

              <Field label={isRtl ? "تاريخ العمل" : "Work date"}>
                <input type="date" value={draft.work_date ?? ""} onChange={(e) => updateDraft("work_date", e.target.value || null)} className="input" />
              </Field>

              <Field label={isRtl ? "المدة" : "Duration"}>
                <select value={draft.work_duration ?? ""} onChange={(e) => updateDraft("work_duration", e.target.value || null)} className="input">
                  <option value="">{isRtl ? "غير محددة" : "Not specified"}</option>
                  <option value="1_hour">{isRtl ? "ساعة" : "1 hour"}</option>
                  <option value="2_hours">{isRtl ? "ساعتان" : "2 hours"}</option>
                  <option value="4_hours">{isRtl ? "4 ساعات" : "4 hours"}</option>
                  <option value="full_day">{isRtl ? "يوم كامل" : "Full day"}</option>
                </select>
              </Field>

              <Field label={isRtl ? "المقابل" : "Compensation"}>
                <select value={draft.compensation_type} onChange={(e) => updateDraft("compensation_type", e.target.value as Draft["compensation_type"])} className="input">
                  <option value="fixed">{isRtl ? "مبلغ محدد" : "Fixed"}</option>
                  <option value="negotiable">{isRtl ? "حسب الاتفاق" : "Negotiable"}</option>
                  <option value="unpaid">{isRtl ? "غير مدفوع" : "Unpaid"}</option>
                </select>
              </Field>

              {draft.compensation_type === "fixed" ? (
                <Field label={isRtl ? "الميزانية (ريال)" : "Budget (SAR)"}>
                  <input inputMode="numeric" value={draft.budget ?? ""} onChange={(e) => updateDraft("budget", e.target.value.replace(/\D/g, ""))} className="input" />
                </Field>
              ) : null}

              <Field label={isRtl ? "العدد المطلوب" : "Required count"}>
                <input type="number" min={1} max={1000} value={draft.required_count} onChange={(e) => updateDraft("required_count", Math.max(1, Number(e.target.value) || 1))} className="input" />
              </Field>

              <div className="md:col-span-2">
                <Field label={isRtl ? "وصف الطلب" : "Request description"}>
                  <textarea value={draft.description} onChange={(e) => updateDraft("description", e.target.value)} rows={4} maxLength={2000} className="input min-h-28 resize-y py-3" />
                </Field>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/[0.07] bg-black/30 p-4 text-xs leading-6 text-white/40">
              {isRtl
                ? "سيتم إرسال الطلب للمراجعة وفق النظام الحالي قبل ظهوره للعامة. لا توجد أي رسوم في هذه المرحلة."
                : "The request will follow the current review process before becoming public. There is no publishing fee at this stage."}
            </div>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={submitRequest} disabled={loading} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-semibold text-black disabled:opacity-50">
                {loading ? (isRtl ? "جارٍ الإرسال..." : "Submitting...") : (isRtl ? "إرسال الطلب للمراجعة" : "Submit request for review")}
              </button>
              <button type="button" onClick={() => setDraft(null)} disabled={loading} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm text-white/55 transition hover:border-gold/30 hover:text-gold">
                {isRtl ? "تعديل النص" : "Edit text"}
              </button>
            </div>
          </section>
        ) : null}

        {!draft && error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <div className="mt-7 text-center">
          <Link href={`/${locale}/publisher-dashboard/opportunities/new?mode=project`} className="text-xs text-white/35 underline decoration-white/15 underline-offset-4 transition hover:text-gold">
            {isRtl ? "لدي مشروع / كاستينغ بتفاصيل أكبر" : "I have a larger project / casting call"}
          </Link>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          min-height: 3rem;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(0,0,0,.55);
          padding-left: 1rem;
          padding-right: 1rem;
          color: white;
          outline: none;
        }
        .input:focus { border-color: rgba(201,164,93,.55); }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-sm text-white/60">{label}</span>
      {children}
    </label>
  );
}
