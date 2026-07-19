"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { updateOpportunityAction } from "@/lib/actions/update-opportunity";

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

const publisherEditableStatuses = [
  { value: "draft", ar: "مسودة", en: "Draft" },
  { value: "pending_review", ar: "إرسال للمراجعة", en: "Submit for Review" },
  { value: "closed", ar: "مغلقة", en: "Closed" },
  { value: "archived", ar: "مؤرشفة", en: "Archived" },
];

const statusLabels: Record<string, { ar: string; en: string }> = {
  draft: { ar: "مسودة", en: "Draft" },
  pending_review: { ar: "قيد مراجعة الإدارة", en: "Pending Admin Review" },
  open: { ar: "مفتوحة", en: "Open" },
  published: { ar: "منشورة", en: "Published" },
  closed: { ar: "مغلقة", en: "Closed" },
  archived: { ar: "مؤرشفة", en: "Archived" },
  rejected: { ar: "مرفوضة", en: "Rejected" },
};

function normalizeBudget(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      item.en === city,
  );

  return matched?.value ?? (cityEn || cityAr || city);
}

function getCityPayload(cityValue: string) {
  const matched = saudiCities.find((item) => item.value === cityValue);
  return {
    city_ar: matched?.ar ?? cityValue,
    city_en: matched?.en ?? cityValue,
  };
}

function getCurrentStatusLabel(status: string, isRtl: boolean) {
  const label = statusLabels[status];
  if (label) return isRtl ? label.ar : label.en;
  return status.replaceAll("_", " ");
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
  const originalStatus = String(opportunity.status ?? "draft");

  const [title, setTitle] = useState(opportunity.title ?? "");
  const [description, setDescription] = useState(opportunity.description ?? "");
  const [city, setCity] = useState(initialCity);
  const [gender, setGender] = useState(opportunity.required_gender ?? "any");
  const [type, setType] = useState(
    opportunityTypes.some((item) => item.value === opportunity.opportunity_type)
      ? opportunity.opportunity_type
      : "other",
  );
  const [typeOther, setTypeOther] = useState(
    opportunityTypes.some((item) => item.value === opportunity.opportunity_type)
      ? ""
      : opportunity.opportunity_type ?? "",
  );

  const defaultEditableStatus = publisherEditableStatuses.some(
    (item) => item.value === originalStatus,
  )
    ? originalStatus
    : originalStatus === "open" || originalStatus === "published"
      ? originalStatus
      : "draft";

  const [status, setStatus] = useState(defaultEditableStatus);
  const [minAge, setMinAge] = useState(
    opportunity.min_age === null || opportunity.min_age === undefined
      ? ""
      : String(opportunity.min_age),
  );
  const [maxAge, setMaxAge] = useState(
    opportunity.max_age === null || opportunity.max_age === undefined
      ? ""
      : String(opportunity.max_age),
  );
  const [budget, setBudget] = useState(normalizeBudget(opportunity.budget));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isPublishedOrOpen = originalStatus === "published" || originalStatus === "open";

  const selectClass =
    "w-full appearance-none rounded-xl border border-white/10 bg-[#080808] px-4 py-4 text-white outline-none transition focus:border-gold/60 focus:ring-1 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50";

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50";

  const availableStatuses = isPublishedOrOpen
    ? [
        {
          value: originalStatus,
          ar: getCurrentStatusLabel(originalStatus, true),
          en: getCurrentStatusLabel(originalStatus, false),
        },
        ...publisherEditableStatuses.filter(
          (item) => item.value === "closed" || item.value === "archived",
        ),
      ]
    : publisherEditableStatuses;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedTypeOther = typeOther.trim();

    if (normalizedTitle.length < 3) {
      setError(
        isRtl
          ? "عنوان الفرصة يجب أن يتكون من 3 أحرف على الأقل."
          : "Opportunity title must contain at least 3 characters.",
      );
      setLoading(false);
      return;
    }

    if (normalizedDescription.length < 20) {
      setError(
        isRtl
          ? "يرجى كتابة وصف أوضح للفرصة لا يقل عن 20 حرفًا."
          : "Please enter a clearer description of at least 20 characters.",
      );
      setLoading(false);
      return;
    }

    if (!city) {
      setError(isRtl ? "يرجى اختيار المدينة." : "Please select a city.");
      setLoading(false);
      return;
    }

    if (!gender) {
      setError(
        isRtl ? "يرجى اختيار الجنس المطلوب." : "Please select the required gender.",
      );
      setLoading(false);
      return;
    }

    if (type === "other" && !normalizedTypeOther) {
      setError(
        isRtl
          ? "يرجى كتابة نوع الفرصة المخصص."
          : "Please enter the custom opportunity type.",
      );
      setLoading(false);
      return;
    }

    const minAgeNumber = minAge ? Number(minAge) : null;
    const maxAgeNumber = maxAge ? Number(maxAge) : null;

    if (
      minAgeNumber !== null &&
      (!Number.isInteger(minAgeNumber) || minAgeNumber < 1 || minAgeNumber > 100)
    ) {
      setError(
        isRtl
          ? "الحد الأدنى للعمر يجب أن يكون رقمًا صحيحًا بين 1 و100."
          : "Minimum age must be a whole number between 1 and 100.",
      );
      setLoading(false);
      return;
    }

    if (
      maxAgeNumber !== null &&
      (!Number.isInteger(maxAgeNumber) || maxAgeNumber < 1 || maxAgeNumber > 100)
    ) {
      setError(
        isRtl
          ? "الحد الأعلى للعمر يجب أن يكون رقمًا صحيحًا بين 1 و100."
          : "Maximum age must be a whole number between 1 and 100.",
      );
      setLoading(false);
      return;
    }

    if (
      minAgeNumber !== null &&
      maxAgeNumber !== null &&
      minAgeNumber > maxAgeNumber
    ) {
      setError(
        isRtl
          ? "العمر الأدنى لا يمكن أن يكون أكبر من العمر الأعلى."
          : "Minimum age cannot be greater than maximum age.",
      );
      setLoading(false);
      return;
    }

    const cityPayload = getCityPayload(city);
    const finalOpportunityType = type === "other" ? normalizedTypeOther : type;

    const payload = {
      id: opportunity.id,
      locale,
      title: normalizedTitle,
      description: normalizedDescription,
      city_ar: cityPayload.city_ar,
      city_en: cityPayload.city_en,
      required_gender: gender,
      opportunity_type: finalOpportunityType,
      status,
      min_age: minAgeNumber,
      max_age: maxAgeNumber,
      budget: budget.replace(/,/g, "") || null,
    };

    try {
      await updateOpportunityAction(payload);
      setSuccess(isRtl ? "تم حفظ التعديلات بنجاح." : "Changes saved successfully.");
      router.refresh();

      window.setTimeout(() => {
        router.push(`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`);
      }, 1200);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : isRtl
            ? "تعذر تحديث الفرصة. يرجى المحاولة مرة أخرى."
            : "Unable to update the opportunity. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`grid gap-8 ${isRtl ? "text-right" : "text-left"}`}
    >
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-white/40">
            {isRtl ? "الحالة الحالية" : "Current Status"}
          </p>
          <p className="mt-3 text-lg font-light text-white">
            {getCurrentStatusLabel(originalStatus, isRtl)}
          </p>
        </div>

        {isPublishedOrOpen ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 text-amber-200">
            <p className="font-medium">
              {isRtl ? "تنبيه قبل حفظ التعديلات" : "Review notice"}
            </p>
            <p className="mt-2 text-sm leading-7 text-amber-100/70">
              {isRtl
                ? "قد تتطلب التعديلات الجوهرية مراجعة الإدارة قبل استمرار ظهور الفرصة للعامة."
                : "Major edits may require admin review before the opportunity continues to appear publicly."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-white/45">
            <p className="text-sm leading-7">
              {isRtl
                ? "يمكنك حفظ الفرصة كمسودة أو إرسالها إلى الإدارة للمراجعة."
                : "You may save the opportunity as a draft or submit it for admin review."}
            </p>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <h2 className="mb-6 text-3xl font-light text-white">
          {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
        </h2>

        <div className="grid gap-5">
          <div>
            <label htmlFor="opportunity-title" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
              {isRtl ? "عنوان الفرصة" : "Opportunity Title"}
            </label>
            <input
              id="opportunity-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={isRtl ? "عنوان الفرصة" : "Opportunity title"}
              required
              minLength={3}
              maxLength={120}
              disabled={loading}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-white/30">{title.trim().length}/120</p>
          </div>

          <div>
            <label htmlFor="opportunity-description" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
              {isRtl ? "وصف الفرصة" : "Description"}
            </label>
            <textarea
              id="opportunity-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={isRtl ? "وصف الفرصة" : "Opportunity description"}
              required
              minLength={20}
              maxLength={3000}
              disabled={loading}
              className={`${inputClass} min-h-40 resize-y`}
            />
            <p className="mt-2 text-xs text-white/30">{description.trim().length}/3000</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="opportunity-city" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "المدينة" : "City"}
              </label>
              <select
                id="opportunity-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                disabled={loading}
                className={selectClass}
              >
                <option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>
                {saudiCities.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isRtl ? item.ar : item.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="opportunity-status" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "حالة الفرصة" : "Opportunity Status"}
              </label>
              <select
                id="opportunity-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                required
                disabled={loading}
                className={selectClass}
              >
                {availableStatuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isRtl ? item.ar : item.en}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-6 text-white/30">
                {isRtl
                  ? "النشر العام يعتمد على مراجعة الإدارة. يمكنك الإغلاق أو الأرشفة عند الحاجة."
                  : "Public publishing depends on admin review. You may close or archive the opportunity when needed."}
              </p>
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
              <label htmlFor="required-gender" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "الجنس المطلوب" : "Required Gender"}
              </label>
              <select
                id="required-gender"
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                required
                disabled={loading}
                className={selectClass}
              >
                <option value="any">{isRtl ? "أي جنس" : "Any"}</option>
                <option value="male">{isRtl ? "ذكر" : "Male"}</option>
                <option value="female">{isRtl ? "أنثى" : "Female"}</option>
              </select>
            </div>

            <div>
              <label htmlFor="opportunity-type" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "نوع الفرصة" : "Opportunity Type"}
              </label>
              <select
                id="opportunity-type"
                value={type}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setType(nextType);
                  if (nextType !== "other") setTypeOther("");
                }}
                required
                disabled={loading}
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

          {type === "other" ? (
            <div>
              <label htmlFor="custom-opportunity-type" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "نوع الفرصة المخصص" : "Custom Opportunity Type"}
              </label>
              <input
                id="custom-opportunity-type"
                value={typeOther}
                onChange={(event) => setTypeOther(event.target.value)}
                required
                disabled={loading}
                maxLength={80}
                placeholder={isRtl ? "حدد نوع الفرصة..." : "Specify the type..."}
                className={inputClass}
              />
            </div>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="minimum-age" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "الحد الأدنى للعمر" : "Minimum Age"}
              </label>
              <input
                id="minimum-age"
                type="number"
                min={1}
                max={100}
                step={1}
                value={minAge}
                onChange={(event) => setMinAge(event.target.value)}
                placeholder={isRtl ? "مثال: 18" : "Example: 18"}
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="maximum-age" className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
                {isRtl ? "الحد الأعلى للعمر" : "Maximum Age"}
              </label>
              <input
                id="maximum-age"
                type="number"
                min={1}
                max={100}
                step={1}
                value={maxAge}
                onChange={(event) => setMaxAge(event.target.value)}
                placeholder={isRtl ? "مثال: 35" : "Example: 35"}
                disabled={loading}
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
            id="opportunity-budget"
            type="text"
            inputMode="numeric"
            value={budget}
            onChange={(event) => setBudget(normalizeBudget(event.target.value))}
            placeholder={isRtl ? "مثال: 2,500" : "Example: 2,500"}
            disabled={loading}
            className={`w-full rounded-xl border border-white/10 bg-black/30 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50 ${
              isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
            }`}
          />
        </div>
      </section>

      {success ? (
        <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/85 p-3 shadow-2xl backdrop-blur sm:flex-row">
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
          aria-disabled={loading}
          className={`flex-1 rounded-xl border border-white/10 px-6 py-4 text-center text-white/60 transition hover:border-white/40 hover:text-white ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {isRtl ? "إلغاء والعودة" : "Cancel and return"}
        </Link>
      </div>
    </form>
  );
}
