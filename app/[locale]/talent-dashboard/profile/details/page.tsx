"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentCoreDetailsAction } from "@/lib/actions/update-own-talent-core-details";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";
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

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberString(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function listString(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(", ") : clean(value);
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
  const [languages, setLanguages] = useState("");
  const [dialects, setDialects] = useState("");
  const [skills, setSkills] = useState("");

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [clothingSize, setClothingSize] = useState("");
  const [shoeSize, setShoeSize] = useState("");
  const [chestSize, setChestSize] = useState("");
  const [waistSize, setWaistSize] = useState("");
  const [hipSize, setHipSize] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [modelingTypes, setModelingTypes] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error(isArabic ? "استغرق تحميل البيانات وقتًا أطول من المعتاد." : "Loading took longer than expected.")), 8000));
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
      setLanguages(listString(talent.languages));
      setDialects(listString(talent.dialects));
      setSkills(listString(talent.skills));
      setHeightCm(numberString(talent.height_cm));
      setWeightKg(numberString(talent.weight_kg));
      setClothingSize(clean(talent.clothing_size));
      setShoeSize(numberString(talent.shoe_size));
      setChestSize(numberString(talent.chest_size));
      setWaistSize(numberString(talent.waist_size));
      setHipSize(numberString(talent.hip_size));
      setEyeColor(clean(talent.eye_color));
      setHairColor(clean(talent.hair_color));
      setModelingTypes(listString(talent.modeling_types));
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

  const country = useMemo(() => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode), [countryCode]);
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
      payload.set("languages", languages);
      payload.set("dialects", dialects);
      payload.set("skills", skills);
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
      payload.set("modeling_types", modelingTypes);
    }

    const result = await updateOwnTalentCoreDetailsAction(payload);
    setMessage(result.message);
    setSuccess(result.success);
    setSaving(false);
  }

  if (loading) {
    return <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white"><div className="mx-auto max-w-3xl animate-pulse space-y-4"><div className="h-10 w-64 rounded-xl bg-white/5"/><div className="h-96 rounded-[2rem] bg-white/[0.03]"/></div></main>;
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.05] p-7 text-center">
          <h1 className="text-2xl font-light">{isArabic ? "تعذر تحميل بياناتك" : "Unable to load your details"}</h1>
          <p className="mt-3 text-sm text-white/55">{loadError}</p>
          <button onClick={() => void load()} className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">{isArabic ? "إعادة المحاولة" : "Try again"}</button>
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
            <p className="mt-3 text-sm leading-7 text-white/50">{isArabic ? "البيانات الأساسية أولًا، ثم تظهر الحقول المهنية المناسبة لنوع موهبتك." : "Start with core details, then complete the professional fields relevant to your talent type."}</p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">{isArabic ? "رجوع" : "Back"}</Link>
        </div>

        {!editable ? <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-7 text-amber-100">{isArabic ? "ملفك قيد المراجعة أو معتمد، لذلك تم إيقاف تعديل البيانات الأساسية هنا لحماية الملف." : "Your profile is under review or approved, so core identity editing is locked here."}</div> : null}

        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "البيانات الأساسية" : "CORE DETAILS"}</p>
            <p className="mt-2 text-sm text-white/45">{isArabic ? "هذه البيانات مطلوبة لإكمال ملفك." : "These details are required to complete your profile."}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label={isArabic ? "الاسم الكامل" : "Full name"}><input value={name} onChange={(e) => setName(e.target.value)} disabled={!editable} required className="input" /></Field>
              <Field label={isArabic ? "رقم الجوال" : "Phone number"}><input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editable} required dir="ltr" className="input text-left" /></Field>
              <Field label={isArabic ? "نوع الموهبة" : "Talent type"}><select value={role} onChange={(e) => setRole(e.target.value)} disabled={!editable} required className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{isArabic ? item.ar : item.en}</option>)}</select></Field>
              <Field label={isArabic ? "الجنس" : "Gender"}><select value={gender} onChange={(e) => setGender(e.target.value)} disabled={!editable} required className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}</select></Field>
              <Field label={isArabic ? "الجنسية" : "Nationality"}><select value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={!editable} required className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}</select></Field>
              <Field label={isArabic ? "بلد الإقامة" : "Country of residence"}><select value={countryCode} onChange={(e) => { setCountryCode(e.target.value); setCitySlug(""); }} disabled={!editable} required className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{TALENT_SIGNUP_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{isArabic ? item.ar : item.en}</option>)}</select></Field>
              <Field label={isArabic ? "المدينة" : "City"}><select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} disabled={!editable || !country} required className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{(country?.cities ?? []).map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}</select></Field>
            </div>
          </section>

          {showActorFields ? (
            <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "بيانات الممثل" : "ACTOR PROFILE"}</p><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span></div>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "معلومات تساعد الجهات على اختيارك" : "Details that help publishers cast you"}</h2>
              <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? "هذه المعلومات تقوي المطابقة ولا تمنع اعتماد الملف. الفيديو وShowreel وروابط السوشيال موجودة في معرض الأعمال." : "These details improve matching and never block approval. Video, showreel and social links live in Portfolio."}</p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label={isArabic ? "العمر التمثيلي من" : "Playing age from"}><input type="number" min="1" max="120" value={actingAgeMin} onChange={(e) => setActingAgeMin(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "العمر التمثيلي إلى" : "Playing age to"}><input type="number" min="1" max="120" value={actingAgeMax} onChange={(e) => setActingAgeMax(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "سنوات الخبرة" : "Years of experience"}><input type="number" min="0" max="80" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "اللغات" : "Languages"} hint={isArabic ? "افصل بين اللغات بفاصلة" : "Separate languages with commas"}><input value={languages} onChange={(e) => setLanguages(e.target.value)} disabled={!editable} placeholder={isArabic ? "العربية، الإنجليزية" : "Arabic, English"} className="input" /></Field>
                <Field label={isArabic ? "اللهجات" : "Dialects"}><input value={dialects} onChange={(e) => setDialects(e.target.value)} disabled={!editable} placeholder={isArabic ? "سعودي، خليجي، مصري" : "Saudi, Gulf, Egyptian"} className="input" /></Field>
                <Field label={isArabic ? "المهارات" : "Skills"}><input value={skills} onChange={(e) => setSkills(e.target.value)} disabled={!editable} placeholder={isArabic ? "تمثيل، ارتجال، أكشن" : "Acting, improv, action"} className="input" /></Field>
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"}><input type="number" min="1" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"}><input type="number" min="1" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "لون العين" : "Eye color"}><input value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "لون الشعر" : "Hair color"}><input value={hairColor} onChange={(e) => setHairColor(e.target.value)} disabled={!editable} className="input" /></Field>
              </div>

              <Link href={`/${locale}/talent-dashboard/gallery/links`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-gold/25 px-5 text-sm text-gold hover:bg-gold/[0.05]">{isArabic ? "إضافة Showreel وروابط السوشيال من معرض الأعمال" : "Add showreel and social links in Portfolio"}</Link>
            </section>
          ) : null}

          {showModelFields ? (
            <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "بيانات المودل" : "MODEL PROFILE"}</p><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span></div>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "المقاسات والمظهر المهني" : "Professional measurements and appearance"}</h2>
              <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? "هذه البيانات مهمة لفرص المودل والمطابقة الدقيقة، لكنها لا تمنع اعتماد الملف." : "These details support model opportunities and accurate matching but never block approval."}</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"}><input type="number" min="1" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"}><input type="number" min="1" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "مقاس الملابس" : "Clothing size"}><input value={clothingSize} onChange={(e) => setClothingSize(e.target.value)} disabled={!editable} placeholder="S / M / L" className="input" /></Field>
                <Field label={isArabic ? "مقاس الحذاء" : "Shoe size"}><input type="number" min="1" max="60" step="0.5" value={shoeSize} onChange={(e) => setShoeSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الصدر (سم)" : "Chest (cm)"}><input type="number" min="1" max="250" value={chestSize} onChange={(e) => setChestSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الخصر (سم)" : "Waist (cm)"}><input type="number" min="1" max="250" value={waistSize} onChange={(e) => setWaistSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "الورك (سم)" : "Hips (cm)"}><input type="number" min="1" max="250" value={hipSize} onChange={(e) => setHipSize(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "لون العين" : "Eye color"}><input value={eyeColor} onChange={(e) => setEyeColor(e.target.value)} disabled={!editable} className="input" /></Field>
                <Field label={isArabic ? "لون الشعر" : "Hair color"}><input value={hairColor} onChange={(e) => setHairColor(e.target.value)} disabled={!editable} className="input" /></Field>
                <div className="sm:col-span-2 lg:col-span-3"><Field label={isArabic ? "أنواع المودل" : "Modeling types"}><input value={modelingTypes} onChange={(e) => setModelingTypes(e.target.value)} disabled={!editable} placeholder={isArabic ? "إعلاني، أزياء، منتجات" : "Commercial, fashion, product"} className="input" /></Field></div>
              </div>
              <Link href={`/${locale}/talent-dashboard/gallery/links`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-gold/25 px-5 text-sm text-gold hover:bg-gold/[0.05]">{isArabic ? "إضافة الفيديو وروابط السوشيال من معرض الأعمال" : "Add video and social links in Portfolio"}</Link>
            </section>
          ) : null}

          {!showActorFields && !showModelFields ? <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6"><p className="text-sm leading-7 text-white/50">{isArabic ? "البيانات الأساسية تكفي للاعتماد حاليًا. الصور والفيديو وروابطك المهنية موجودة في معرض الأعمال." : "Core details are enough for approval right now. Photos, video and professional links live in Portfolio."}</p><Link href={`/${locale}/talent-dashboard/gallery`} className="mt-4 inline-flex text-sm text-gold">{isArabic ? "فتح معرض الأعمال" : "Open Portfolio"}</Link></section> : null}

          {message ? <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={!editable || saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">{saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التعديلات" : "Save changes")}</button>
            <Link href={`/${locale}/talent-dashboard/profile`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:border-gold/30 hover:text-gold">{isArabic ? "إلغاء" : "Cancel"}</Link>
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
  return <label className="block"><span className="mb-2 block text-xs text-white/50">{label}</span>{children}{hint ? <span className="mt-2 block text-[11px] text-white/30">{hint}</span> : null}</label>;
}
