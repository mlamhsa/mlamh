"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

import { updateOwnTalentBirthDateAction } from "@/lib/actions/update-own-talent-birth-date";
import { updateOwnTalentCoreDetailsAction } from "@/lib/actions/update-own-talent-core-details";
import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
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
  date_of_birth?: string | null;
  profile_visibility?: string | null;
  data_accuracy_contact_consent?: boolean | null;
  approval_status?: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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
  const [birthDate, setBirthDate] = useState("");
  const [visibility, setVisibility] = useState("");
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
      setNationality(clean(talent.nationality_slug) || clean(talent.nationality));
      setCountryCode(clean(talent.base_country_code).toUpperCase());
      setCitySlug(clean(talent.city_slug));
      setBirthDate(clean(talent.date_of_birth).slice(0, 10));
      setVisibility(clean(talent.profile_visibility).toLowerCase());
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
    () => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === countryCode),
    [countryCode],
  );
  const coreEditable = ["not_submitted", "rejected", "changes_requested", "approved"].includes(approvalStatus);
  const isApproved = approvalStatus === "approved";

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

    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("name", name);
    payload.set("phone", phone);
    payload.set("primary_role", role);
    payload.set("gender", gender);
    payload.set("nationality_slug", nationality);
    payload.set("base_country_code", countryCode);
    payload.set("city_slug", citySlug);
    payload.set("profile_visibility", visibility);
    payload.set("data_accuracy_contact_consent", String(consent));

    const coreResult = await updateOwnTalentCoreDetailsAction(payload);
    if (!coreResult.success) {
      setMessage(coreResult.message);
      setSaving(false);
      return;
    }

    if (birthDate) {
      const birthDatePayload = new FormData();
      birthDatePayload.set("locale", locale);
      birthDatePayload.set("date_of_birth", birthDate);
      const birthDateResult = await updateOwnTalentBirthDateAction(birthDatePayload);
      if (!birthDateResult.success) {
        setMessage(birthDateResult.message);
        setSaving(false);
        return;
      }
    }

    setSuccess(true);
    setMessage(isArabic ? "تم حفظ البيانات المطلوبة بنجاح." : "Required profile details saved successfully.");
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
          <h1 className="text-2xl font-light">{isArabic ? "تعذر فتح البيانات المطلوبة" : "Unable to open required details"}</h1>
          <p className="mt-3 text-sm text-white/55">{loadError}</p>
          <button type="button" onClick={() => void load()} className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              {isApproved
                ? (isArabic ? "البيانات الأساسية" : "CORE DETAILS")
                : (isArabic ? "متطلبات الاعتماد" : "REVIEW REQUIREMENTS")}
            </p>
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">
              {isApproved
                ? (isArabic ? "تعديل بياناتك الأساسية" : "Edit your core details")
                : (isArabic ? "أكمل بياناتك الأساسية" : "Complete your core details")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
              {isApproved
                ? (isArabic
                    ? "ملفك معتمد. يمكنك تحديث بياناتك وحفظها دون فقدان اعتماد الملف."
                    : "Your profile is approved. You can keep these details current without losing approval.")
                : (isArabic
                    ? "احفظ ما أدخلته في أي وقت. لا يلزم إكمال جميع الحقول في جلسة واحدة، لكن يجب اكتمالها قبل إرسال الملف للمراجعة."
                    : "Save whatever you have entered at any time. You do not need to finish every field in one session, but all are required before review submission.")}
            </p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">
            {isArabic ? "رجوع" : "Back"}
          </Link>
        </div>

        {!coreEditable ? (
          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 text-sm leading-7 text-amber-100">
            {isArabic
              ? "ملفك قيد المراجعة حاليًا، لذلك تتوقف تعديلات البيانات الأساسية مؤقتًا حتى يصدر قرار المراجعة."
              : "Your profile is currently under review, so core-detail edits are temporarily paused until a review decision is made."}
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

                <Field label={isArabic ? "الجنسية" : "Nationality"}>
                  <select id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {NATIONALITY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>
                    ))}
                  </select>
                </Field>

                <Field label={isArabic ? "بلد الإقامة" : "Country of residence"}>
                  <select id="country" value={countryCode} onChange={(e) => selectCountry(e.target.value)} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {TALENT_SIGNUP_COUNTRIES.map((item) => (
                      <option key={item.code} value={item.code}>{isArabic ? item.ar : item.en}</option>
                    ))}
                  </select>
                </Field>

                <Field label={isArabic ? "المدينة" : "City"}>
                  <select id="city" value={citySlug} onChange={(e) => setCitySlug(e.target.value)} disabled={!country} className="input">
                    <option value="">{isArabic ? "اختر" : "Select"}</option>
                    {(country?.cities ?? []).map((item) => (
                      <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>
                    ))}
                  </select>
                </Field>

                <Field label={isArabic ? "تاريخ الميلاد" : "Date of birth"} hint={isArabic ? "بالتقويم الميلادي" : "Gregorian calendar"}>
                  <input id="date_of_birth" type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirthDate(e.target.value)} dir="ltr" className="input" />
                </Field>
              </div>
            </section>

            <section id="profile_visibility" className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                {isArabic ? "طريقة ظهور الملف" : "PROFILE VISIBILITY"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {PROFILE_VISIBILITY_OPTIONS.map((option) => {
                  const selected = visibility === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVisibility(option.value)}
                      className={`rounded-2xl border p-4 text-start transition ${selected ? "border-gold/60 bg-gold/[0.08]" : "border-white/10 bg-black/20 hover:border-white/20"}`}
                    >
                      <span className="block text-sm font-semibold text-white">{isArabic ? option.ar : option.en}</span>
                      <span className="mt-2 block text-xs leading-6 text-white/45">{isArabic ? option.descriptionAr : option.descriptionEn}</span>
                    </button>
                  );
                })}
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
                {saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ ما أدخلته" : "Save what you've entered")}
              </button>
              <Link href={`/${locale}/talent-dashboard/profile`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:border-gold/30 hover:text-gold">
                {isArabic ? "العودة للملف" : "Back to profile"}
              </Link>
            </div>
          </form>
        )}
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
      <span className="mb-2 flex items-center justify-between gap-3 text-sm text-white/70">
        <span>{label}</span>
        {hint ? <span className="text-xs text-white/35">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}