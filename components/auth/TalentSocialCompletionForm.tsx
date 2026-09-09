"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  TALENT_SIGNUP_COUNTRIES,
} from "@/lib/data/talent-signup";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  suggestedName: string;
  email: string;
  initial?: {
    nationality?: string;
    gender?: string;
    residenceCountryCode?: string;
    citySlug?: string;
    talentType?: string;
    profileVisibility?: "public" | "private";
  };
};

function normalizeLocalPhone(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 15);
}

export function TalentSocialCompletionForm({ locale, suggestedName, email, initial }: Props) {
  const isRtl = locale === "ar";
  const router = useRouter();
  const [fullName, setFullName] = useState(suggestedName);
  const [phoneCountry, setPhoneCountry] = useState("SA");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState(initial?.nationality ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [residenceCountry, setResidenceCountry] = useState(initial?.residenceCountryCode ?? "SA");
  const [city, setCity] = useState(initial?.citySlug ?? "");
  const [talentType, setTalentType] = useState(initial?.talentType ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(initial?.profileVisibility ?? "public");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedPhoneCountry = useMemo(() => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === phoneCountry) ?? TALENT_SIGNUP_COUNTRIES[0], [phoneCountry]);
  const selectedResidenceCountry = useMemo(() => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === residenceCountry) ?? TALENT_SIGNUP_COUNTRIES[0], [residenceCountry]);
  const normalizedPhone = phone ? `${selectedPhoneCountry.dialCode}${phone}` : "";
  const inputClass = "min-h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-gold/60";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
    const selectedCity = selectedResidenceCountry.cities.find((item) => item.value === city);
    if (cleanName.length < 2) return setError(isRtl ? "أدخل اسمًا صحيحًا." : "Enter a valid name.");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) return setError(isRtl ? "أدخل رقم جوال صحيحًا." : "Enter a valid mobile number.");
    if (!nationality || !gender || !category || !selectedCity) return setError(isRtl ? "أكمل جميع البيانات المطلوبة." : "Complete all required information.");
    if (!acceptedTerms || !acceptedAccuracy) return setError(isRtl ? "يجب الموافقة على الشروط ودقة البيانات والتواصل." : "Accept the terms and data/contact consent.");

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const now = new Date().toISOString();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("NO_USER");

      const metadata = {
        ...(user.user_metadata ?? {}),
        full_name: cleanName,
        display_name: cleanName,
        phone: normalizedPhone,
        phone_country_iso: selectedPhoneCountry.code,
        phone_country_code: selectedPhoneCountry.dialCode,
        account_type: "talent",
        signup_intent: "talent",
        talent_type: category.slug,
        nationality_slug: nationality,
        gender,
        residence_country_code: selectedResidenceCountry.code,
        city_slug: selectedCity.value,
        city_ar: selectedCity.ar,
        city_en: selectedCity.en,
        profile_visibility: visibility,
        preferred_locale: locale,
        terms_accepted: true,
        terms_accepted_at: now,
        data_accuracy_contact_consent: true,
        data_accuracy_contact_consent_at: now,
        onboarding_status: "profile_in_progress",
        onboarding_step: "dashboard",
      };

      const { error: metadataError } = await supabase.auth.updateUser({ data: metadata });
      if (metadataError) throw metadataError;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("NO_SESSION");

      const response = await fetch("/api/account/details", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ displayName: cleanName, phone: normalizedPhone, accountType: "talent" }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.code ?? "FINALIZE_FAILED");

      window.dispatchEvent(new Event("mlamh:account-updated"));
      router.replace(`/${locale}/talent-dashboard`);
      router.refresh();
    } catch (submitError) {
      console.error("[TalentSocialCompletionForm]", submitError);
      setError(isRtl ? "تعذر تجهيز حسابك الآن. تحقق من البيانات وحاول مرة أخرى." : "We could not prepare your account. Check the information and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] px-4 py-3 text-sm leading-6 text-white/65">
        {isRtl ? "تم استلام بعض بياناتك من Google. أكمل الحقول المطلوبة أدناه مرة واحدة فقط." : "We received some information from Google. Complete the required fields below once."}
      </div>
      {error ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الاسم الكامل" : "Full name"}><input required value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} className={inputClass} /></Field>
        <Field label={isRtl ? "البريد الإلكتروني" : "Email"}><input value={email} readOnly dir="ltr" className={`${inputClass} cursor-not-allowed text-left opacity-60`} /></Field>
      </div>

      <Field label={isRtl ? "رقم الجوال" : "Mobile number"}>
        <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
          <select value={phoneCountry} onChange={(e) => { setPhoneCountry(e.currentTarget.value); setPhone(""); }} className={inputClass}>{TALENT_SIGNUP_COUNTRIES.map((item) => <option key={item.code} value={item.code} className="bg-black">{item.dialCode} {isRtl ? item.ar : item.en}</option>)}</select>
          <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(normalizeLocalPhone(e.currentTarget.value))} placeholder={selectedPhoneCountry.phoneExample} dir="ltr" className={`${inputClass} text-left`} />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الجنسية" : "Nationality"}><select required value={nationality} onChange={(e) => setNationality(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر الجنسية" : "Select nationality"}</option>{NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
        <Field label={isRtl ? "الجنس" : "Gender"}><select required value={gender} onChange={(e) => setGender(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر" : "Select"}</option>{GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "بلد الإقامة" : "Country of residence"}><select required value={residenceCountry} onChange={(e) => { setResidenceCountry(e.currentTarget.value); setCity(""); }} className={inputClass}>{TALENT_SIGNUP_COUNTRIES.map((item) => <option key={item.code} value={item.code} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
        <Field label={isRtl ? "المدينة" : "City"}><select required value={city} onChange={(e) => setCity(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>{selectedResidenceCountry.cities.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
      </div>

      <Field label={isRtl ? "نوع الموهبة" : "Talent type"}><select required value={talentType} onChange={(e) => setTalentType(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر نوع الموهبة" : "Select talent type"}</option>{TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>

      <div>
        <p className="mb-3 text-sm font-medium text-white/75">{isRtl ? "ظهور الملف" : "Profile visibility"}<span className="text-gold"> *</span></p>
        <div className="grid gap-3">
          {PROFILE_VISIBILITY_OPTIONS.map((option) => <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 ${visibility === option.value ? "border-gold/50 bg-gold/[0.06]" : "border-white/10 bg-black/20"}`}><div className="flex items-start gap-3"><input type="radio" checked={visibility === option.value} onChange={() => setVisibility(option.value)} className="mt-1 accent-[#c8a96a]"/><span><strong className="block text-sm">{isRtl ? option.ar : option.en}</strong><span className="mt-1 block text-xs leading-6 text-white/45">{isRtl ? option.descriptionAr : option.descriptionEn}</span></span></div></label>)}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" required checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.currentTarget.checked)} className="mt-1 h-5 w-5 accent-[#c8a96a]"/><span className="text-xs leading-6 text-white/55">{isRtl ? "أوافق على " : "I agree to the "}<Link href={`/${locale}/terms`} target="_blank" className="text-gold">{isRtl ? "الشروط" : "Terms"}</Link>{isRtl ? " و" : " and "}<Link href={`/${locale}/privacy`} target="_blank" className="text-gold">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.</span></label>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" required checked={acceptedAccuracy} onChange={(e) => setAcceptedAccuracy(e.currentTarget.checked)} className="mt-1 h-5 w-5 accent-[#c8a96a]"/><span className="text-xs leading-6 text-white/55">{isRtl ? "أؤكد صحة البيانات وأسمح لملامح بحفظها والتواصل معي بخصوص الفرص والمشاريع المناسبة." : "I confirm the data is accurate and allow MLAMH to store it and contact me about relevant opportunities and projects."}</span></label>

      <button type="submit" disabled={submitting} className="min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:opacity-60">{submitting ? (isRtl ? "جارٍ تجهيز حسابك..." : "Preparing your account...") : (isRtl ? "حفظ والدخول إلى لوحة التحكم" : "Save and open dashboard")}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm text-white/70">{label}<span className="text-gold"> *</span></span>{children}</label>;
}
