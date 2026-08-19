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
  needs_changes: { ar: "تحتاج تعديل", en: "Needs Changes" },
  open: { ar: "مفتوحة", en: "Open" },
  published: { ar: "منشورة", en: "Published" },
  closed: { ar: "مغلقة", en: "Closed" },
  archived: { ar: "مؤرشفة", en: "Archived" },
  rejected: { ar: "مرفوضة", en: "Rejected" },
};

type OpportunityFormData = {
  id: number;
  title: string | null;
  description: string | null;
  city: string | null;
  city_ar: string | null;
  city_en: string | null;
  required_gender: string | null;
  opportunity_type: string | null;
  status: string | null;
  min_age: number | null;
  max_age: number | null;
  compensation_type?: "fixed" | "negotiable" | "unpaid" | null;
budget: number | string | null;
application_days: number | null;
  application_start_date?: string | null;
  application_deadline?: string | null;
};

function normalizeBudget(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function resolveCityValue(opportunity: OpportunityFormData) {
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
  opportunity: OpportunityFormData;
}) {
  const router = useRouter();
  const initialCity = useMemo(
    () => resolveCityValue(opportunity),
    [opportunity],
  );
  const originalStatus = String(opportunity.status ?? "draft");

  const [title, setTitle] = useState(String(opportunity.title ?? ""));
  const [description, setDescription] = useState(String(opportunity.description ?? ""));
  const [city, setCity] = useState(initialCity);
  const [gender, setGender] = useState(opportunity.required_gender ?? "any");
  const [type, setType] = useState<string>(
    opportunityTypes.some(
      (item) => item.value === opportunity.opportunity_type,
    )
      ? (opportunity.opportunity_type ?? "")
      : "other",
  );
  const [typeOther, setTypeOther] = useState(
    opportunityTypes.some((item) => item.value === opportunity.opportunity_type)
      ? ""
      : opportunity.opportunity_type ?? "",
  );

  const isNeedsChanges = originalStatus === "needs_changes";

const defaultEditableStatus = isNeedsChanges
  ? "pending_review"
  : publisherEditableStatuses.some(
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
    opportunity.max_age === null ||
    opportunity.max_age === undefined
      ? ""
      : String(opportunity.max_age),
  );
  
  const [compensationType, setCompensationType] = useState<
  "fixed" | "negotiable" | "unpaid"
>(
  opportunity.compensation_type === "negotiable" ||
    opportunity.compensation_type === "unpaid"
    ? opportunity.compensation_type
    : "fixed",
);

  const [budget, setBudget] = useState(
    normalizeBudget(opportunity.budget),
  );
  
  const [applicationDays, setApplicationDays] =
    useState(
      opportunity.application_days
        ? String(opportunity.application_days)
        : "30",
    );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isPublishedOrOpen =
    originalStatus === "published" || originalStatus === "open";

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
    const applicationDaysNumber =
    Number(applicationDays);
  
  if (
    !Number.isInteger(applicationDaysNumber) ||
    applicationDaysNumber < 1 ||
    applicationDaysNumber > 90
  ) {
    setError(
      isRtl
        ? "مدة استقبال الطلبات يجب أن تكون بين يوم واحد و90 يومًا."
        : "The application period must be between 1 and 90 days.",
    );
  
    setLoading(false);
    return;
  }

    if (
      minAgeNumber !== null &&
      (!Number.isInteger(minAgeNumber) || minAgeNumber < 0 || minAgeNumber > 100)
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
      (!Number.isInteger(maxAgeNumber) || maxAgeNumber < 0 || maxAgeNumber > 100)
    ) {
      setError(
        isRtl
          ? "الحد الأعلى للعمر يجب أن يكون رقمًا صحيحًا بين 0 و100."
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
    const finalOpportunityType: string =
  type === "other"
    ? normalizedTypeOther
    : type;
    const normalizedBudget =
    compensationType === "fixed"
      ? budget.replace(/,/g, "")
      : null;
  
  if (
    compensationType === "fixed" &&
    (!normalizedBudget || Number(normalizedBudget) <= 0)
  ) {
    setError(
      isRtl
        ? "يرجى إدخال مبلغ صحيح للمقابل المالي."
        : "Please enter a valid compensation amount.",
    );
  
    setLoading(false);
    return;
  }

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

compensation_type: compensationType,
budget: normalizedBudget,

application_days: applicationDaysNumber,
    };

    try {
      await updateOpportunityAction(payload);

const result =
  status === "pending_review"
    ? "submitted"
    : "saved";

router.push(
  `/${locale}/publisher-dashboard/opportunities/${opportunity.id}?result=${result}`,
);
router.refresh();
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
          <p className="arabic-safe text-xs uppercase tracking-[0.22em] text-white/40">
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
            <label htmlFor="opportunity-title" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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
            <label htmlFor="opportunity-description" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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
              <label htmlFor="opportunity-city" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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
              <label htmlFor="opportunity-status" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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
              <label htmlFor="required-gender" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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
              <label htmlFor="opportunity-type" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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
              <label htmlFor="custom-opportunity-type" className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40">
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

<div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
  <div className="mb-4">
    <p className="text-sm font-medium text-white">
      {isRtl ? "الفئة العمرية" : "Age Group"}
    </p>

    <p className="mt-1 text-xs leading-6 text-white/40">
      {isRtl
        ? "حدد الأعمار المناسبة للفرصة، بما في ذلك فرص الأطفال."
        : "Select suitable ages, including opportunities for children."}
    </p>
  </div>

  <div className="grid gap-3 lg:grid-cols-3">
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setMinAge("");
        setMaxAge("");
      }}
      className={`rounded-2xl border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50 ${
        minAge === "" && maxAge === ""
          ? "border-gold/50 bg-gold/[0.08] text-gold"
          : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
      }`}
    >
      <span className="block text-sm font-medium">
        {isRtl ? "جميع الأعمار" : "All Ages"}
      </span>

      <span className="mt-2 block text-xs leading-6 opacity-60">
        {isRtl
          ? "للأدوار التي لا تحتاج إلى عمر محدد."
          : "For roles with no specific age restriction."}
      </span>
    </button>

    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setMinAge("18");
        setMaxAge("");
      }}
      className={`rounded-2xl border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50 ${
        minAge === "18" && maxAge === ""
          ? "border-gold/50 bg-gold/[0.08] text-gold"
          : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
      }`}
    >
      <span className="block text-sm font-medium">
        {isRtl ? "للبالغين فقط" : "Adults Only"}
      </span>

      <span className="mt-2 block text-xs leading-6 opacity-60">
        {isRtl
          ? "للمتقدمين من عمر 18 سنة فأكثر."
          : "For applicants aged 18 and above."}
      </span>
    </button>

    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setMinAge("0");
        setMaxAge("12");
    }}
      className={`rounded-2xl border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50 ${
        (minAge !== "" || maxAge !== "") &&
        !(minAge === "18" && maxAge === "")
          ? "border-gold/50 bg-gold/[0.08] text-gold"
          : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
      }`}
    >
      <span className="block text-sm font-medium">
        {isRtl ? "نطاق عمر محدد" : "Specific Age Range"}
      </span>

      <span className="mt-2 block text-xs leading-6 opacity-60">
        {isRtl
          ? "للأطفال أو المراهقين أو أي نطاق محدد."
          : "For children, teenagers, or another range."}
      </span>
    </button>
  </div>

  {(minAge !== "" || maxAge !== "") &&
  !(minAge === "18" && maxAge === "") ? (
    <div className="mt-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="minimum-age"
            className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40"
          >
            {isRtl ? "الحد الأدنى للعمر" : "Minimum Age"}
          </label>

          <input
            id="minimum-age"
            type="number"
            min={0}
            max={100}
            step={1}
            value={minAge}
            onChange={(event) =>
              setMinAge(event.target.value)
            }
            placeholder={isRtl ? "مثال: 5" : "Example: 5"}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="maximum-age"
            className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40"
          >
            {isRtl ? "الحد الأعلى للعمر" : "Maximum Age"}
          </label>

          <input
            id="maximum-age"
            type="number"
            min={0}
            max={100}
            step={1}
            value={maxAge}
            onChange={(event) =>
              setMaxAge(event.target.value)
            }
            placeholder={isRtl ? "مثال: 12" : "Example: 12"}
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      {minAge && maxAge ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            Number(minAge) <= Number(maxAge)
              ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
              : "border-red-400/20 bg-red-400/[0.07] text-red-300"
          }`}
        >
          {Number(minAge) <= Number(maxAge)
            ? isRtl
              ? `تشمل هذه الفرصة الأعمار من ${minAge} إلى ${maxAge} سنة.`
              : `This opportunity includes ages ${minAge} to ${maxAge}.`
            : isRtl
              ? "الحد الأدنى للعمر يجب ألا يكون أكبر من الحد الأعلى."
              : "Minimum age cannot be greater than maximum age."}
        </div>
      ) : null}
    </div>
  ) : null}
</div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
  <div className="mb-6">
    <p className="text-xs uppercase tracking-[0.3em] text-gold">
      {isRtl ? "المقابل المالي" : "Compensation"}
    </p>

    <h2 className="mt-3 text-3xl font-light text-white">
      {isRtl
        ? "ما نوع المقابل لهذه الفرصة؟"
        : "How is this opportunity compensated?"}
    </h2>
  </div>

  <div className="grid gap-3 md:grid-cols-3">
    {[
      {
        value: "fixed" as const,
        ar: "مبلغ محدد",
        en: "Fixed Amount",
      },
      {
        value: "negotiable" as const,
        ar: "حسب الاتفاق",
        en: "Negotiable",
      },
      {
        value: "unpaid" as const,
        ar: "غير مدفوع",
        en: "Unpaid",
      },
    ].map((option) => {
      const selected = compensationType === option.value;

      return (
        <button
          key={option.value}
          type="button"
          disabled={loading}
          onClick={() => {
            setCompensationType(option.value);
          }}
          className={`rounded-2xl border p-4 text-start transition disabled:cursor-not-allowed disabled:opacity-50 ${
            selected
              ? "border-gold/50 bg-gold/[0.08] text-gold"
              : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
          }`}
        >
          <span className="block text-sm font-medium">
            {isRtl ? option.ar : option.en}
          </span>
        </button>
      );
    })}
  </div>

  {compensationType === "fixed" ? (
    <div className="mt-5">
      <label
        htmlFor="opportunity-budget"
        className="arabic-safe mb-2 block text-xs uppercase tracking-[0.22em] text-white/40"
      >
        {isRtl ? "المبلغ" : "Amount"}
      </label>

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
          onChange={(event) =>
            setBudget(normalizeBudget(event.target.value))
          }
          placeholder={isRtl ? "مثال: 2,500" : "Example: 2,500"}
          disabled={loading}
          className={`w-full rounded-xl border border-white/10 bg-black/30 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-50 ${
            isRtl
              ? "pr-12 pl-4 text-right"
              : "pl-12 pr-4 text-left"
          }`}
        />
      </div>
    </div>
  ) : null}
</section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6 md:p-8">
  <div className="mb-6">
    <p className="text-xs uppercase tracking-[0.3em] text-gold">
      {isRtl ? "مدة استقبال الطلبات" : "Application Period"}
    </p>

    <h2 className="mt-3 text-3xl font-light text-white">
      {isRtl
        ? "كم يوم تستمر الفرصة؟"
        : "How long should applications remain open?"}
    </h2>

    <p className="mt-3 text-sm leading-7 text-white/40">
      {isPublishedOrOpen
        ? isRtl
          ? "الفرصة منشورة حاليًا. تغيير عدد الأيام لا يعيد تاريخ البداية تلقائيًا، وسيتم التعامل مع تاريخ الإغلاق وفق حالة الفرصة."
          : "This opportunity is currently published. Changing the duration does not automatically restart the application period."
        : isRtl
          ? "يبدأ احتساب المدة بعد موافقة الإدارة على نشر الفرصة."
          : "The application period begins after admin approval."}
    </p>
  </div>

  <div className="grid gap-4">
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.22em] text-white/40">
        {isRtl ? "عدد الأيام" : "Number of Days"}
      </span>

      <input
        type="number"
        min={1}
        max={90}
        step={1}
        value={applicationDays}
        onChange={(event) =>
          setApplicationDays(event.target.value)
        }
        placeholder={isRtl ? "مثال: 30" : "Example: 30"}
        disabled={loading}
        className={inputClass}
      />
    </label>

    <div className="flex flex-wrap gap-2">
      {[7, 14, 30].map((days) => {
        const selected =
          applicationDays === String(days);

        return (
          <button
            key={days}
            type="button"
            disabled={loading}
            onClick={() =>
              setApplicationDays(String(days))
            }
            className={`rounded-full border px-4 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-gold/50 bg-gold/[0.1] text-gold"
                : "border-white/10 text-white/55 hover:border-gold/35 hover:text-gold"
            }`}
          >
            {isRtl
              ? `${days} يوم`
              : `${days} Days`}
          </button>
        );
      })}
    </div>

    <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] px-4 py-3 text-sm leading-7 text-emerald-200/80">
      {isRtl
        ? `مدة استقبال الطلبات المحددة: ${applicationDays || "—"} يومًا.`
        : `Selected application period: ${applicationDays || "—"} days.`}
    </div>
  </div>
</section>

      {success ? (
        <p role="status" aria-live="polite" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      {error ? (
        <p role="alert" aria-live="assertive" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/85 p-3 shadow-2xl backdrop-blur sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
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
