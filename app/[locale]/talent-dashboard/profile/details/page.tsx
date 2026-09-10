"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentCoreDetailsAction } from "@/lib/actions/update-own-talent-core-details";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  TALENT_SIGNUP_COUNTRIES,
} from "@/lib/data/talent-signup";
import { isValidLocale, type Locale } from "@/lib/i18n";

type TalentRecord = Record<string, unknown> & {
  name_ar?: string | null;
  name_en?: string | null;
  phone?: string | null;
  primary_role?: string | null;
  category_slug?: string | null;
  gender?: string | null;
  nationality_slug?: string | null;
  nationality?: string | null;
  base_country_code?: string | null;
  city_slug?: string | null;
  approval_status?: string | null;
  acting_age_min?: number | null;
  acting_age_max?: number | null;
  experience_years?: number | null;
  languages?: unknown;
  dialects?: unknown;
  skills?: unknown;
  height_cm?: number | null;
  weight_kg?: number | null;
  clothing_size?: string | null;
  shoe_size?: number | null;
  chest_size?: number | null;
  waist_size?: number | null;
  hip_size?: number | null;
  eye_color?: string | null;
  hair_color?: string | null;
  modeling_types?: unknown;
};

type Choice = { value: string; ar: string; en: string };

const LANGUAGE_CHOICES: Choice[] = [
  { value: "arabic", ar: "العربية", en: "Arabic" },
  { value: "english", ar: "الإنجليزية", en: "English" },
  { value: "french", ar: "الفرنسية", en: "French" },
  { value: "spanish", ar: "الإسبانية", en: "Spanish" },
  { value: "turkish", ar: "التركية", en: "Turkish" },
  { value: "urdu", ar: "الأردية", en: "Urdu" },
  { value: "hindi", ar: "الهندية", en: "Hindi" },
  { value: "persian", ar: "الفارسية", en: "Persian" },
  { value: "german", ar: "الألمانية", en: "German" },
  { value: "italian", ar: "الإيطالية", en: "Italian" },
];

const DIALECT_CHOICES: Choice[] = [
  { value: "saudi", ar: "سعودية", en: "Saudi" },
  { value: "najdi", ar: "نجدية", en: "Najdi" },
  { value: "hijazi", ar: "حجازية", en: "Hijazi" },
  { value: "gulf", ar: "خليجية", en: "Gulf" },
  { value: "egyptian", ar: "مصرية", en: "Egyptian" },
  { value: "levantine", ar: "شامية", en: "Levantine" },
  { value: "iraqi", ar: "عراقية", en: "Iraqi" },
  { value: "yemeni", ar: "يمنية", en: "Yemeni" },
  { value: "maghrebi", ar: "مغاربية", en: "Maghrebi" },
  { value: "msa", ar: "العربية الفصحى", en: "Modern Standard Arabic" },
];

const ACTOR_SKILL_CHOICES: Choice[] = [
  { value: "acting", ar: "تمثيل", en: "Acting" },
  { value: "improv", ar: "ارتجال", en: "Improvisation" },
  { value: "comedy", ar: "كوميديا", en: "Comedy" },
  { value: "drama", ar: "دراما", en: "Drama" },
  { value: "action", ar: "أكشن", en: "Action" },
  { value: "voice_acting", ar: "أداء صوتي", en: "Voice acting" },
  { value: "presenting", ar: "تقديم", en: "Presenting" },
  { value: "singing", ar: "غناء", en: "Singing" },
  { value: "dancing", ar: "رقص", en: "Dancing" },
  { value: "martial_arts", ar: "فنون قتالية", en: "Martial arts" },
  { value: "horse_riding", ar: "ركوب الخيل", en: "Horse riding" },
  { value: "swimming", ar: "سباحة", en: "Swimming" },
  { value: "driving", ar: "قيادة", en: "Driving" },
];

const MODEL_TYPE_CHOICES: Choice[] = [
  { value: "commercial", ar: "إعلاني", en: "Commercial" },
  { value: "fashion", ar: "أزياء", en: "Fashion" },
  { value: "beauty", ar: "جمال", en: "Beauty" },
  { value: "product", ar: "منتجات", en: "Product" },
  { value: "lifestyle", ar: "لايف ستايل", en: "Lifestyle" },
  { value: "fitness", ar: "لياقة", en: "Fitness" },
  { value: "runway", ar: "منصة عرض", en: "Runway" },
  { value: "hand", ar: "مودل يد", en: "Hand model" },
  { value: "hair", ar: "مودل شعر", en: "Hair model" },
];

const EYE_COLOR_CHOICES: Choice[] = [
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "dark_brown", ar: "بني داكن", en: "Dark brown" },
  { value: "hazel", ar: "عسلي", en: "Hazel" },
  { value: "black", ar: "أسود", en: "Black" },
  { value: "blue", ar: "أزرق", en: "Blue" },
  { value: "green", ar: "أخضر", en: "Green" },
  { value: "gray", ar: "رمادي", en: "Gray" },
];

const HAIR_COLOR_CHOICES: Choice[] = [
  { value: "black", ar: "أسود", en: "Black" },
  { value: "dark_brown", ar: "بني داكن", en: "Dark brown" },
  { value: "brown", ar: "بني", en: "Brown" },
  { value: "light_brown", ar: "بني فاتح", en: "Light brown" },
  { value: "blonde", ar: "أشقر", en: "Blonde" },
  { value: "red", ar: "أحمر", en: "Red" },
  { value: "gray", ar: "رمادي", en: "Gray" },
  { value: "white", ar: "أبيض", en: "White" },
];

const CLOTHING_SIZE_CHOICES = ["XS", "S", "M", "L", "XL", "XXL"];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberString(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function listValues(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  }
  return clean(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TalentCoreDetailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("not_submitted");

  const [actingAgeMin, setActingAgeMin] = useState("");
  const [actingAgeMax, setActingAgeMax] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [dialects, setDialects] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [clothingSize, setClothingSize] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [chestSize, setChestSize] = useState("");
  const [waistSize, setWaistSize] = useState("");
  const [hipSize, setHipSize] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [modelingTypes, setModelingTypes] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const timeout = new Promise<never>((_, reject) =>
        window.setTimeout(
          () => reject(new Error(isArabic ? "استغرق تحميل البيانات وقتًا أطول من المعتاد." : "Loading took longer than expected.")),
          8000,
        ),
      );
      const talent = (await Promise.race([getOwnTalentProfileAction(locale), timeout])) as TalentRecord | null;
      if (!talent) throw new Error(isArabic ? "لم يتم العثور على ملف الموهبة." : "Talent profile was not found.");

      setName(clean(talent.name_ar) || clean(talent.name_en));
      setPhone(clean(talent.phone));
      setRole(clean(talent.primary_role) || clean(talent.category_slug));
      setGender(clean(talent.gender));
      setNationality(clean(talent.nationality_slug) || clean(talent.nationality));
      setCountryCode(clean(talent.base_country_code).toUpperCase());
      setCitySlug(clean(talent.city_slug));
      setApprovalStatus(clean(talent.approval_status) || "not_submitted");
      setActingAgeMin(numberString(talent.acting_age_min));
      setActingAgeMax(numberString(talent.acting_age_max));
      setExperienceYears(numberString(talent.experience_years));
      setLanguages(listValues(talent.languages));
      setDialects(listValues(talent.dialects));
      setSkills(listValues(talent.skills));
      setHeightCm(numberString(talent.height_cm));
      setWeightKg(numberString(talent.weight_kg));
      setClothingSize(clean(talent.clothing_size));
      setShoeSize(numberString(talent.shoe_size));
      setChestSize(numberString(talent.chest_size));
      setWaistSize(numberString(talent.waist_size));
      setHipSize(numberString(talent.hip_size));
      setEyeColor(clean(talent.eye_color));
      setHairColor(clean(talent.hair_color));
      setModelingTypes(listValues(talent.modeling_types));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : isArabic ? "تعذر تحميل البيانات." : "Unable to load details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const country = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode),
    [countryCode],
  );
  const editable = ["not_submitted", "rejected", "changes_requested"].includes(approvalStatus);
  const showActorFields = role === "actor";
  const showModelFields = role === "model";

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !editable) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("name", name);
    payload.set("phone", phone);
    payload.set("primary_role", role);
    payload.set("gender", gender);
    payload.set("nationality_slug", nationality);
    payload.set("base_country_code", countryCode);
    payload.set("city_slug", citySlug);

    if (showActorFields) {
      payload.set("acting_age_min", actingAgeMin);
      payload.set("acting_age_max", actingAgeMax);
      payload.set("experience_years", experienceYears);
      payload.set("languages", languages.join(","));
      payload.set("dialects", dialects.join(","));
      payload.set("skills", skills.join(","));
      payload.set("height_cm", heightCm);
      payload.set("weight_kg", weightKg);
      payload.set("eye_color", eyeColor);
      payload.set("hair_color", hairColor);
    }

    if (showModelFields) {
      payload.set("height_cm", heightCm);
      payload.set("weight_kg", weightKg);
      payload.set("clothing_size", clothingSize);
      payload.set("shoe_size", shoeSize);
      payload.set("chest_size", chestSize);
      payload.set("waist_size", waistSize);
      payload.set("hip_size", hipSize);
      payload.set("eye_color", eyeColor);
      payload.set("hair_color", hairColor);
      payload.set("modeling_types", modelingTypes.join(","));
    }

    const result = await updateOwnTalentCoreDetailsAction(payload);
    setMessage(result.message);
    setSuccess(result.success);
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-96 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.05] p-7 text-center">
          <h1 className="text-2xl font-light">{isArabic ? "تعذر تحميل بياناتك" : "Unable to load your details"}</h1>
          <p className="mt-3 text-sm text-white/55">{loadError}</p>
          <button onClick={() => void load()} className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "الملف الشخصي" : "PROFILE"}</p>
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">{isArabic ? "تعديل بيانات الموهبة" : "Edit talent details"}</h1>
            <p className="mt-3 text-sm leading-7 text-white/50">
              {isArabic ? "البيانات الأساسية أولًا، ثم اختر بياناتك المهنية من قوائم واضحة بدل الكتابة اليدوية." : "Start with core details, then choose professional attributes from structured options instead of typing them manually."}
            </p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">
            {isArabic ? "رجوع" : "Back"}
          </Link>
        </div>

        {!editable ? (
          <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-7 text-amber-100">
            {isArabic ? "ملفك قيد المراجعة أو معتمد، لذلك تم إيقاف تعديل البيانات الأساسية هنا لحماية الملف." : "Your profile is under review or approved, so core identity editing is locked here."}
          </div>
        ) : null}

        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "البيانات الأساسية" : "CORE DETAILS"}</p>
            <p className="mt-2 text-sm text-white/45">{isArabic ? "هذه البيانات مطلوبة لإكمال ملفك." : "These details are required to complete your profile."}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label={isArabic ? "الاسم الكامل" : "Full name"}>
                <input value={name} onChange={(e) => setName(e.target.value)} disabled={!editable} required className="input" />
              </Field>
              <Field label={isArabic ? "رقم الجوال" : "Phone number"}>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editable} required dir="ltr" className="input text-left" />
              </Field>
              <Field label={isArabic ? "نوع الموهبة" : "Talent type"}>
                <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!editable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {TALENT_CATEGORIES.map((item) => (
                    <option key={item.slug} value={item.slug}>{isArabic ? item.ar : item.en}</option>
                  ))}
                </select>
              </Field>
              <Field label={isArabic ? "الجنس" : "Gender"}>
                <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={!editable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {GENDER_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>
                  ))}
                </select>
              </Field>
              <Field label={isArabic ? "الجنسية" : "Nationality"}>
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={!editable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {NATIONALITY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>
                  ))}
                </select>
              </Field>
              <Field label={isArabic ? "بلد الإقامة" : "Country of residence"}>
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setCitySlug("");
                  }}
                  disabled={!editable}
                  required
                  className="input"
                >
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {TALENT_SIGNUP_COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>{isArabic ? item.ar : item.en}</option>
                  ))}
                </select>
              </Field>
              <Field label={isArabic ? "المدينة" : "City"}>
                <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} disabled={!editable || !country} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {(country?.cities ?? []).map((item) => (
                    <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {showActorFields ? (
            <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "بيانات الممثل" : "ACTOR PROFILE"}</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span>
              </div>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "معلومات تساعد الجهات على اختيارك" : "Details that help publishers cast you"}</h2>
              <p className="mt-2 text-sm leading-7 text-white/45">
                {isArabic ? "اختر أكثر من خيار في اللغات واللهجات والمهارات. لا تحتاج لكتابتها يدويًا." : "Choose multiple languages, dialects and skills. No manual typing is needed."}
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label={isArabic ? "العمر التمثيلي من" : "Playing age from"}>
                  <input type="number" min="1" max="120" value={actingAgeMin} onChange={(e) => setActingAgeMin(e.target.value)} disabled={!editable} className="input" />
                </Field>
                <Field label={isArabic ? "العمر التمثيلي إلى" : "Playing age to"}>
                  <input type="number" min="1" max="120" value={actingAgeMax} onChange={(e) => setActingAgeMax(e.target.value)} disabled={!editable} className="input" />
                </Field>
                <Field label={isArabic ? "سنوات الخبرة" : "Years of experience"}>
                  <select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} disabled={!editable} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {Array.from({ length: 21 }, (_, index) => (
                      <option key={index} value={index}>{index === 20 ? (isArabic ? "20+ سنة" : "20+ years") : isArabic ? `${index} سنة` : `${index} year${index === 1 ? "" : "s"}`}</option>
                    ))}
                  </select>
                </Field>
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"}>
                  <input type="number" min="1" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} disabled={!editable} className="input" />
                </Field>
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"}>
                  <input type="number" min="1" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} disabled={!editable} className="input" />
                </Field>
                <Field label={isArabic ? "لون العين" : "Eye color"}>
                  <SingleChoiceSelect value={eyeColor} onChange={setEyeColor} options={EYE_COLOR_CHOICES} isArabic={isArabic} disabled={!editable} />
                </Field>
                <Field label={isArabic ? "لون الشعر" : "Hair color"}>
                  <SingleChoiceSelect value={hairColor} onChange={setHairColor} options={HAIR_COLOR_CHOICES} isArabic={isArabic} disabled={!editable} />
                </Field>
              </div>

              <div className="mt-7 space-y-6">
                <MultiChoiceField label={isArabic ? "اللغات" : "Languages"} values={languages} onChange={setLanguages} options={LANGUAGE_CHOICES} isArabic={isArabic} disabled={!editable} />
                <MultiChoiceField label={isArabic ? "اللهجات" : "Dialects"} values={dialects} onChange={setDialects} options={DIALECT_CHOICES} isArabic={isArabic} disabled={!editable} />
                <MultiChoiceField label={isArabic ? "المهارات" : "Skills"} values={skills} onChange={setSkills} options={ACTOR_SKILL_CHOICES} isArabic={isArabic} disabled={!editable} />
              </div>

              <Link href={`/${locale}/talent-dashboard/gallery/links`} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-2xl border border-gold/25 px-5 text-sm text-gold hover:bg-gold/[0.05]">
                {isArabic ? "إضافة Showreel وروابط السوشيال من معرض الأعمال" : "Add showreel and social links in Portfolio"}
              </Link>
            </section>
          ) : null}

          {showModelFields ? (
            <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "بيانات المودل" : "MODEL PROFILE"}</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span>
              </div>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "المقاسات والمظهر المهني" : "Professional measurements and appearance"}</h2>
              <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? "المقاسات رقمية، أما المظهر وأنواع المودل فتختارها مباشرة من القوائم." : "Measurements stay numeric while appearance and modeling types use structured choices."}</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"}><input type="number" min="1" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"}><input type="number" min="1" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "مقاس الملابس" : "Clothing size"}>
                  <select value={clothingSize} onChange={(e) => setClothingSize(e.target.value)} disabled={!editable} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {CLOTHING_SIZE_CHOICES.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </Field>
                <Field label={isArabic ? "مقاس الحذاء" : "Shoe size"}><input type="number" min="1" max="60" step="0.5" value={shoeSize} onChange={(e) => setShoeSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الصدر (سم)" : "Chest (cm)"}><input type="number" min="1" max="250" value={chestSize} onChange={(e) => setChestSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الخصر (سم)" : "Waist (cm)"}><input type="number" min="1" max="250" value={waistSize} onChange={(e) => setWaistSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الورك (سم)" : "Hips (cm)"}><input type="number" min="1" max="250" value={hipSize} onChange={(e) => setHipSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "لون العين" : "Eye color"}><SingleChoiceSelect value={eyeColor} onChange={setEyeColor} options={EYE_COLOR_CHOICES} isArabic={isArabic} disabled={!editable} /></Field>
                <Field label={isArabic ? "لون الشعر" : "Hair color"}><SingleChoiceSelect value={hairColor} onChange={setHairColor} options={HAIR_COLOR_CHOICES} isArabic={isArabic} disabled={!editable} /></Field>
              </div>
              <div className="mt-7">
                <MultiChoiceField label={isArabic ? "أنواع المودل" : "Modeling types"} values={modelingTypes} onChange={setModelingTypes} options={MODEL_TYPE_CHOICES} isArabic={isArabic} disabled={!editable} />
              </div>
              <Link href={`/${locale}/talent-dashboard/gallery/links`} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-2xl border border-gold/25 px-5 text-sm text-gold hover:bg-gold/[0.05]">
                {isArabic ? "إضافة الفيديو وروابط السوشيال من معرض الأعمال" : "Add video and social links in Portfolio"}
              </Link>
            </section>
          ) : null}

          {!showActorFields && !showModelFields ? (
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <p className="text-sm leading-7 text-white/50">{isArabic ? "البيانات الأساسية تكفي للاعتماد حاليًا. الصور والفيديو وروابطك المهنية موجودة في معرض الأعمال." : "Core details are enough for approval right now. Photos, video and professional links live in Portfolio."}</p>
              <Link href={`/${locale}/talent-dashboard/gallery`} className="mt-4 inline-flex text-sm text-gold">{isArabic ? "فتح معرض الأعمال" : "Open Portfolio"}</Link>
            </section>
          ) : null}

          {message ? (
            <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={!editable || saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التعديلات" : "Save changes")}
            </button>
            <Link href={`/${locale}/talent-dashboard/profile`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:border-gold/30 hover:text-gold">
              {isArabic ? "إلغاء" : "Cancel"}
            </Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input { width:100%; min-height:3.5rem; border-radius:1rem; border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.28); padding:.75rem 1rem; color:white; outline:none; }
        .input:focus { border-color:rgba(197,160,89,.55); }
        .input:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs text-white/50">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-[11px] text-white/30">{hint}</span> : null}
    </label>
  );
}

function SingleChoiceSelect({
  value,
  onChange,
  options,
  isArabic,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Choice[];
  isArabic: boolean;
  disabled: boolean;
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="input">
      <option value="">{isArabic ? "اختر" : "Select"}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{isArabic ? option.ar : option.en}</option>
      ))}
    </select>
  );
}

function MultiChoiceField({
  label,
  values,
  onChange,
  options,
  isArabic,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Choice[];
  isArabic: boolean;
  disabled: boolean;
}) {
  function toggle(value: string) {
    if (disabled) return;
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-white/50">{label}</p>
        <span className="text-[11px] text-white/30">
          {values.length > 0 ? (isArabic ? `${values.length} محدد` : `${values.length} selected`) : (isArabic ? "يمكن اختيار أكثر من خيار" : "Choose multiple")}
        </span>
      </div>
      <div className="max-h-44 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                disabled={disabled}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-xs transition ${selected ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 bg-white/[0.025] text-white/55 hover:border-gold/30 hover:text-white"} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {selected ? "✓ " : ""}{isArabic ? option.ar : option.en}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
