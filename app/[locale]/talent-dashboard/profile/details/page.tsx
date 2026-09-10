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
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error(isArabic ? "استغرق تحميل البيانات وقتًا أطول من المعتاد." : "Loading took longer than expected.")), 8000);
      });
      const talent = (await Promise.race([
        getOwnTalentProfileAction(locale),
        timeout,
      ])) as TalentRecord | null;

      if (!talent) {
        throw new Error(isArabic ? "لم يتم العثور على ملف الموهبة." : "Talent profile was not found.");
      }

      setName(clean(talent.name_ar) || clean(talent.name_en));
      setPhone(clean(talent.phone));
      setRole(clean(talent.primary_role) || clean(talent.category_slug));
      setGender(clean(talent.gender));
      setNationality(clean(talent.nationality_slug) || clean(talent.nationality));
      setCountryCode(clean(talent.base_country_code).toUpperCase());
      setCitySlug(clean(talent.city_slug));
      setApprovalStatus(clean(talent.approval_status) || "not_submitted");
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

    const result = await updateOwnTalentCoreDetailsAction(payload);
    setMessage(result.message);
    setSuccess(result.success);
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
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
            <h1 className="mt-2 text-3xl font-light sm:text-4xl">{isArabic ? "تعديل البيانات الأساسية" : "Edit core details"}</h1>
            <p className="mt-3 text-sm leading-7 text-white/50">{isArabic ? "صفحة خفيفة ومباشرة بدون حفظ تلقائي. عدّل ما تحتاجه ثم اضغط حفظ مرة واحدة." : "A lightweight editor without autosave. Make your changes, then save once."}</p>
          </div>
          <Link href={`/${locale}/talent-dashboard/profile`} className="shrink-0 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-gold">{isArabic ? "رجوع" : "Back"}</Link>
        </div>

        {!editable ? (
          <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-sm leading-7 text-amber-100">
            {isArabic
              ? "ملفك قيد المراجعة أو معتمد، لذلك تم إيقاف تعديل البيانات الأساسية هنا لحماية الملف. سنبقي التغييرات المحمية ضمن مسار مراجعة منفصل."
              : "Your profile is under review or approved, so core identity editing is locked here. Protected changes will continue through a separate review flow."}
          </div>
        ) : null}

        <form onSubmit={save} className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={isArabic ? "الاسم الكامل" : "Full name"}>
              <input value={name} onChange={(e) => setName(e.target.value)} disabled={!editable} required className="input" />
            </Field>
            <Field label={isArabic ? "رقم الجوال" : "Phone number"}>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editable} required dir="ltr" className="input" />
            </Field>

            <Field label={isArabic ? "نوع الموهبة" : "Talent type"}>
              <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!editable} required className="input">
                <option value="">{isArabic ? "اختر" : "Select"}</option>
                {TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{isArabic ? item.ar : item.en}</option>)}
              </select>
            </Field>

            <Field label={isArabic ? "الجنس" : "Gender"}>
              <select value={gender} onChange={(e) => setGender(e.target.value)} disabled={!editable} required className="input">
                <option value="">{isArabic ? "اختر" : "Select"}</option>
                {GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
              </select>
            </Field>

            <Field label={isArabic ? "الجنسية" : "Nationality"}>
              <select value={nationality} onChange={(e) => setNationality(e.target.value)} disabled={!editable} required className="input">
                <option value="">{isArabic ? "اختر" : "Select"}</option>
                {NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
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
                {TALENT_SIGNUP_COUNTRIES.map((item) => <option key={item.code} value={item.code}>{isArabic ? item.ar : item.en}</option>)}
              </select>
            </Field>

            <Field label={isArabic ? "المدينة" : "City"}>
              <select value={citySlug} onChange={(e) => setCitySlug(e.target.value)} disabled={!editable || !country} required className="input">
                <option value="">{isArabic ? "اختر" : "Select"}</option>
                {(country?.cities ?? []).map((item) => <option key={item.value} value={item.value}>{isArabic ? item.ar : item.en}</option>)}
              </select>
            </Field>
          </div>

          {message ? (
            <div className={`mt-5 rounded-2xl border p-4 text-sm ${success ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100" : "border-red-400/20 bg-red-400/[0.05] text-red-100"}`}>{message}</div>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={!editable || saving} className="min-h-12 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">{saving ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ التعديلات" : "Save changes")}</button>
            <Link href={`/${locale}/talent-dashboard/profile`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-7 text-sm text-white/60 hover:border-gold/30 hover:text-gold">{isArabic ? "إلغاء" : "Cancel"}</Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          min-height: 3.5rem;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(0,0,0,.3);
          padding: .75rem 1rem;
          color: white;
          outline: none;
        }
        .input:focus { border-color: rgba(197,160,89,.55); }
        .input:disabled { opacity: .55; cursor: not-allowed; }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs text-white/45">{label}</span>{children}</label>;
}
