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

const actorLanguageOptions = [
  { value: "arabic", ar: "العربية", en: "Arabic" },
  { value: "english", ar: "الإنجليزية", en: "English" },
  { value: "french", ar: "الفرنسية", en: "French" },
];

const actorDialectOptions = [
  { value: "najdi", ar: "نجدي", en: "Najdi" },
  { value: "hejazi", ar: "حجازي", en: "Hejazi" },
  { value: "southern", ar: "جنوبي", en: "Southern" },
  { value: "northern", ar: "شمالي", en: "Northern" },
  { value: "gulf", ar: "خليجي", en: "Gulf" },
];

const modelingTypeOptions = [
  { value: "commercial", ar: "إعلاني", en: "Commercial" },
  { value: "fashion", ar: "أزياء", en: "Fashion" },
  { value: "beauty", ar: "جمال", en: "Beauty" },
  { value: "lifestyle", ar: "لايف ستايل", en: "Lifestyle" },
  { value: "ecommerce", ar: "متاجر إلكترونية", en: "E-commerce" },
];

const hairColorOptions = [
  { value: "black", ar: "أسود", en: "Black" },
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "blonde", ar: "أشقر", en: "Blonde" },
  { value: "red", ar: "أحمر", en: "Red" },
  { value: "gray", ar: "رمادي", en: "Gray" },
  { value: "other", ar: "أخرى", en: "Other" },
];

type AgeMode = "all" | "adults" | "range";
type TalentType = "actor" | "model" | "";
type PostingMode = "quick" | "project" | "";

type CompensationType =
  | "fixed"
  | "negotiable"
  | "unpaid";

function formatBudgetInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function updateDatePart(
  currentDate: string,
  part: "day" | "month" | "year",
  value: string,
) {
  const today = new Date();

  let year = currentDate
    ? currentDate.split("-")[0]
    : String(today.getFullYear());

  let month = currentDate
    ? currentDate.split("-")[1]
    : String(today.getMonth() + 1).padStart(2, "0");

  let day = currentDate
    ? currentDate.split("-")[2]
    : String(today.getDate()).padStart(2, "0");

  if (part === "year") year = value;
  if (part === "month") month = value;
  if (part === "day") day = value;

  return `${year}-${month}-${day}`;
}

export default function CreateOpportunityForm({
  locale,
  isRtl,
}: {
  locale: string;
  isRtl: boolean;
}) {
  const router = useRouter();

  const [postingMode, setPostingMode] =
  useState<PostingMode>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [type, setType] = useState<TalentType>("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [ageMode, setAgeMode] = useState<AgeMode>("all");
  const [budget, setBudget] = useState("");
  const [compensationType, setCompensationType] =
  useState<CompensationType>("fixed");
  const [applicationDays, setApplicationDays] = useState("30");

  const [requiredCount, setRequiredCount] = useState("1");
  const [workDate, setWorkDate] = useState("");
  const [workDateMode, setWorkDateMode] =
  useState<"" | "today" | "tomorrow" | "flexible">("");
  const [workTime, setWorkTime] = useState("");
  const [workDuration, setWorkDuration] = useState("");

  const [actorLanguages, setActorLanguages] = useState<string[]>([]);
  const [actorDialects, setActorDialects] = useState<string[]>([]);

  const [modelingTypes, setModelingTypes] = useState<string[]>([]);
  const [minHeightCm, setMinHeightCm] = useState("");
  const [hairColor, setHairColor] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleBudgetChange(e: React.ChangeEvent<HTMLInputElement>) {
    setBudget(formatBudgetInput(e.target.value));
  }

  function toggleArrayValue(
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!postingMode) {
      setError(
        isRtl
          ? "يرجى اختيار نوع الفرصة أولًا."
          : "Please choose the opportunity format first.",
      );
      setLoading(false);
      return;
    }

    if (!type) {
      setError(
        isRtl
          ? "يرجى اختيار نوع الموهبة المطلوبة."
          : "Please select the required talent type.",
      );
      setLoading(false);
      return;
    }

    const selectedCity = saudiCities.find((item) => item.value === city);

    const finalCity = selectedCity
      ? isRtl
        ? selectedCity.ar
        : selectedCity.en
      : city;

    if (!finalCity) {
      setError(isRtl ? "يرجى اختيار المدينة." : "Please select the city.");
      setLoading(false);
      return;
    }

    const parsedRequiredCount = Number(requiredCount);

    if (
      !Number.isInteger(parsedRequiredCount) ||
      parsedRequiredCount < 1 ||
      parsedRequiredCount > 1000
    ) {
      setError(
        isRtl
          ? "عدد المواهب المطلوبة يجب أن يكون بين 1 و1000."
          : "Required talent count must be between 1 and 1000.",
      );
      setLoading(false);
      return;
    }

    if (
      ageMode === "range" &&
      minAge &&
      maxAge &&
      Number(minAge) > Number(maxAge)
    ) {
      setError(
        isRtl
          ? "الحد الأدنى للعمر يجب ألا يكون أكبر من الحد الأعلى."
          : "Minimum age cannot be greater than maximum age.",
      );
      setLoading(false);
      return;
    }

    const roleRequirements =
      type === "actor"
        ? {
            languages: actorLanguages,
            dialects: actorDialects,
          }
        : {
            modeling_types: modelingTypes,
            min_height_cm: minHeightCm ? Number(minHeightCm) : null,
            hair_color: hairColor || null,
          };

    try {
      const res = await fetch("/api/create-opportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          posting_mode: postingMode,

          title: title.trim(),
          description: description.trim(),
          city: finalCity,
          required_gender: gender,
          min_age:
            ageMode === "adults"
              ? 18
              : ageMode === "range"
                ? minAge || null
                : null,
          max_age:
            ageMode === "range"
              ? maxAge || null
              : null,
              compensation_type: compensationType,

              budget:
                compensationType === "fixed"
                  ? budget.replace(/,/g, "") || null
                  : null,
              
              opportunity_type: type,
          application_days: Number(applicationDays),
          required_count: parsedRequiredCount,
          work_date: workDate || null,
work_time: workTime || null,
work_duration: workDuration.trim() || null,
          role_requirements: roleRequirements,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create opportunity");
      }

      router.push(
        `/${locale}/publisher-dashboard/opportunities?created=1&id=${data.opportunityId}`,
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRtl
            ? "حدث خطأ أثناء إنشاء الفرصة."
            : "Failed to create opportunity.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/${locale}/publisher-dashboard`}
            className="inline-flex min-h-11 items-center justify-center border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-gold/50 hover:text-gold sm:px-5 sm:tracking-[0.25em]"
          >
            {isRtl ? "الرجوع للوحة الناشر" : "Back to Publisher Dashboard"}
          </Link>

          <Link
            href={`/${locale}/opportunities`}
            className="hidden min-h-11 items-center border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.25em] text-white/40 transition hover:border-white/40 hover:text-white md:inline-flex"
          >
            {isRtl ? "عرض الفرص العامة" : "Public Opportunities"}
          </Link>
        </div>

        <div className="mb-10 grid gap-8 lg:mb-12 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
          <section className={isRtl ? "text-right" : "text-left"}>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              MLAMH Opportunities
            </p>

            <h1 className="mt-5 text-3xl font-light leading-tight sm:text-5xl md:text-7xl">
              {isRtl ? "إنشاء فرصة جديدة" : "Create New Opportunity"}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/50">
            {isRtl
  ? "انشر احتياجًا سريعًا أو مشروع كاستينغ، ودع المواهب المناسبة تتقدم مباشرة عبر ملامح."
  : "Post a quick talent need or a full casting project and receive applications directly through MLAMH."}
            </p>
          </section>

          <aside className="rounded-[1.5rem] border border-gold/20 bg-gold/[0.04] p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "قبل النشر" : "Before publishing"}
            </p>

            <ul className="mt-5 space-y-3 text-sm leading-7 text-white/55">
              <li>
                {isRtl
                  ? "اختر نوع الموهبة المطلوبة أولًا."
                  : "Choose the required talent type first."}
              </li>
              <li>
                {isRtl
                  ? "اكتب عنوانًا واضحًا ومباشرًا."
                  : "Use a clear and direct title."}
              </li>
              <li>
                {isRtl
                  ? "حدد فقط المتطلبات الضرورية للفرصة."
                  : "Add only requirements that matter for this opportunity."}
              </li>
              <li>
                {isRtl
                  ? "أضف تاريخ ومدة العمل إن كانت معروفة."
                  : "Add the work date and duration when known."}
              </li>
            </ul>
          </aside>
        </div>

        <form
          onSubmit={handleSubmit}
          className={isRtl ? "grid gap-6 text-right sm:gap-8" : "grid gap-6 text-left sm:gap-8"}
        >
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
  <p className="text-xs uppercase tracking-[0.3em] text-gold">
    {isRtl ? "نوع الفرصة" : "Opportunity Format"}
  </p>

  <h2 className="mt-3 text-2xl font-light sm:text-3xl">
    {isRtl
      ? "ماذا تريد أن تنشر؟"
      : "What would you like to post?"}
  </h2>

  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
    {isRtl
      ? "اختر المسار المناسب لاحتياجك. الفرصة السريعة للاحتياجات اليومية، والمشروع للأعمال التي تحتاج تفاصيل أكثر."
      : "Choose the format that fits your need. Quick opportunities are designed for everyday needs, while projects support more detailed casting work."}
  </p>

  <div className="mt-6 grid gap-4 md:grid-cols-2">
    <button
      type="button"
      aria-pressed={postingMode === "quick"}
      onClick={() => {
        setPostingMode("quick");
        setApplicationDays("3");
        setError("");
      }}
      className={`rounded-[1.5rem] border p-5 text-start transition active:scale-[0.99] sm:p-6 ${
        postingMode === "quick"
          ? "border-gold bg-gold/[0.10]"
          : "border-white/10 bg-black/25 hover:border-gold/35"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-3xl">⚡</span>

        {postingMode === "quick" ? (
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] text-gold">
            {isRtl ? "مختارة" : "Selected"}
          </span>
        ) : null}
      </div>

      <h3 className="mt-5 text-xl font-medium text-white">
        {isRtl ? "فرصة سريعة" : "Quick Opportunity"}
      </h3>

      <p className="mt-2 text-sm leading-7 text-white/45">
        {isRtl
          ? "لاحتياج بسيط أو عاجل لموهبة أو أكثر، مثل جلسة تصوير، مودل لمنتج، أو ممثل لمشهد قصير."
          : "For simple or urgent talent needs such as a shoot, product model, or short acting role."}
      </p>

      <p className="mt-4 text-xs text-gold/80">
        {isRtl
          ? "أسرع في الإنشاء والتقديم"
          : "Faster to create and apply"}
      </p>
    </button>

    <button
      type="button"
      aria-pressed={postingMode === "project"}
      onClick={() => {
        setPostingMode("project");
        setApplicationDays("30");
        setError("");
      }}
      className={`rounded-[1.5rem] border p-5 text-start transition active:scale-[0.99] sm:p-6 ${
        postingMode === "project"
          ? "border-gold bg-gold/[0.10]"
          : "border-white/10 bg-black/25 hover:border-gold/35"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-3xl">🎬</span>

        {postingMode === "project" ? (
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] text-gold">
            {isRtl ? "مختار" : "Selected"}
          </span>
        ) : null}
      </div>

      <h3 className="mt-5 text-xl font-medium text-white">
        {isRtl ? "مشروع / كاستينغ" : "Project / Casting Call"}
      </h3>

      <p className="mt-2 text-sm leading-7 text-white/45">
        {isRtl
          ? "للإعلانات والحملات والأفلام والأعمال التي تحتاج متطلبات وتفاصيل أكبر."
          : "For campaigns, commercials, films, and productions that require more detailed casting requirements."}
      </p>

      <p className="mt-4 text-xs text-white/35">
        {isRtl
          ? "تفاصيل ومتطلبات أوسع"
          : "More detailed requirements"}
      </p>
    </button>
  </div>
</section>
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "نوع الموهبة" : "Talent Type"}
            </p>

            <h2 className="mt-3 text-2xl font-light sm:text-3xl">
              {isRtl ? "من تبحث عنه؟" : "Who are you looking for?"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/40">
              {isRtl
                ? "اختر نوع الموهبة وستظهر المتطلبات المناسبة تلقائيًا."
                : "Choose the talent type and the relevant requirements will appear automatically."}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                {
                  value: "actor" as const,
                  icon: "🎭",
                  ar: "ممثل / ممثلة",
                  en: "Actor",
                  descriptionAr: "للإعلانات والمشاهد والأفلام والمحتوى.",
                  descriptionEn: "For commercials, scenes, film and content.",
                },
                {
                  value: "model" as const,
                  icon: "◉",
                  ar: "مودل",
                  en: "Model",
                  descriptionAr: "للأزياء والمنتجات والجمال والتصوير التجاري.",
                  descriptionEn: "For fashion, products, beauty and commercial shoots.",
                },
              ].map((option) => {
                const selected = type === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setType(option.value);
                      setError("");
                    }}
                    className={`min-h-28 rounded-2xl border p-4 text-start transition active:scale-[0.99] ${
                      selected
                        ? "border-gold bg-gold text-black"
                        : "border-white/10 bg-black/25 text-white/70 hover:border-gold/35"
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="mt-3 block text-base font-medium">
                      {isRtl ? option.ar : option.en}
                    </span>
                    <span
                      className={`mt-2 block text-xs leading-6 ${
                        selected ? "text-black/55" : "text-white/35"
                      }`}
                    >
                      {isRtl ? option.descriptionAr : option.descriptionEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isRtl ? "المعلومات الأساسية" : "Basic Information"}
              </p>

              <h2 className="mt-3 text-2xl font-light sm:text-3xl">
              {postingMode === "quick"
  ? isRtl
    ? "ما الذي تحتاجه؟"
    : "What do you need?"
  : isRtl
    ? "ما هو المشروع؟"
    : "What is the project?"}
              </h2>
            </div>

            <div className="grid gap-5">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                maxLength={80}
                placeholder={
                  postingMode === "quick"
                    ? isRtl
                      ? "مثال: مطلوب مودل لجلسة تصوير غدًا"
                      : "Example: Model needed for a shoot tomorrow"
                    : isRtl
                      ? "عنوان المشروع"
                      : "Project title"
                }
                className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
                required
              />

              <p className="-mt-3 text-end text-xs text-white/40">
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
                    ? "وصف الفرصة، المهام، وأي تفاصيل مهمة"
                    : "Opportunity description, tasks, and important details"
                }
                className="h-36 rounded-xl border border-white/10 bg-black/30 px-4 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
                required
              />

              <p className="-mt-3 text-end text-xs text-white/40">
                {description.length}/2000
              </p>

              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
                required
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
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isRtl ? "المتطلبات" : "Requirements"}
              </p>

              <h2 className="mt-3 text-2xl font-light sm:text-3xl">
                {type === "actor"
                  ? isRtl
                    ? "متطلبات الممثل"
                    : "Actor requirements"
                  : type === "model"
                    ? isRtl
                      ? "متطلبات المودل"
                      : "Model requirements"
                    : isRtl
                      ? "حدد المتطلبات"
                      : "Set the requirements"}
              </h2>
            </div>

            <div className="grid gap-5">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
                required
              >
                <option value="">
                  {isRtl ? "الجنس المطلوب" : "Required gender"}
                </option>
                <option value="any">{isRtl ? "أي جنس" : "Any"}</option>
                <option value="male">{isRtl ? "ذكر" : "Male"}</option>
                <option value="female">{isRtl ? "أنثى" : "Female"}</option>
              </select>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                <p className="text-sm font-medium text-white">
                  {isRtl ? "الفئة العمرية" : "Age Group"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "all" as const,
                      ar: "جميع الأعمار",
                      en: "All Ages",
                    },
                    {
                      value: "adults" as const,
                      ar: "للبالغين فقط",
                      en: "Adults Only",
                    },
                    {
                      value: "range" as const,
                      ar: "نطاق عمر محدد",
                      en: "Specific Range",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setAgeMode(option.value);

                        if (option.value !== "range") {
                          setMinAge("");
                          setMaxAge("");
                        }
                      }}
                      className={`rounded-2xl border p-4 text-start text-sm transition ${
                        ageMode === option.value
                          ? "border-gold/50 bg-gold/[0.08] text-gold"
                          : "border-white/10 bg-black/20 text-white/60"
                      }`}
                    >
                      {isRtl ? option.ar : option.en}
                    </button>
                  ))}
                </div>

                {ageMode === "range" ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs text-white/45">
                        {isRtl ? "الحد الأدنى للعمر" : "Minimum Age"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={minAge}
                        onChange={(event) => setMinAge(event.target.value)}
                        className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
                        required
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs text-white/45">
                        {isRtl ? "الحد الأعلى للعمر" : "Maximum Age"}
                      </span>
                      <input
                        type="number"
                        min={minAge || "0"}
                        max="100"
                        value={maxAge}
                        onChange={(event) => setMaxAge(event.target.value)}
                        className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
                        required
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              {postingMode === "project" && type === "actor" ? (
                <div className="rounded-2xl border border-gold/15 bg-gold/[0.035] p-4 sm:p-5">
                  <p className="text-sm font-medium text-white">
                    {isRtl ? "تفاصيل الدور — اختيارية" : "Role details — optional"}
                  </p>

                  <p className="mt-4 text-xs text-white/45">
                    {isRtl ? "اللغات المطلوبة" : "Required languages"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actorLanguageOptions.map((option) => {
                      const selected = actorLanguages.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            toggleArrayValue(
                              option.value,
                              actorLanguages,
                              setActorLanguages,
                            )
                          }
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            selected
                              ? "border-gold bg-gold text-black"
                              : "border-white/10 bg-black/20 text-white/60"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {isRtl ? option.ar : option.en}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-5 text-xs text-white/45">
                    {isRtl ? "اللهجات المطلوبة" : "Required dialects"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actorDialectOptions.map((option) => {
                      const selected = actorDialects.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            toggleArrayValue(
                              option.value,
                              actorDialects,
                              setActorDialects,
                            )
                          }
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            selected
                              ? "border-gold bg-gold text-black"
                              : "border-white/10 bg-black/20 text-white/60"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {isRtl ? option.ar : option.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

{postingMode === "project" && type === "model" ? (
                <div className="rounded-2xl border border-gold/15 bg-gold/[0.035] p-4 sm:p-5">
                  <p className="text-sm font-medium text-white">
                    {isRtl ? "تفاصيل المودل — اختيارية" : "Model details — optional"}
                  </p>

                  <p className="mt-4 text-xs text-white/45">
                    {isRtl ? "نوع أعمال المودل" : "Modeling types"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {modelingTypeOptions.map((option) => {
                      const selected = modelingTypes.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            toggleArrayValue(
                              option.value,
                              modelingTypes,
                              setModelingTypes,
                            )
                          }
                          className={`rounded-full border px-4 py-2 text-sm transition ${
                            selected
                              ? "border-gold bg-gold text-black"
                              : "border-white/10 bg-black/20 text-white/60"
                          }`}
                        >
                          {selected ? "✓ " : ""}
                          {isRtl ? option.ar : option.en}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-xs text-white/45">
                        {isRtl
                          ? "الحد الأدنى للطول (سم)"
                          : "Minimum height (cm)"}
                      </span>
                      <input
                        type="number"
                        min="50"
                        max="250"
                        value={minHeightCm}
                        onChange={(event) => setMinHeightCm(event.target.value)}
                        placeholder={isRtl ? "مثال: 170" : "Example: 170"}
                        className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs text-white/45">
                        {isRtl ? "لون الشعر" : "Hair color"}
                      </span>
                      <select
                        value={hairColor}
                        onChange={(event) => setHairColor(event.target.value)}
                        className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
                      >
                        <option value="">
                          {isRtl ? "بدون تفضيل" : "No preference"}
                        </option>
                        {hairColorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {isRtl ? option.ar : option.en}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
  <p className="text-xs uppercase tracking-[0.3em] text-gold">
    {isRtl ? "تفاصيل العمل" : "Work Details"}
  </p>

  <h2 className="mt-3 text-2xl font-light sm:text-3xl">
    {postingMode === "quick"
      ? isRtl
        ? "متى تحتاج الموهبة؟"
        : "When do you need the talent?"
      : isRtl
        ? "متى وكم شخصًا تحتاج؟"
        : "When and how many talents do you need?"}
  </h2>

  <div className="mt-6 grid gap-5">

    {/* Required talent count */}
    <label className="grid gap-2">
      <span className="text-xs text-white/45">
        {isRtl
          ? "عدد المواهب المطلوبة"
          : "Required talent count"}
      </span>

      <input
        type="number"
        min="1"
        max="1000"
        value={requiredCount}
        onChange={(event) =>
          setRequiredCount(event.target.value)
        }
        className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
        required
      />
    </label>

    {/* WORK DATE / TIME / DURATION */}
        <div className="grid gap-2">
          <span className="text-xs text-white/45">
            {isRtl ? "موعد العمل" : "Work date"}
          </span>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                  .toISOString()
                  .split("T")[0];
              
                setWorkDate(today);
                setWorkDateMode("today");
              }}
              className={`min-h-12 rounded-xl border px-4 text-sm transition ${
                workDateMode === "today"
                  ? "border-gold bg-gold text-black"
                  : "border-white/10 bg-black/20 text-white/60 hover:border-gold/35"
              }`}
            >
              {isRtl ? "اليوم" : "Today"}
            </button>

            <button
  type="button"
  onClick={() => {
    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    setWorkDate(
      tomorrow.toISOString().split("T")[0]
    );

    setWorkDateMode("tomorrow");
  }}
  className={`min-h-12 rounded-xl border px-4 text-sm transition ${
    workDateMode === "tomorrow"
      ? "border-gold bg-gold text-black"
      : "border-white/10 bg-black/20 text-white/60 hover:border-gold/35"
  }`}
>
  {isRtl ? "غدًا" : "Tomorrow"}
</button>

            <button
              type="button"
              onClick={() => {
                setWorkDate("");
                setWorkDateMode("flexible");
              }}
              className={`min-h-12 rounded-xl border px-4 text-sm transition ${
                workDateMode === "flexible"
                  ? "border-gold bg-gold text-black"
                  : "border-white/10 bg-black/20 text-white/60 hover:border-gold/35"
              }`}
            >
              {isRtl ? "تاريخ آخر" : "Other Date"}
            </button>
          </div>

          {workDateMode === "flexible" && (
  <div className="mt-2 grid grid-cols-3 gap-2">
  <select
    value={workDate ? workDate.split("-")[2] : ""}
    onChange={(e) =>
      setWorkDate(updateDatePart(workDate, "day", e.target.value))
    }
    className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-3 outline-none transition focus:border-gold/50"
  >
    <option value="">{isRtl ? "اليوم" : "Day"}</option>

    {Array.from({ length: 31 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");

      return (
        <option key={day} value={day}>
          {i + 1}
        </option>
      );
    })}
  </select>

  <select
    value={workDate ? workDate.split("-")[1] : ""}
    onChange={(e) =>
      setWorkDate(updateDatePart(workDate, "month", e.target.value))
    }
    className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-3 outline-none transition focus:border-gold/50"
  >
    <option value="">{isRtl ? "الشهر" : "Month"}</option>

    {[
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ].map((month, i) => {
      const value = String(i + 1).padStart(2, "0");

      return (
        <option key={value} value={value}>
          {isRtl
            ? month
            : new Date(2000, i).toLocaleString("en", {
                month: "long",
              })}
        </option>
      );
    })}
  </select>

  <select
    value={workDate ? workDate.split("-")[0] : ""}
    onChange={(e) =>
      setWorkDate(updateDatePart(workDate, "year", e.target.value))
    }
    className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-3 outline-none transition focus:border-gold/50"
  >
    <option value="">{isRtl ? "السنة" : "Year"}</option>

    {Array.from({ length: 6 }, (_, i) => {
      const year = new Date().getFullYear() + i;

      return (
        <option key={year} value={year}>
          {year}
        </option>
      );
    })}
  </select>
</div>
)}
        </div>

        {/* Work time */}
        <label className="grid gap-2">
          <span className="text-xs text-white/45">
            {isRtl
              ? "وقت البدء — اختياري"
              : "Start time — optional"}
          </span>

          <div className="grid grid-cols-3 gap-2">
  <select
    value={
      workTime
        ? String(
            ((Number(workTime.split(":")[0]) + 11) % 12) + 1
          ).padStart(2, "0")
        : ""
    }
    onChange={(event) => {
      const hour12 = Number(event.target.value);

      if (!hour12) {
        setWorkTime("");
        return;
      }

      const currentHour = workTime
        ? Number(workTime.split(":")[0])
        : 0;

      const isPm = currentHour >= 12;

      const hour24 = isPm
        ? hour12 === 12
          ? 12
          : hour12 + 12
        : hour12 === 12
          ? 0
          : hour12;

      const minute = workTime
        ? workTime.split(":")[1] || "00"
        : "00";

      setWorkTime(
        `${String(hour24).padStart(2, "0")}:${minute}`
      );

      setError("");
    }}
    className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-3 outline-none transition focus:border-gold/50"
  >
    <option value="">
      {isRtl ? "الساعة" : "Hour"}
    </option>

    {Array.from({ length: 12 }, (_, index) => {
      const hour = String(index + 1).padStart(2, "0");

      return (
        <option key={hour} value={hour}>
          {hour}
        </option>
      );
    })}
  </select>

  <select
    value={
      workTime
        ? workTime.split(":")[1] || "00"
        : ""
    }
    onChange={(event) => {
      const minute = event.target.value;

      if (!minute) return;

      const hour = workTime
        ? workTime.split(":")[0]
        : "00";

      setWorkTime(`${hour}:${minute}`);
      setError("");
    }}
    className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-3 outline-none transition focus:border-gold/50"
  >
    <option value="">
      {isRtl ? "الدقيقة" : "Minute"}
    </option>
    <option value="00">00</option>
    <option value="15">15</option>
    <option value="30">30</option>
    <option value="45">45</option>
  </select>

  <select
    value={
      workTime
        ? Number(workTime.split(":")[0]) >= 12
          ? "pm"
          : "am"
        : "am"
    }
    onChange={(event) => {
      if (!workTime) return;

      let hour = Number(workTime.split(":")[0]);
      const minute = workTime.split(":")[1] || "00";

      if (event.target.value === "pm" && hour < 12) {
        hour += 12;
      }

      if (event.target.value === "am" && hour >= 12) {
        hour -= 12;
      }

      setWorkTime(
        `${String(hour).padStart(2, "0")}:${minute}`
      );

      setError("");
    }}
    className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-3 outline-none transition focus:border-gold/50"
  >
    <option value="am">
      {isRtl ? "صباحًا" : "AM"}
    </option>
    <option value="pm">
      {isRtl ? "مساءً" : "PM"}
    </option>
  </select>
</div>
        </label>

        {/* Quick duration */}
<div className="grid gap-2">
  <span className="text-xs text-white/45">
    {isRtl
      ? "مدة العمل — اختيارية"
      : "Work duration — optional"}
  </span>

  <div className="flex flex-wrap gap-2">
    {[
      {
        value: "1_hour",
        ar: "ساعة",
        en: "1 Hour",
      },
      {
        value: "2_hours",
        ar: "ساعتان",
        en: "2 Hours",
      },
      {
        value: "4_hours",
        ar: "4 ساعات",
        en: "4 Hours",
      },
      {
        value: "full_day",
        ar: "يوم كامل",
        en: "Full Day",
      },
    ].map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => setWorkDuration(option.value)}
        className={`rounded-full border px-4 py-2.5 text-xs transition ${
          workDuration === option.value
            ? "border-gold bg-gold text-black"
            : "border-gold/30 text-gold hover:bg-gold/10"
        }`}
      >
        {isRtl ? option.ar : option.en}
      </button>
    ))}
  </div>

  <input
    type="text"
    maxLength={120}
    value={
      workDuration === "1_hour"
        ? isRtl
          ? "ساعة"
          : "1 Hour"
        : workDuration === "2_hours"
          ? isRtl
            ? "ساعتان"
            : "2 Hours"
          : workDuration === "4_hours"
            ? isRtl
              ? "4 ساعات"
              : "4 Hours"
            : workDuration === "full_day"
              ? isRtl
                ? "يوم كامل"
                : "Full Day"
              : workDuration
    }
    onChange={(event) =>
      setWorkDuration(event.target.value)
    }
    placeholder={
      isRtl
        ? "أو اكتب مدة أخرى"
        : "Or enter another duration"
    }
    className="mt-2 min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition placeholder:text-white/25 focus:border-gold/50"
  />
</div>
  </div>
</section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "مدة استقبال الطلبات" : "Application Period"}
            </p>

            <h2 className="mt-3 text-2xl font-light sm:text-3xl">
              {isRtl
                ? "كم يوم تستقبل الطلبات؟"
                : "How long will applications remain open?"}
            </h2>

            <div className="mt-6 grid gap-4">
              <input
                type="number"
                min="1"
                max="90"
                value={applicationDays}
                onChange={(e) => setApplicationDays(e.target.value)}
                className="min-h-14 rounded-xl border border-white/10 bg-black/30 px-4 outline-none transition focus:border-gold/50"
              />

<div className="flex flex-wrap gap-2">
  {(postingMode === "quick"
    ? [1, 3, 7]
    : [7, 14, 30]
  ).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setApplicationDays(String(days))}
                    className={`rounded-full border px-4 py-2 text-xs transition ${
                      applicationDays === String(days)
                        ? "border-gold bg-gold text-black"
                        : "border-gold/30 text-gold"
                    }`}
                  >
                    {isRtl ? `${days} يوم` : `${days} Days`}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 md:p-8">
  <p className="text-xs uppercase tracking-[0.3em] text-gold">
    {isRtl ? "المقابل المالي" : "Compensation"}
  </p>

  <h2 className="mt-3 text-2xl font-light sm:text-3xl">
    {isRtl
      ? "ما نوع المقابل لهذه الفرصة؟"
      : "What is the compensation for this opportunity?"}
  </h2>

  <div className="mt-6 grid gap-4">
    <div className="grid gap-3 sm:grid-cols-3">
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
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setCompensationType(option.value);

            if (option.value !== "fixed") {
              setBudget("");
            }
          }}
          className={`min-h-14 rounded-xl border px-4 text-sm transition ${
            compensationType === option.value
              ? "border-gold bg-gold text-black"
              : "border-white/10 bg-black/20 text-white/60 hover:border-gold/35"
          }`}
        >
          {isRtl ? option.ar : option.en}
        </button>
      ))}
    </div>

    {compensationType === "fixed" ? (
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
          placeholder={
            isRtl
              ? "مثال: 2,500"
              : "Example: 2,500"
          }
          className={`min-h-14 w-full rounded-xl border border-white/10 bg-black/30 py-4 outline-none transition placeholder:text-white/25 focus:border-gold/50 ${
            isRtl
              ? "pr-12 pl-4 text-right"
              : "pl-12 pr-4 text-left"
          }`}
        />
      </div>
    ) : (
      <p className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-7 text-white/45">
        {compensationType === "negotiable"
          ? isRtl
            ? "سيظهر للمواهب أن المقابل المالي يتم الاتفاق عليه بين الطرفين."
            : "Talents will see that compensation is negotiable between both parties."
          : isRtl
            ? "سيظهر للمواهب بوضوح أن هذه الفرصة غير مدفوعة."
            : "Talents will clearly see that this opportunity is unpaid."}
      </p>
    )}
  </div>
</section>

          {error ? (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
          <button
  type="submit"
  disabled={loading}
  className="min-h-14 flex-1 rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-4 text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
>
  {loading
    ? isRtl
      ? "جاري الإنشاء..."
      : "Creating..."
    : postingMode === "quick"
      ? isRtl
        ? "إرسال الفرصة السريعة للمراجعة"
        : "Submit Quick Opportunity for Review"
      : isRtl
        ? "إرسال المشروع للمراجعة"
        : "Submit Project for Review"}
</button>

            <Link
              href={`/${locale}/publisher-dashboard`}
              className="min-h-14 flex-1 rounded-xl border border-white/10 px-6 py-4 text-center text-white/60 transition hover:border-white/40 hover:text-white"
            >
              {isRtl ? "إلغاء والعودة للوحة" : "Cancel and return"}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
