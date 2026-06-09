"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

const opportunityTypes = [
  { value: "model", ar: "مودل", en: "Model" },
  { value: "actor", ar: "ممثل / ممثلة", en: "Actor" },
  { value: "photographer", ar: "مصور / مصورة", en: "Photographer" },
  { value: "makeup_artist", ar: "خبير / خبيرة تجميل", en: "Makeup Artist" },
  { value: "content_creator", ar: "صانع / صانعة محتوى", en: "Content Creator" },
  { value: "voice_over", ar: "تعليق صوتي", en: "Voice Over" },
  { value: "other", ar: "أخرى", en: "Other" },
];

const opportunityStatuses = [
  { value: "draft", ar: "مسودة", en: "Draft" },
  { value: "open", ar: "مفتوحة", en: "Open" },
  { value: "published", ar: "منشورة", en: "Published" },
  { value: "closed", ar: "مغلقة", en: "Closed" },
  { value: "archived", ar: "مؤرشفة", en: "Archived" },
];

function normalizeBudget(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function resolveCityValue(opportunity: any) {
  const cityAr = String(opportunity.city_ar ?? "").trim();
  const cityEn = String(opportunity.city_en ?? "").trim();
  const city = String(opportunity.city ?? "").trim();

  const matched = saudiCities.find(
    (item) =>
      item.value === city ||
      item.value === cityAr ||
      item.value === cityEn ||
      item.ar === cityAr ||
      item.en === cityEn ||
      item.ar === city ||
      item.en === city
  );

  return matched?.value ?? cityEn ?? cityAr ?? city;
}

function getCityPayload(cityValue: string) {
  const matched = saudiCities.find((item) => item.value === cityValue);

  return {
    city_ar: matched?.ar ?? cityValue,
    city_en: matched?.en ?? cityValue,
  };
}

function formatOptionLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default function OpportunityEditForm({
  locale,
  isRtl,
  opportunity,
}: {
  locale: string;
  isRtl: boolean;
  opportunity: any;
}) {
  const router = useRouter();

  const initialCity = useMemo(() => resolveCityValue(opportunity), [opportunity]);

  const [title, setTitle] = useState(opportunity.title ?? "");
  const [description, setDescription] = useState(opportunity.description ?? "");
  const [city, setCity] = useState(initialCity);
  const [gender, setGender] = useState(opportunity.required_gender ?? "");
  const [type, setType] = useState(
    opportunityTypes.some((item) => item.value === opportunity.opportunity_type)
      ? opportunity.opportunity_type
      : "other"
  );
  const [typeOther, setTypeOther] = useState(
    opportunityTypes.some((item) => item.value === opportunity.opportunity_type)
      ? ""
      : opportunity.opportunity_type ?? ""
  );
  const [status, setStatus] = useState(opportunity.status ?? "draft");
  const [minAge, setMinAge] = useState(opportunity.min_age ?? "");
  const [maxAge, setMaxAge] = useState(opportunity.max_age ?? "");
  const [budget, setBudget] = useState(normalizeBudget(opportunity.budget));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectClass =
    "w-full appearance-none rounded-xl border border-white/10 bg-[#080808] px-4 py-4 text-white outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30";

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const cityPayload = getCityPayload(city);
    const finalOpportunityType = type === "other" ? typeOther.trim() : type;

    const payload = {
      id: opportunity.id,
      locale,
      title: title.trim(),
      description: description.trim(),
      city_ar: cityPayload.city_ar,
      city_en: cityPayload.city_en,
      required_gender: gender,
      opportunity_type: finalOpportunityType,
      status,
      min_age: minAge ? Number(minAge) : null,
      max_age: maxAge ? Number(maxAge) : null,
      budget: budget.replace(/,/g, "") || null,
    };

    try {
      const res = await fetch("/api/update-opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update opportunity");
      }

      setSuccess(isRtl ? "تم حفظ التعديلات بنجاح." : "Changes saved successfully.");
      router.refresh();

      setTimeout(() => {
        router.push(`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`);
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating opportunity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid gap-8 ${isRtl ? "text-right" : "text-left"}`}
    >
      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="mb-6 text-3xl font-light text-white">
          {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
        </h2>

        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
              {isRtl ? "عنوان الفرصة" : "Opportunity Title"}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRtl ? "عنوان الفرصة" : "Opportunity title"}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
              {isRtl ? "وصف الفرصة" : "Description"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRtl ? "وصف الفرصة" : "Opportunity description"}
              required
              className={`${inputClass} h-36 resize-none`}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "المدينة" : "City"}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">
                  {isRtl ? "اختر المدينة" : "Select city"}
                </option>
                {saudiCities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isRtl ? item.ar : item.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "حالة الفرصة" : "Opportunity Status"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className={selectClass}
              >
                {opportunityStatuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isRtl ? item.ar : item.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="mb-6 text-3xl font-light text-white">
          {isRtl ? "من تبحث عنه؟" : "Who are you looking for?"}
        </h2>

        <div className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "الجنس المطلوب" : "Required Gender"}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className={selectClass}
              >
                <option value="">
                  {isRtl ? "الجنس المطلوب" : "Required gender"}
                </option>
                <option value="any">{isRtl ? "أي جنس" : "Any"}</option>
                <option value="male">{isRtl ? "ذكر" : "Male"}</option>
                <option value="female">{isRtl ? "أنثى" : "Female"}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "نوع الفرصة" : "Opportunity Type"}
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (e.target.value !== "other") setTypeOther("");
                }}
                required
                className={selectClass}
              >
                {opportunityTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isRtl ? item.ar : item.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {type === "other" && (
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "نوع الفرصة المخصص" : "Custom Opportunity Type"}
              </label>
              <input
                value={typeOther}
                onChange={(e) => setTypeOther(e.target.value)}
                required
                placeholder={isRtl ? "حدد نوع الفرصة..." : "Specify the type..."}
                className={inputClass}
              />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "الحد الأدنى للعمر" : "Minimum Age"}
              </label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder={isRtl ? "مثال: 18" : "Example: 18"}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "الحد الأعلى للعمر" : "Maximum Age"}
              </label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                placeholder={isRtl ? "مثال: 35" : "Example: 35"}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="mb-6 text-3xl font-light text-white">
          {isRtl ? "الميزانية التقريبية" : "Estimated Budget"}
        </h2>

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
            onChange={(e) => setBudget(normalizeBudget(e.target.value))}
            placeholder={isRtl ? "مثال: 2,500" : "Example: 2,500"}
            className={`w-full rounded-xl border border-white/10 bg-black/30 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 ${
              isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
            }`}
          />
        </div>
      </section>

      {success ? (
        <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-4 text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? isRtl
              ? "جاري الحفظ..."
              : "Saving..."
            : isRtl
              ? "حفظ التعديلات"
              : "Save Changes"}
        </button>

        <Link
          href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`}
          className="flex-1 rounded-xl border border-white/10 px-6 py-4 text-center text-white/60 transition hover:border-white/40 hover:text-white"
        >
          {isRtl ? "إلغاء والعودة" : "Cancel and return"}
        </Link>
      </div>
    </form>
  );
}