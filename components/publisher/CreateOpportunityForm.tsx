"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const saudiCities = [
  { value: "riyadh", ar: "الرياض", en: "Riyadh" },
  { value: "jeddah", ar: "جدة", en: "Jeddah" },
  { value: "makkah", ar: "مكة", en: "Makkah" },
  { value: "madinah", ar: "المدينة المنورة", en: "Madinah" },
  { value: "dammam", ar: "الدمام", en: "Dammam" },
  { value: "khobar", ar: "الخبر", en: "Khobar" },
  { value: "dhahran", ar: "الظهران", en: "Dhahran" },
  { value: "taif", ar: "الطائف", en: "Taif" },
  { value: "abha", ar: "أبها", en: "Abha" },
  { value: "khamis_mushait", ar: "خميس مشيط", en: "Khamis Mushait" },
  { value: "tabuk", ar: "تبوك", en: "Tabuk" },
  { value: "hail", ar: "حائل", en: "Hail" },
  { value: "qassim", ar: "القصيم", en: "Qassim" },
  { value: "buraidah", ar: "بريدة", en: "Buraidah" },
  { value: "unayzah", ar: "عنيزة", en: "Unaizah" },
  { value: "jazan", ar: "جازان", en: "Jazan" },
  { value: "najran", ar: "نجران", en: "Najran" },
  { value: "al_ahsa", ar: "الأحساء", en: "Al Ahsa" },
  { value: "jubail", ar: "الجبيل", en: "Jubail" },
  { value: "yanbu", ar: "ينبع", en: "Yanbu" },
];

function formatBudgetInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function CreateOpportunityForm({
  locale,
  isRtl,
}: {
  locale: string;
  isRtl: boolean;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState("");
  const [typeOther, setTypeOther] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleBudgetChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBudget(formatBudgetInput(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const selectedCity = saudiCities.find((item) => item.value === city);
    const finalCity = selectedCity
      ? isRtl
        ? selectedCity.ar
        : selectedCity.en
      : city;

    const finalOpportunityType = type === "other" ? typeOther.trim() : type;

    if (!finalOpportunityType) {
      setError(
        isRtl
          ? "يرجى تحديد نوع الفرصة."
          : "Please select the opportunity type."
      );
      setLoading(false);
      return;
    }

    if (!finalCity) {
      setError(isRtl ? "يرجى اختيار المدينة." : "Please select the city.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/create-opportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          title: title.trim(),
          description: description.trim(),
          city: finalCity,
          gender,
          min_age: minAge || null,
          max_age: maxAge || null,
          budget: budget.replace(/,/g, "") || null,
          opportunity_type: finalOpportunityType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create opportunity");
      }

      router.push(`/${locale}/publisher-dashboard`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRtl
            ? "حدث خطأ أثناء إنشاء الفرصة."
            : "Failed to create opportunity."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/publisher-dashboard`}
            className="inline-flex items-center border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/50 hover:text-gold"
          >
            {isRtl ? "الرجوع للوحة الناشر" : "Back to Publisher Dashboard"}
          </Link>

          <Link
            href={`/${locale}/opportunities`}
            className="hidden border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-white/40 transition hover:border-white/40 hover:text-white md:inline-flex"
          >
            {isRtl ? "عرض الفرص العامة" : "Public Opportunities"}
          </Link>
        </div>

        <div className="mb-12 grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
          <section className={isRtl ? "text-right" : "text-left"}>
            <p className="text-xs uppercase tracking-[0.4em] text-gold">
              MLAMH Opportunities
            </p>

            <h1 className="mt-5 text-5xl font-light leading-tight md:text-7xl">
              {isRtl ? "إنشاء فرصة جديدة" : "Create New Opportunity"}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50">
              {isRtl
                ? "أضف تفاصيل واضحة للفرصة حتى يتمكن أصحاب المواهب المناسبون من فهم المتطلبات والتقديم بثقة."
                : "Add clear opportunity details so suitable talents can understand the requirements and apply with confidence."}
            </p>
          </section>

          <aside className="rounded-[2rem] border border-gold/20 bg-gold/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "قبل النشر" : "Before publishing"}
            </p>

            <ul className="mt-5 space-y-3 text-sm leading-7 text-white/55">
              <li>
                {isRtl
                  ? "اكتب عنوانًا واضحًا ومباشرًا."
                  : "Use a clear and direct title."}
              </li>
              <li>
                {isRtl
                  ? "حدد نوع الموهبة المطلوبة بدقة."
                  : "Select the required talent type accurately."}
              </li>
              <li>
                {isRtl
                  ? "اختر المدينة من القائمة لتسهيل الفلترة."
                  : "Select the city from the list for better filtering."}
              </li>
              <li>
                {isRtl
                  ? "أضف ميزانية تقريبية إن وجدت."
                  : "Add an estimated budget if available."}
              </li>
            </ul>

            <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-white/35">
              {isRtl
                ? "الناشر مسؤول عن دقة تفاصيل الفرصة والتواصل مع المتقدمين بشكل مهني."
                : "The publisher is responsible for the accuracy of the opportunity details and professional communication with applicants."}
            </p>
          </aside>
        </div>

        <form
          onSubmit={handleSubmit}
          className={isRtl ? "grid gap-8 text-right" : "grid gap-8 text-left"}
        >
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isRtl ? "المعلومات الأساسية" : "Basic Information"}
              </p>
              <h2 className="mt-3 text-3xl font-light">
                {isRtl ? "ما هي الفرصة؟" : "What is the opportunity?"}
              </h2>
            </div>

            <div className="grid gap-5">
            <input
  value={title}
  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
  maxLength={80}
  placeholder={isRtl ? "عنوان الفرصة" : "Opportunity title"}
  className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
  required
/>

<p className="text-xs text-white/40 text-end">
  {title.length}/80
</p>

<textarea
  value={description}
  onChange={(e) =>
    setDescription(e.target.value.slice(0, 2000))
  }
  maxLength={2000}
  placeholder={
    isRtl
      ? "وصف الفرصة، المهام، مدة العمل، وأي تفاصيل مهمة"
      : "Opportunity description, tasks, duration, and important details"
  }
  className="h-36 rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
  required
/>

<p className="text-xs text-white/40 text-end">
  {description.length}/2000
</p>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition focus:border-gold/50"
                required
              >
                <option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>
                {saudiCities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isRtl ? item.ar : item.en}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isRtl ? "المتطلبات" : "Requirements"}
              </p>
              <h2 className="mt-3 text-3xl font-light">
                {isRtl ? "من تبحث عنه؟" : "Who are you looking for?"}
              </h2>
            </div>

            <div className="grid gap-5">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition focus:border-gold/50"
                required
              >
                <option value="">
                  {isRtl ? "الجنس المطلوب" : "Required gender"}
                </option>
                <option value="any">{isRtl ? "أي جنس" : "Any"}</option>
                <option value="male">{isRtl ? "ذكر" : "Male"}</option>
                <option value="female">{isRtl ? "أنثى" : "Female"}</option>
              </select>

              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (e.target.value !== "other") setTypeOther("");
                }}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition focus:border-gold/50"
                required
              >
                <option value="">
                  {isRtl ? "نوع الفرصة" : "Opportunity type"}
                </option>
                <option value="model">{isRtl ? "مودل" : "Model"}</option>
                <option value="actor">
                  {isRtl ? "ممثل / ممثلة" : "Actor"}
                </option>
                <option value="photographer">
                  {isRtl ? "مصور / مصورة" : "Photographer"}
                </option>
                <option value="makeup_artist">
                  {isRtl ? "خبير / خبيرة تجميل" : "Makeup Artist"}
                </option>
                <option value="content_creator">
                  {isRtl ? "صانع / صانعة محتوى" : "Content Creator"}
                </option>
                <option value="voice_over">
                  {isRtl ? "تعليق صوتي" : "Voice Over"}
                </option>
                <option value="other">{isRtl ? "أخرى" : "Other"}</option>
              </select>

              {type === "other" && (
                <input
                  value={typeOther}
                  onChange={(e) => setTypeOther(e.target.value)}
                  placeholder={
                    isRtl
                      ? "اكتب نوع الفرصة، مثال: مقدم فعالية، عارض منتج..."
                      : "Specify the type, e.g. event host, product presenter..."
                  }
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
                  required
                />
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder={isRtl ? "الحد الأدنى للعمر" : "Minimum age"}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
                />

                <input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  placeholder={isRtl ? "الحد الأعلى للعمر" : "Maximum age"}
                  className="rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isRtl ? "الميزانية" : "Budget"}
              </p>
              <h2 className="mt-3 text-3xl font-light">
                {isRtl
                  ? "ما الميزانية التقريبية؟"
                  : "What is the estimated budget?"}
              </h2>
            </div>

            <div className="relative">
              <span
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-lg text-white/55 ${
                  isRtl ? "right-4" : "left-4"
                }`}
              >
                ﷼
              </span>

              <input
                type="text"
                inputMode="numeric"
                value={budget}
                onChange={handleBudgetChange}
                placeholder={isRtl ? "مثال: 2,500" : "Example: 2,500"}
                className={`w-full rounded-xl border border-white/10 bg-black/30 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50 ${
                  isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
                }`}
              />
            </div>
          </section>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-4 text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? isRtl
                  ? "جاري الإنشاء..."
                  : "Creating..."
                : isRtl
                  ? "إنشاء الفرصة"
                  : "Create Opportunity"}
            </button>

            <Link
              href={`/${locale}/publisher-dashboard`}
              className="flex-1 rounded-xl border border-white/10 px-6 py-4 text-center text-white/60 transition hover:border-white/40 hover:text-white"
            >
              {isRtl ? "إلغاء والعودة للوحة" : "Cancel and return"}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}