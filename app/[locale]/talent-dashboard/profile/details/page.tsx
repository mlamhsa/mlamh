"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState, type ReactNode } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentBirthDateAction } from "@/lib/actions/update-own-talent-birth-date";
import { updateOwnTalentCoreDetailsAction } from "@/lib/actions/update-own-talent-core-details";
import { updateOwnTalentProfessionalDetailsAction } from "@/lib/actions/update-own-talent-professional-details";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  ACTOR_SKILL_CHOICES,
  AVAILABILITY_CHOICES,
  CLOTHING_SIZE_CHOICES,
  EYE_COLOR_CHOICES,
  HAIR_COLOR_CHOICES,
  HAIR_TYPE_CHOICES,
  MODEL_TYPE_CHOICES,
  SKIN_TONE_CHOICES,
  TALENT_DIALECT_CHOICES,
  TALENT_LANGUAGE_CHOICES,
  type TalentProfessionalChoice,
} from "@/lib/data/talent-professional-options";
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
  date_of_birth?: string | null;
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
  hair_type?: string | null;
  skin_color?: string | null;
  modeling_types?: unknown;
  availability_status?: string | null;
  ready_to_travel?: boolean | null;
  has_passport?: boolean | null;
  has_car?: boolean | null;
  work_outside_city?: boolean | null;
  work_outside_country?: boolean | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberString(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function listValues(value: unknown) {
  if (Array.isArray(value)) {
    return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
  }
  const raw = clean(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return [...new Set(parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))];
    }
  } catch {
    // Legacy rows can be comma-separated strings.
  }
  return [...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean))];
}

function bool(value: unknown) {
  return value === true;
}

function withLegacyValues(values: string[], options: TalentProfessionalChoice[]) {
  const known = new Set(options.map((item) => item.value));
  const legacy = values
    .filter((value) => !known.has(value))
    .map((value) => ({ value, ar: value.replaceAll("_", " "), en: value.replaceAll("_", " ") }));
  return [...options, ...legacy];
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
  const [savingBirthDate, setSavingBirthDate] = useState(false);
  const [birthDateMessage, setBirthDateMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [citySlug, setCitySlug] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("not_submitted");
  const [birthDate, setBirthDate] = useState("");

  const [availabilityStatus, setAvailabilityStatus] = useState("available_now");
  const [readyToTravel, setReadyToTravel] = useState(false);
  const [hasPassport, setHasPassport] = useState(false);
  const [hasCar, setHasCar] = useState(false);
  const [workOutsideCity, setWorkOutsideCity] = useState(false);
  const [workOutsideCountry, setWorkOutsideCountry] = useState(false);

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
  const [hairType, setHairType] = useState("");
  const [skinColor, setSkinColor] = useState("");
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
      setCountryCode(clean(talent.base_country_code).toUpperCase() || "SA");
      setCitySlug(clean(talent.city_slug));
      setApprovalStatus(clean(talent.approval_status) || "not_submitted");
      setBirthDate(clean(talent.date_of_birth).slice(0, 10));

      setAvailabilityStatus(clean(talent.availability_status) || "available_now");
      setReadyToTravel(bool(talent.ready_to_travel));
      setHasPassport(bool(talent.has_passport));
      setHasCar(bool(talent.has_car));
      setWorkOutsideCity(bool(talent.work_outside_city));
      setWorkOutsideCountry(bool(talent.work_outside_country));

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
      setHairType(clean(talent.hair_type));
      setSkinColor(clean(talent.skin_color));
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

  const country = useMemo(() => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === "SA"), []);
  const coreEditable = ["not_submitted", "rejected", "changes_requested"].includes(approvalStatus);
  const showActorFields = role === "actor";
  const showModelFields = role === "model";

  function appendProfessionalPayload(payload: FormData) {
    payload.set("availability_status", availabilityStatus);
    payload.set("ready_to_travel", String(readyToTravel));
    payload.set("has_passport", String(hasPassport));
    payload.set("has_car", String(hasCar));
    payload.set("work_outside_city", String(workOutsideCity));
    payload.set("work_outside_country", String(workOutsideCountry));

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
      payload.set("hair_type", hairType);
      payload.set("skin_color", skinColor);
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
      payload.set("hair_type", hairType);
      payload.set("skin_color", skinColor);
      payload.set("modeling_types", modelingTypes.join(","));
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    setSuccess(false);

    const payload = new FormData();
    payload.set("locale", locale);
    appendProfessionalPayload(payload);

    const result = coreEditable
      ? await (async () => {
          payload.set("name", name);
          payload.set("phone", phone);
          payload.set("primary_role", role);
          payload.set("gender", gender);
          payload.set("nationality_slug", nationality);
          payload.set("base_country_code", "SA");
          payload.set("city_slug", citySlug);
          return updateOwnTalentCoreDetailsAction(payload);
        })()
      : await updateOwnTalentProfessionalDetailsAction(payload);

    setMessage(result.message);
    setSuccess(result.success);
    if (result.success) await load();
    setSaving(false);
  }

  async function saveBirthDate() {
    if (!birthDate || savingBirthDate) return;
    setSavingBirthDate(true);
    setBirthDateMessage("");
    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("date_of_birth", birthDate);
    const result = await updateOwnTalentBirthDateAction(payload);
    setBirthDateMessage(result.message);
    if (result.success) await load();
    setSavingBirthDate(false);
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
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">{isArabic ? "تحسين بيانات الموهبة" : "Improve talent profile"}</h1>
            <p className="mt-3 text-sm leading-7 text-white/50">
              {isArabic ? "يمكنك تحديث بياناتك المهنية في أي وقت لزيادة فرص الظهور والمطابقة مع الفرص." : "You can update your professional details at any time to improve discovery and matching."}
            </p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">{isArabic ? "رجوع" : "Back"}</Link>
        </div>

        {!coreEditable ? (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm leading-7 text-emerald-100">
            {isArabic
              ? "اعتماد ملفك محفوظ. البيانات الأساسية محمية، بينما يمكنك تعديل البيانات المهنية الاختيارية وتاريخ الميلاد دون إعادة إرسال الملف للمراجعة."
              : "Your approval stays intact. Core identity fields are protected, while optional professional details and date of birth remain editable without resubmitting."}
          </div>
        ) : null}

        <form onSubmit={save} className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "البيانات الأساسية" : "CORE DETAILS"}</p>
                <p className="mt-2 text-sm text-white/45">{coreEditable ? (isArabic ? "يمكن تعديلها قبل الاعتماد أو عند طلب تحديث." : "Editable before approval or when changes are requested.") : (isArabic ? "محفوظة لحماية هوية الملف المعتمد." : "Protected to preserve the approved profile identity.")}</p>
              </div>
              {!coreEditable ? <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "محمي" : "Protected"}</span> : null}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label={isArabic ? "الاسم الكامل" : "Full name"}><input value={name} onChange={(e) => setName(e.target.value)} disabled={!coreEditable} required className="input" /></Field>
              <Field label={isArabic ? "رقم الجوال" : "Phone number"}><input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!coreEditable} required dir="ltr" className="input text-left" /></Field>
              <Field label={isArabic ? "نوع الموهبة" : "Talent type"}>
                <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!coreEditable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{isArabic ? item.ar : item.en}</option>)}
                </select>
              </Field>
              <Field label={isArabic ? "الجنس" : "Gender"}>
                <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={!coreEditable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
                </select>
              </Field>
              <Field label={isArabic ? "الجنسية" : "Nationality"}>
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={!coreEditable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
                </select>
              </Field>
              <Field label={isArabic ? "بلد الإقامة" : "Country of residence"}>
                <select value="SA" disabled className="input">
                  <option value="SA">{isArabic ? "السعودية" : "Saudi Arabia"}</option>
                </select>
              </Field>
              <Field label={isArabic ? "المدينة" : "City"}>
                <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} disabled={!coreEditable} required className="input">
                  <option value="">{isArabic ? "اختر" : "Select"}</option>
                  {(country?.cities ?? []).map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
                </select>
              </Field>
              <Field label={isArabic ? "تاريخ الميلاد" : "Date of birth"} hint={isArabic ? "بالتقويم الميلادي" : "Gregorian calendar"}>
                <div className="flex gap-2">
                  <input type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} dir="ltr" className="input min-w-0 flex-1" />
                  <button type="button" onClick={() => void saveBirthDate()} disabled={!birthDate || savingBirthDate} className="rounded-xl border border-gold/30 px-4 text-xs text-gold disabled:opacity-40">{savingBirthDate ? (isArabic ? "حفظ..." : "Saving...") : (isArabic ? "حفظ" : "Save")}</button>
                </div>
                {birthDateMessage ? <span className="mt-2 block text-[11px] text-white/45">{birthDateMessage}</span> : null}
              </Field>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "التوفر والتنقل" : "AVAILABILITY & MOBILITY"}</p><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span></div>
            <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? "حدّث هذه المعلومات في أي وقت لتساعد الجهات على معرفة مدى ملاءمتك للفرصة." : "Update these signals any time to help publishers understand your fit."}</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={isArabic ? "حالة التوفر" : "Availability"}><SingleChoiceSelect value={availabilityStatus} onChange={setAvailabilityStatus} options={AVAILABILITY_CHOICES} isArabic={isArabic} /></Field></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ToggleCard label={isArabic ? "مستعد للسفر" : "Ready to travel"} checked={readyToTravel} onChange={setReadyToTravel} />
              <ToggleCard label={isArabic ? "لدي جواز سفر" : "I have a passport"} checked={hasPassport} onChange={setHasPassport} />
              <ToggleCard label={isArabic ? "لدي سيارة" : "I have a car"} checked={hasCar} onChange={setHasCar} />
              <ToggleCard label={isArabic ? "أقبل العمل خارج مدينتي" : "Can work outside my city"} checked={workOutsideCity} onChange={setWorkOutsideCity} />
              <ToggleCard label={isArabic ? "أقبل العمل خارج دولة إقامتي" : "Can work outside my country"} checked={workOutsideCountry} onChange={setWorkOutsideCountry} />
            </div>
          </section>

          {showActorFields ? (
            <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "بيانات الممثل" : "ACTOR PROFILE"}</p><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span></div>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "معلومات تساعد الجهات على اختيارك" : "Details that help publishers cast you"}</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label={isArabic ? "العمر التمثيلي من" : "Playing age from"}><input type="number" min="1" max="120" value={actingAgeMin} onChange={(e) => setActingAgeMin(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "العمر التمثيلي إلى" : "Playing age to"}><input type="number" min="1" max="120" value={actingAgeMax} onChange={(e) => setActingAgeMax(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "سنوات الخبرة" : "Years of experience"}><select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{Array.from({ length: 21 }, (_, index) => <option key={index} value={index}>{index === 20 ? (isArabic ? "20+ سنة" : "20+ years") : (isArabic ? `${index} سنة` : `${index} year${index === 1 ? "" : "s"}`)}</option>)}</select></Field>
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"}><input type="number" min="1" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"}><input type="number" min="1" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "لون العين" : "Eye color"}><SingleChoiceSelect value={eyeColor} onChange={setEyeColor} options={EYE_COLOR_CHOICES} isArabic={isArabic} /></Field>
                <Field label={isArabic ? "لون الشعر" : "Hair color"}><SingleChoiceSelect value={hairColor} onChange={setHairColor} options={HAIR_COLOR_CHOICES} isArabic={isArabic} /></Field>
                <Field label={isArabic ? "نوع الشعر" : "Hair type"}><SingleChoiceSelect value={hairType} onChange={setHairType} options={HAIR_TYPE_CHOICES} isArabic={isArabic} /></Field>
                <Field label={isArabic ? "لون البشرة" : "Skin tone"}><SingleChoiceSelect value={skinColor} onChange={setSkinColor} options={SKIN_TONE_CHOICES} isArabic={isArabic} /></Field>
              </div>
              <div className="mt-7 space-y-6">
                <MultiChoiceField label={isArabic ? "اللغات" : "Languages"} values={languages} onChange={setLanguages} options={withLegacyValues(languages, TALENT_LANGUAGE_CHOICES)} isArabic={isArabic} searchable />
                <MultiChoiceField label={isArabic ? "اللهجات" : "Dialects"} values={dialects} onChange={setDialects} options={withLegacyValues(dialects, TALENT_DIALECT_CHOICES)} isArabic={isArabic} searchable />
                <MultiChoiceField label={isArabic ? "المهارات" : "Skills"} values={skills} onChange={setSkills} options={withLegacyValues(skills, ACTOR_SKILL_CHOICES)} isArabic={isArabic} searchable />
              </div>
              <Link href={`/${locale}/talent-dashboard/gallery`} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-2xl border border-gold/25 px-5 text-sm text-gold hover:bg-gold/[0.05]">{isArabic ? "فتح معرض الأعمال وإضافة الفيديو والروابط" : "Open Portfolio to add video and links"}</Link>
            </section>
          ) : null}

          {showModelFields ? (
            <section className="rounded-[2rem] border border-gold/20 bg-gold/[0.03] p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-3"><p className="text-[11px] uppercase tracking-[0.22em] text-gold">{isArabic ? "بيانات المودل" : "MODEL PROFILE"}</p><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/45">{isArabic ? "اختياري" : "Optional"}</span></div>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "المقاسات والمظهر المهني" : "Professional measurements and appearance"}</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Field label={isArabic ? "الطول (سم)" : "Height (cm)"}><input type="number" min="1" max="250" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "الوزن (كجم)" : "Weight (kg)"}><input type="number" min="1" max="300" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "مقاس الملابس" : "Clothing size"}><select value={clothingSize} onChange={(e) => setClothingSize(e.target.value)} className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{CLOTHING_SIZE_CHOICES.map((size) => <option key={size} value={size}>{size}</option>)}</select></Field>
                <Field label={isArabic ? "مقاس الحذاء" : "Shoe size"}><input type="number" min="1" max="60" step="0.5" value={shoeSize} onChange={(e) => setShoeSize(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "الصدر (سم)" : "Chest (cm)"}><input type="number" min="1" max="250" value={chestSize} onChange={(e) => setChestSize(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "الخصر (سم)" : "Waist (cm)"}><input type="number" min="1" max="250" value={waistSize} onChange={(e) => setWaistSize(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "الورك (سم)" : "Hips (cm)"}><input type="number" min="1" max="250" value={hipSize} onChange={(e) => setHipSize(e.target.value)} className="input" /></Field>
                <Field label={isArabic ? "لون العين" : "Eye color"}><SingleChoiceSelect value={eyeColor} onChange={setEyeColor} options={EYE_COLOR_CHOICES} isArabic={isArabic} /></Field>
                <Field label={isArabic ? "لون الشعر" : "Hair color"}><SingleChoiceSelect value={hairColor} onChange={setHairColor} options={HAIR_COLOR_CHOICES} isArabic={isArabic} /></Field>
                <Field label={isArabic ? "نوع الشعر" : "Hair type"}><SingleChoiceSelect value={hairType} onChange={setHairType} options={HAIR_TYPE_CHOICES} isArabic={isArabic} /></Field>
                <Field label={isArabic ? "لون البشرة" : "Skin tone"}><SingleChoiceSelect value={skinColor} onChange={setSkinColor} options={SKIN_TONE_CHOICES} isArabic={isArabic} /></Field>
              </div>
              <div className="mt-7"><MultiChoiceField label={isArabic ? "أنواع المودل" : "Modeling types"} values={modelingTypes} onChange={setModelingTypes} options={withLegacyValues(modelingTypes, MODEL_TYPE_CHOICES)} isArabic={isArabic} searchable /></div>
              <Link href={`/${locale}/talent-dashboard/gallery`} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-2xl border border-gold/25 px-5 text-sm text-gold hover:bg-gold/[0.05]">{isArabic ? "فتح معرض الأعمال وإضافة الفيديو والروابط" : "Open Portfolio to add video and links"}</Link>
            </section>
          ) : null}

          {!showActorFields && !showModelFields ? (
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6"><p className="text-sm leading-7 text-white/50">{isArabic ? "يمكنك إضافة الصور والفيديو والروابط المهنية من معرض الأعمال، ومعلومات التوفر أعلاه تساعد في المطابقة." : "Portfolio media and the availability signals above can strengthen matching."}</p><Link href={`/${locale}/talent-dashboard/gallery`} className="mt-4 inline-flex text-sm text-gold">{isArabic ? "فتح معرض الأعمال" : "Open Portfolio"}</Link></section>
          ) : null}

          {message ? <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">{saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : coreEditable ? (isArabic ? "حفظ التعديلات" : "Save changes") : (isArabic ? "حفظ تحسينات الملف" : "Save profile improvements")}</button>
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

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs text-white/50">{label}</span>{children}{hint ? <span className="mt-2 block text-[11px] text-white/30">{hint}</span> : null}</label>;
}

function SingleChoiceSelect({ value, onChange, options, isArabic }: { value: string; onChange: (value: string) => void; options: TalentProfessionalChoice[]; isArabic: boolean }) {
  const exists = !value || options.some((item) => item.value === value);
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="input"><option value="">{isArabic ? "اختر" : "Select"}</option>{!exists ? <option value={value}>{value.replaceAll("_", " ")}</option> : null}{options.map((option) => <option key={option.value} value={option.value}>{isArabic ? option.ar : option.en}</option>)}</select>;
}

function ToggleCard({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-start transition ${checked ? "border-gold/45 bg-gold/[0.08] text-white" : "border-white/10 bg-black/20 text-white/60"}`}><span className="text-sm">{label}</span><span className={`relative h-6 w-11 shrink-0 rounded-full ${checked ? "bg-gold" : "bg-white/15"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? "end-1" : "start-1"}`} /></span></button>;
}

function MultiChoiceField({ label, values, onChange, options, isArabic, searchable = false }: { label: string; values: string[]; onChange: (values: string[]) => void; options: TalentProfessionalChoice[]; isArabic: boolean; searchable?: boolean }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const filtered = normalized ? options.filter((option) => `${option.ar} ${option.en} ${option.value}`.toLocaleLowerCase().includes(normalized)) : options;
  const selected = filtered.filter((option) => values.includes(option.value));
  const unselected = filtered.filter((option) => !values.includes(option.value));
  const visible = [...selected, ...unselected];

  function toggle(value: string) {
    const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
    onChange([...new Set(next)]);
  }

  return <div><div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs text-white/50">{label}</p><span className="text-[11px] text-white/30">{values.length > 0 ? (isArabic ? `${values.length} محدد` : `${values.length} selected`) : (isArabic ? "يمكن اختيار أكثر من خيار" : "Choose multiple")}</span></div><div className="rounded-2xl border border-white/10 bg-black/20 p-3">{searchable && options.length >= 8 ? <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? `ابحث في ${label}...` : `Search ${label.toLowerCase()}...`} className="mb-3 min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/40" /> : null}<div className="max-h-48 overflow-y-auto pe-1"><div className="flex flex-wrap gap-2">{visible.map((option) => { const isSelected = values.includes(option.value); return <button key={option.value} type="button" onClick={() => toggle(option.value)} aria-pressed={isSelected} className={`rounded-full border px-4 py-2 text-xs transition ${isSelected ? "border-gold/60 bg-gold/15 text-gold" : "border-white/10 bg-white/[0.025] text-white/55 hover:border-gold/30 hover:text-white"}`}>{isSelected ? "✓ " : ""}{isArabic ? option.ar : option.en}</button>; })}{visible.length === 0 ? <span className="px-2 py-3 text-xs text-white/35">{isArabic ? "لا توجد نتائج" : "No results"}</span> : null}</div></div></div></div>;
}
