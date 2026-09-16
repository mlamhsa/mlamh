"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { NationalityCombobox } from "@/components/talent-dashboard/NationalityCombobox";
import { SaudiCityCombobox } from "@/components/talent-dashboard/SaudiCityCombobox";
import { updateOwnTalentBirthDateAction } from "@/lib/actions/update-own-talent-birth-date";
import { updateOwnTalentCoreDetailsAction } from "@/lib/actions/update-own-talent-core-details";
import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { ACTIVE_TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-active-market";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS } from "@/lib/data/talent-signup";
import { normalizeNationalitySlug } from "@/lib/data/nationality-normalization";
import { normalizeSaudiCitySlug, SAUDI_CITIES } from "@/lib/data/saudi-cities";
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
  date_of_birth?: string | null;
  data_accuracy_contact_consent?: boolean | null;
  approval_status?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const BIRTH_MONTHS = [
  { value: "01", ar: "يناير", en: "January" },
  { value: "02", ar: "فبراير", en: "February" },
  { value: "03", ar: "مارس", en: "March" },
  { value: "04", ar: "أبريل", en: "April" },
  { value: "05", ar: "مايو", en: "May" },
  { value: "06", ar: "يونيو", en: "June" },
  { value: "07", ar: "يوليو", en: "July" },
  { value: "08", ar: "أغسطس", en: "August" },
  { value: "09", ar: "سبتمبر", en: "September" },
  { value: "10", ar: "أكتوبر", en: "October" },
  { value: "11", ar: "نوفمبر", en: "November" },
  { value: "12", ar: "ديسمبر", en: "December" },
] as const;

export default function TalentRequiredFieldsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [approvalStatus, setApprovalStatus] = useState("not_submitted");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [consent, setConsent] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const talent = (await getOwnTalentProfileAction(locale)) as TalentRecord | null;
      if (!talent) {
        throw new Error(isArabic ? "لم يتم العثور على ملف الموهبة." : "Talent profile was not found.");
      }

      setApprovalStatus(clean(talent.approval_status) || "not_submitted");
      setName(clean(talent.name_ar) || clean(talent.name_en));
      setPhone(clean(talent.phone));
      setRole(clean(talent.primary_role) || clean(talent.category_slug));
      setGender(clean(talent.gender));
      setNationality(
        normalizeNationalitySlug(
          clean(talent.nationality_slug) || clean(talent.nationality),
        ),
      );
      setCountryCode(clean(talent.base_country_code).toUpperCase());
      setCitySlug(normalizeSaudiCitySlug(clean(talent.city_slug)));
      const storedBirthDate = clean(talent.date_of_birth).slice(0, 10);
      const [storedYear = "", storedMonth = "", storedDay = ""] = storedBirthDate.split("-");
      setBirthYear(storedYear);
      setBirthMonth(storedMonth);
      setBirthDay(storedDay);
      setConsent(talent.data_accuracy_contact_consent === true);
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
    () => ACTIVE_TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode),
    [countryCode],
  );
  const roleOption = useMemo(
    () => TALENT_CATEGORIES.find((item) => item.slug === role),
    [role],
  );
  const genderOption = useMemo(
    () => GENDER_OPTIONS.find((item) => item.value === gender),
    [gender],
  );
  const nationalityOption = useMemo(
    () => NATIONALITY_OPTIONS.find((item) => item.value === nationality),
    [nationality],
  );
  const cityOption = useMemo(
    () => SAUDI_CITIES.find((item) => item.slug === citySlug),
    [citySlug],
  );
  const coreEditable = ["not_submitted", "rejected", "changes_requested"].includes(approvalStatus);
  const isApproved = approvalStatus === "approved";
  const isUnderReview = approvalStatus === "submitted" || approvalStatus === "pending";
  const currentYear = new Date().getFullYear();
  const birthYears = useMemo(
    () => Array.from({ length: currentYear - 1900 + 1 }, (_, index) => String(currentYear - index)),
    [currentYear],
  );
  const birthDays = useMemo(() => {
    const year = Number(birthYear) || 2000;
    const month = Number(birthMonth) || 1;
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, "0"));
  }, [birthMonth, birthYear]);

  useEffect(() => {
    if (birthDay && !birthDays.includes(birthDay)) {
      setBirthDay(birthDays.at(-1) ?? "");
    }
  }, [birthDay, birthDays]);

  function selectCountry(value: string) {
    setCountryCode(value);
    setCitySlug("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !coreEditable) return;

    setSaving(true);
    setMessage("");
    setSuccess(false);

    const hasAnyBirthPart = Boolean(birthDay || birthMonth || birthYear);
    const hasCompleteBirthDate = Boolean(birthDay && birthMonth && birthYear);
    if (hasAnyBirthPart && !hasCompleteBirthDate) {
      setMessage(isArabic ? "اختر اليوم والشهر والسنة لإكمال تاريخ الميلاد." : "Select day, month and year to complete the date of birth.");
      setSaving(false);
      return;
    }

    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("name", name);
    payload.set("phone", phone);
    payload.set("primary_role", role);
    payload.set("gender", gender);
    payload.set("nationality_slug", nationality);
    payload.set("base_country_code", countryCode);
    payload.set("city_slug", citySlug);
    payload.set("data_accuracy_contact_consent", String(consent));

    const coreResult = await updateOwnTalentCoreDetailsAction(payload);
    if (!coreResult.success) {
      setMessage(coreResult.message);
      setSaving(false);
      return;
    }

    if (hasCompleteBirthDate) {
      const birthDatePayload = new FormData();
      birthDatePayload.set("locale", locale);
      birthDatePayload.set("date_of_birth", `${birthYear}-${birthMonth}-${birthDay}`);
      const birthDateResult = await updateOwnTalentBirthDateAction(birthDatePayload);
      if (!birthDateResult.success) {
        setMessage(birthDateResult.message);
        setSaving(false);
        return;
      }
    }

    setSuccess(true);
    setMessage(isArabic ? "تم حفظ البيانات الأساسية بنجاح." : "Basic information saved successfully.");
    await load();
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-56 rounded-xl bg-white/5" />
          <div className="h-96 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.05] p-7 text-center">
          <h1 className="text-2xl font-light">{isArabic ? "تعذر فتح البيانات الأساسية" : "Unable to open basic information"}</h1>
          <p className="mt-3 text-sm text-white/55">{loadError}</p>
          <button type="button" onClick={() => void load()} className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  const protectedBirthDate = birthDay && birthMonth && birthYear
    ? `${birthDay}/${birthMonth}/${birthYear}`
    : "—";

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              {isArabic ? "البيانات الأساسية" : "BASIC INFORMATION"}
            </p>
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">
              {isArabic ? "إدارة بياناتك الأساسية" : "Manage your basic information"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
              {isArabic
                ? "حدّث بياناتك الأساسية هنا. هذه الحقول تدخل ضمن متطلبات المراجعة، بينما إعداد ظهور الملف يُدار من قسم الخصوصية داخل «ملفي»."
                : "Update your basic information here. These fields are part of review requirements, while profile visibility is managed from Privacy in My Profile."}
            </p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">
            {isArabic ? "ملفي" : "Profile"}
          </Link>
        </div>

        {!coreEditable ? (
          <div className="space-y-4">
            <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 text-sm leading-7 text-amber-100">
              {isApproved
                ? (isArabic
                    ? "يمكنك تحديث ملفك في أي وقت. البيانات المهنية والخصوصية تُدار مباشرة، بينما تعديل الاسم أو رقم الجوال أو الجنسية يحتاج طلب مراجعة منفصل مع بقاء اعتماد ملفك فعالًا."
                    : "You can keep your profile current at any time. Professional details and privacy can be updated directly, while changes to your name, phone number or nationality use a separate review request and your approval stays active.")
                : (isArabic
                    ? "البيانات الأساسية محمية لأن ملفك قيد المراجعة حاليًا. يمكنك الاطلاع عليها هنا، ولا تحتاج إلى إجراء أي تغيير حتى يصدر قرار المراجعة."
                    : "Basic information is protected while your profile is under review. You can review it here, and no changes are needed until the review decision is issued.")}
            </div>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                <ReadOnlyField label={isArabic ? "الاسم الكامل" : "Full name"} value={name || "—"} />
                <ReadOnlyField label={isArabic ? "رقم الجوال" : "Phone number"} value={phone || "—"} dir="ltr" />
                <ReadOnlyField label={isArabic ? "نوع الموهبة" : "Talent type"} value={roleOption ? (isArabic ? roleOption.ar : roleOption.en) : role || "—"} />
                <ReadOnlyField label={isArabic ? "الجنس" : "Gender"} value={genderOption ? (isArabic ? genderOption.ar : genderOption.en) : gender || "—"} />
                <ReadOnlyField label={isArabic ? "الجنسية" : "Nationality"} value={nationalityOption ? (isArabic ? nationalityOption.ar : nationalityOption.en) : nationality || "—"} />
                <ReadOnlyField label={isArabic ? "بلد الإقامة" : "Country of residence"} value={country ? (isArabic ? country.ar : country.en) : countryCode || "—"} />
                <ReadOnlyField label={isArabic ? "المدينة" : "City"} value={cityOption ? (isArabic ? cityOption.ar : cityOption.en) : citySlug || "—"} />
                <ReadOnlyField label={isArabic ? "تاريخ الميلاد" : "Date of birth"} value={protectedBirthDate} dir="ltr" />
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {isApproved ? (
                <Link href={`/${locale}/talent-dashboard/profile/change-request`} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gold px-7 text-sm font-semibold text-black">
                  {isArabic ? "طلب تعديل الاسم أو الجوال أو الجنسية" : "Request a protected detail change"}
                </Link>
              ) : null}
              <Link href={`/${locale}/talent-dashboard/profile/details`} className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-7 text-sm ${isApproved ? "border border-white/10 text-white/60 hover:border-gold/30 hover:text-gold" : "bg-gold font-semibold text-black"}`}>
                {isArabic ? "إدارة البيانات المهنية" : "Manage professional details"}
              </Link>
              <Link href={`/${locale}/talent-dashboard/profile/privacy`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:border-gold/30 hover:text-gold">
                {isArabic ? "إدارة الخصوصية" : "Manage privacy"}
              </Link>
            </div>
            {isApproved ? (
              <p className="text-xs leading-6 text-white/35">
                {isArabic
                  ? "تاريخ الميلاد وبقية البيانات الأساسية المحمية لا تتغير من هذا المسار حاليًا."
                  : "Date of birth and other protected core fields are not changed through this request flow at this time."}
              </p>
            ) : isUnderReview ? (
              <p className="text-xs leading-6 text-white/35">
                {isArabic ? "يمكنك متابعة بياناتك المهنية والخصوصية دون التأثير على المراجعة الحالية." : "You can still manage professional details and privacy without affecting the current review."}
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={save} className="space-y-5" noValidate>
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={isArabic ? "الاسم الكامل" : "Full name"}>
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
                </Field>

                <Field label={isArabic ? "رقم الجوال" : "Phone number"}>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="input text-left" />
                </Field>

                <Field label={isArabic ? "نوع الموهبة" : "Talent type"}>
                  <select id="primary_role" value={role} onChange={(e) => setRole(e.target.value)} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {TALENT_CATEGORIES.map((item) => (
                      <option key={item.slug} value={item.slug}>{isArabic ? item.ar : item.en}</option>
                    ))}
                  </select>
                </Field>

                <Field label={isArabic ? "الجنس" : "Gender"}>
                  <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {GENDER_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>
                    ))}
                  </select>
                </Field>

                <div className="block">
                  <span className="mb-2 block text-sm text-white/70">
                    {isArabic ? "الجنسية" : "Nationality"}
                  </span>
                  <NationalityCombobox
                    id="nationality"
                    locale={locale}
                    value={nationality}
                    onChange={setNationality}
                    name=""
                    showLabel={false}
                  />
                </div>

                <Field label={isArabic ? "بلد الإقامة" : "Country of residence"}>
                  <select id="country" value={countryCode} onChange={(e) => selectCountry(e.target.value)} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {ACTIVE_TALENT_SIGNUP_COUNTRIES.map((item) => (
                      <option key={item.code} value={item.code}>{isArabic ? item.ar : item.en}</option>
                    ))}
                  </select>
                </Field>

                <div className="block">
                  <span className="mb-2 block text-sm text-white/70">
                    {isArabic ? "المدينة" : "City"}
                  </span>
                  <SaudiCityCombobox
                    id="city"
                    locale={locale}
                    value={citySlug}
                    onChange={setCitySlug}
                    name=""
                    showLabel={false}
                    disabled={!country}
                  />
                </div>

                <div className="block sm:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm text-white/70">
                    <span>{isArabic ? "تاريخ الميلاد" : "Date of birth"}</span>
                    <span className="text-xs text-white/35">{isArabic ? "بالتقويم الميلادي" : "Gregorian calendar"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5" dir={isArabic ? "rtl" : "ltr"}>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] text-white/35">{isArabic ? "اليوم" : "Day"}</span>
                      <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className="input date-part">
                        <option value="">—</option>
                        {birthDays.map((day) => <option key={day} value={day}>{Number(day)}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] text-white/35">{isArabic ? "الشهر" : "Month"}</span>
                      <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className="input date-part">
                        <option value="">—</option>
                        {BIRTH_MONTHS.map((month) => <option key={month.value} value={month.value}>{isArabic ? month.ar : month.en}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] text-white/35">{isArabic ? "السنة" : "Year"}</span>
                      <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className="input date-part" dir="ltr">
                        <option value="">—</option>
                        {birthYears.map((year) => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-white/30">
                    {isArabic ? `متاح حتى سنة ${currentYear} لدعم مواهب الأطفال.` : `Available through ${currentYear} to support child talent profiles.`}
                  </p>
                </div>
              </div>
            </section>

            <section id="data_accuracy_contact_consent" className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-gold" />
                <span className="text-sm leading-7 text-white/70">
                  {isArabic
                    ? "أؤكد أن البيانات التي أدخلتها صحيحة، وأوافق على تواصل ملامح معي بخصوص ملفي والفرص المناسبة."
                    : "I confirm that the information I entered is accurate and agree that MLAMH may contact me about my profile and relevant opportunities."}
                </span>
              </label>
            </section>

            {message ? (
              <div className={`rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>
                {message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">
                {saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ البيانات الأساسية" : "Save basic information")}
              </button>
              <Link href={`/${locale}/talent-dashboard/profile/privacy`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:border-gold/30 hover:text-gold">
                {isArabic ? "إدارة الخصوصية" : "Manage privacy"}
              </Link>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .input { width:100%; min-height:3.5rem; border-radius:1rem; border:1px solid rgba(255,255,255,.1); background:rgba(0,0,0,.28); padding:.75rem 1rem; color:white; outline:none; }
        .input:focus { border-color:rgba(197,160,89,.55); }
        .input:disabled { opacity:.5; cursor:not-allowed; }
        .date-part { appearance:none; -webkit-appearance:none; text-align:center; text-align-last:center; padding-inline:.5rem; }
      `}</style>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm text-white/70">
        <span>{label}</span>
        {hint ? <span className="text-xs text-white/35">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-2 text-sm text-white/80" dir={dir}>{value}</p>
    </div>
  );
}
