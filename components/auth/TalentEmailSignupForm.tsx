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

type Props = { locale: "ar" | "en" };

function normalizeLocalPhone(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 15);
}

function signupError(message: string | undefined, isRtl: boolean) {
  const normalized = String(message ?? "").toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("user already")) {
    return isRtl ? "يوجد حساب مرتبط بهذا البريد الإلكتروني. جرّب تسجيل الدخول." : "An account already exists with this email. Try signing in.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests") || normalized.includes("email rate")) {
    return isRtl ? "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى." : "Too many attempts. Please wait a moment and try again.";
  }
  return isRtl ? "تعذر إنشاء الحساب حاليًا. تحقق من البيانات وحاول مرة أخرى." : "Could not create your account. Check your details and try again.";
}

export function TalentEmailSignupForm({ locale }: Props) {
  const isRtl = locale === "ar";
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("SA");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [residenceCountry, setResidenceCountry] = useState("SA");
  const [city, setCity] = useState("");
  const [talentType, setTalentType] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedPhoneCountry = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((country) => country.code === phoneCountry) ?? TALENT_SIGNUP_COUNTRIES[0],
    [phoneCountry],
  );
  const selectedResidenceCountry = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((country) => country.code === residenceCountry) ?? TALENT_SIGNUP_COUNTRIES[0],
    [residenceCountry],
  );
  const normalizedPhone = phone ? `${selectedPhoneCountry.dialCode}${phone}` : "";
  const inputClass = "min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm";
  const requiredMark = <span className="text-gold" aria-hidden="true"> *</span>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setErrorMessage("");

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 100) return setErrorMessage(isRtl ? "أدخل اسمًا صحيحًا." : "Enter a valid name.");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) return setErrorMessage(isRtl ? "أدخل رقم جوال صحيحًا مع مفتاح الدولة." : "Enter a valid mobile number with country code.");
    if (!nationality || !gender || !residenceCountry || !city || !talentType) return setErrorMessage(isRtl ? "أكمل جميع الحقول المطلوبة للمتابعة." : "Complete all required fields to continue.");
    if (password.length < 8) return setErrorMessage(isRtl ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Password must contain at least 8 characters.");
    if (password !== passwordConfirmation) return setErrorMessage(isRtl ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
    if (!acceptedTerms || !acceptedAccuracy) return setErrorMessage(isRtl ? "يجب الموافقة على الشروط ودقة البيانات والتواصل للمتابعة." : "Accept the terms and data/contact consent to continue.");

    const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
    const selectedCity = selectedResidenceCountry.cities.find((item) => item.value === city);
    if (!category || !selectedCity) return setErrorMessage(isRtl ? "تحقق من نوع الموهبة والمدينة." : "Check the talent type and city.");

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const now = new Date().toISOString();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("locale", locale);
      callback.searchParams.set("mode", "signup");
      callback.searchParams.set("type", "talent");
      callback.searchParams.set("provider", "email");

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: {
            full_name: cleanName,
            display_name: cleanName,
            phone: normalizedPhone,
            phone_country_iso: selectedPhoneCountry.code,
            phone_country_code: selectedPhoneCountry.dialCode,
            phone_verified: false,
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
            onboarding_status: "email_verification_required",
            onboarding_step: "email_verification",
            approval_status: "not_submitted",
            preferred_locale: locale,
            terms_accepted: true,
            terms_accepted_at: now,
            data_accuracy_contact_consent: true,
            data_accuracy_contact_consent_at: now,
          },
        },
      });

      if (error) {
        setErrorMessage(signupError(error.message, isRtl));
        setSubmitting(false);
        return;
      }

      if (data.session && data.user) {
        router.replace(`/${locale}/dashboard-router`);
        return;
      }

      const query = new URLSearchParams({ email: cleanEmail, type: "talent" });
      router.replace(`/${locale}/join/verify-email?${query.toString()}`);
    } catch (error) {
      console.error("[TalentEmailSignupForm.signUp]", error);
      setErrorMessage(isRtl ? "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى." : "An error occurred while creating your account. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <p className="text-xs text-white/40"><span className="text-gold">*</span> {isRtl ? "حقل مطلوب" : "Required field"}</p>
      {errorMessage ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الاسم الكامل" : "Full name"} requiredMark={requiredMark}><input required value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} autoComplete="name" className={inputClass} /></Field>
        <Field label={isRtl ? "البريد الإلكتروني" : "Email"} requiredMark={requiredMark}><input required type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} autoComplete="email" dir="ltr" className={`${inputClass} text-left`} /></Field>
      </div>

      <Field label={isRtl ? "رقم الجوال" : "Mobile number"} requiredMark={requiredMark}>
        <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
          <select value={phoneCountry} onChange={(e) => { setPhoneCountry(e.currentTarget.value); setPhone(""); }} className={inputClass}>
            {TALENT_SIGNUP_COUNTRIES.map((country) => <option key={country.code} value={country.code} className="bg-black">{country.dialCode} {isRtl ? country.ar : country.en}</option>)}
          </select>
          <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(normalizeLocalPhone(e.currentTarget.value))} placeholder={selectedPhoneCountry.phoneExample} dir="ltr" className={`${inputClass} text-left`} />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الجنسية" : "Nationality"} requiredMark={requiredMark}><select required value={nationality} onChange={(e) => setNationality(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر الجنسية" : "Select nationality"}</option>{NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
        <Field label={isRtl ? "الجنس" : "Gender"} requiredMark={requiredMark}><select required value={gender} onChange={(e) => setGender(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر" : "Select"}</option>{GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "بلد الإقامة" : "Country of residence"} requiredMark={requiredMark}><select required value={residenceCountry} onChange={(e) => { setResidenceCountry(e.currentTarget.value); setCity(""); }} className={inputClass}>{TALENT_SIGNUP_COUNTRIES.map((country) => <option key={country.code} value={country.code} className="bg-black">{isRtl ? country.ar : country.en}</option>)}</select></Field>
        <Field label={isRtl ? "المدينة" : "City"} requiredMark={requiredMark}><select required value={city} onChange={(e) => setCity(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>{selectedResidenceCountry.cities.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
      </div>

      <Field label={isRtl ? "نوع الموهبة" : "Talent type"} requiredMark={requiredMark}>
        <select required value={talentType} onChange={(e) => setTalentType(e.currentTarget.value)} className={inputClass}>
          <option value="">{isRtl ? "اختر نوع الموهبة" : "Select talent type"}</option>
          {TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
        </select>
      </Field>

      <div>
        <p className="mb-3 text-sm font-medium text-white/75">{isRtl ? "ظهور الملف" : "Profile visibility"}{requiredMark}</p>
        <div className="grid gap-3">
          {PROFILE_VISIBILITY_OPTIONS.map((option) => (
            <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 transition ${visibility === option.value ? "border-gold/50 bg-gold/[0.06]" : "border-white/10 bg-black/20"}`}>
              <div className="flex items-start gap-3"><input type="radio" name="visibility" value={option.value} checked={visibility === option.value} onChange={() => setVisibility(option.value)} className="mt-1 accent-[#c8a96a]" /><span><strong className="block text-sm text-white">{isRtl ? option.ar : option.en}</strong><span className="mt-1 block text-xs leading-6 text-white/45">{isRtl ? option.descriptionAr : option.descriptionEn}</span></span></div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "كلمة المرور" : "Password"} requiredMark={requiredMark}><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} className={inputClass} /></Field>
        <Field label={isRtl ? "تأكيد كلمة المرور" : "Confirm password"} requiredMark={requiredMark}><input required minLength={8} type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.currentTarget.value)} className={inputClass} /></Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.currentTarget.checked)} required className="mt-1 h-5 w-5 accent-[#c8a96a]"/><span className="text-xs leading-6 text-white/55">{isRtl ? "أوافق على " : "I agree to the "}<Link href={`/${locale}/terms`} target="_blank" className="text-gold">{isRtl ? "الشروط والأحكام" : "Terms"}</Link>{isRtl ? " و" : " and "}<Link href={`/${locale}/privacy`} target="_blank" className="text-gold">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.</span></label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" checked={acceptedAccuracy} onChange={(e) => setAcceptedAccuracy(e.currentTarget.checked)} required className="mt-1 h-5 w-5 accent-[#c8a96a]"/><span className="text-xs leading-6 text-white/55">{isRtl ? "أؤكد أن البيانات التي قدمتها صحيحة، وأسمح لملامح بحفظ بياناتي والتواصل معي بخصوص الفرص والمشاريع المناسبة. ولا تُستخدم صوري أو فيديوهاتي في إعلانات تجارية خارج خدمات ملامح دون موافقة مناسبة." : "I confirm the information I provided is accurate and allow MLAMH to store my data and contact me about relevant opportunities and projects. My photos or videos will not be used in external commercial advertising without appropriate consent."}</span></label>

      <button type="submit" disabled={submitting} className="min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:opacity-60">{submitting ? (isRtl ? "جارٍ إنشاء الحساب..." : "Creating account...") : (isRtl ? "إنشاء الحساب" : "Create account")}</button>
    </form>
  );
}

function Field({ label, requiredMark, children }: { label: string; requiredMark: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm text-white/65">{label}{requiredMark}</span>{children}</label>;
}
