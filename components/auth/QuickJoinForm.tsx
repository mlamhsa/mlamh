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

type QuickJoinFormProps = {
  locale: "ar" | "en";
  accountType: "talent" | "publisher";
  intent?: "actor" | "model" | "publisher";
};

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  if (visible) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.6 10.6 0 0 1 12 4c5.5 0 9 5 9 5a16.4 16.4 0 0 1-2.3 2.8M6.1 6.1C4.1 7.5 3 9 3 9s3.5 5 9 5c1 0 1.9-.2 2.7-.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.4"/></svg>;
}

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

export function QuickJoinForm({ locale, accountType, intent }: QuickJoinFormProps) {
  const isRtl = locale === "ar";
  const isTalent = accountType === "talent";
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("SA");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [residenceCountry, setResidenceCountry] = useState("SA");
  const [city, setCity] = useState("");
  const [otherCity, setOtherCity] = useState("");
  const [talentType, setTalentType] = useState(intent === "actor" || intent === "model" ? intent : "");
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private" | "">("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedDataConsent, setAcceptedDataConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedPhoneCountry = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((country) => country.code === phoneCountryCode) ?? TALENT_SIGNUP_COUNTRIES[0],
    [phoneCountryCode],
  );
  const selectedResidenceCountry = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((country) => country.code === residenceCountry) ?? TALENT_SIGNUP_COUNTRIES[0],
    [residenceCountry],
  );
  const normalizedPhone = phone ? `${selectedPhoneCountry.dialCode}${phone}` : "";
  const resolvedCity = city === "other" ? otherCity.trim() : city;
  const inputClass = "min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm";
  const requiredMark = <span className="text-gold" aria-hidden="true"> *</span>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setErrorMessage("");

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 100) {
      setErrorMessage(isRtl ? "أدخل اسمًا صحيحًا يتكون من حرفين على الأقل." : "Enter a valid name with at least 2 characters.");
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setErrorMessage(isRtl ? "أدخل رقم جوال صحيحًا مع مفتاح الدولة." : "Enter a valid mobile number including the country code.");
      return;
    }
    if (isTalent && (!nationality || !gender || !residenceCountry || !resolvedCity || !talentType || !profileVisibility)) {
      setErrorMessage(isRtl ? "أكمل جميع بيانات الموهبة المطلوبة للمتابعة." : "Complete all required talent details to continue.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage(isRtl ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Your password must contain at least 8 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setErrorMessage(isRtl ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage(isRtl ? "يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة." : "You must accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (isTalent && !acceptedDataConsent) {
      setErrorMessage(isRtl ? "يجب تأكيد دقة البيانات والموافقة على التواصل للمتابعة." : "Confirm data accuracy and contact consent to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const resolvedIntent = isTalent ? talentType : (intent ?? "publisher");
      const now = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: isTalent ? cleanName : null,
            contact_name: accountType === "publisher" ? cleanName : null,
            phone: normalizedPhone,
            phone_country_iso: selectedPhoneCountry.code,
            phone_country_code: selectedPhoneCountry.dialCode,
            phone_verified: false,
            account_type: accountType,
            signup_intent: resolvedIntent,
            talent_type: isTalent ? talentType : null,
            nationality: isTalent ? nationality : null,
            gender: isTalent ? gender : null,
            country_of_residence: isTalent ? residenceCountry : null,
            city: isTalent ? resolvedCity : null,
            profile_visibility: isTalent ? profileVisibility : null,
            onboarding_status: "email_verification_required",
            onboarding_step: "email_verification",
            approval_status: "not_submitted",
            preferred_locale: locale,
            terms_accepted: true,
            terms_accepted_at: now,
            data_contact_consent: isTalent ? true : null,
            data_contact_consent_at: isTalent ? now : null,
          },
        },
      });

      if (error) {
        setErrorMessage(signupError(error.message, isRtl));
        setSubmitting(false);
        return;
      }

      if (data.session && data.user) {
        router.replace(isTalent ? `/${locale}/join/talent` : `/${locale}/join/publisher`);
        return;
      }

      const query = new URLSearchParams({ email: cleanEmail, type: accountType });
      if (resolvedIntent) query.set("intent", resolvedIntent);
      router.replace(`/${locale}/join/verify-email?${query.toString()}`);
    } catch (error) {
      console.error("[QuickJoinForm.signUp]", error);
      setErrorMessage(isRtl ? "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى." : "An error occurred while creating your account. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <p className="text-xs text-white/40">{isRtl ? <><span className="text-gold">*</span> حقل مطلوب</> : <><span className="text-gold">*</span> Required field</>}</p>

      {errorMessage ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm leading-6 text-red-300">{errorMessage}</div> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="join-full-name" className="mb-2 block text-sm text-white/65">{accountType === "publisher" ? (isRtl ? "اسم المسؤول" : "Contact person name") : (isRtl ? "الاسم الكامل" : "Full name")}{requiredMark}</label>
          <input id="join-full-name" type="text" required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} placeholder={accountType === "publisher" ? (isRtl ? "اكتب اسم الشخص المسؤول عن الحساب" : "Enter the account contact person's name") : (isRtl ? "اكتب اسمك الكامل" : "Enter your full name")} className={inputClass}/>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="join-email" className="mb-2 block text-sm text-white/65">{isRtl ? "البريد الإلكتروني" : "Email address"}{requiredMark}</label>
          <input id="join-email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(event) => setEmail(event.currentTarget.value)} placeholder="name@example.com" dir="ltr" className={`${inputClass} text-left`}/>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="join-phone" className="mb-2 block text-sm text-white/65">{isRtl ? "رقم الجوال" : "Mobile number"}{requiredMark}</label>
          <div className="grid grid-cols-[8.75rem_minmax(0,1fr)] gap-2">
            <select id="join-phone-country" value={phoneCountryCode} onChange={(event) => { setPhoneCountryCode(event.currentTarget.value); setPhone(""); }} className="min-h-14 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-gold/50" aria-label={isRtl ? "مفتاح الدولة" : "Country calling code"}>
              {TALENT_SIGNUP_COUNTRIES.map((country) => <option key={country.code} value={country.code} className="bg-black text-white">{country.dialCode} {isRtl ? country.ar : country.en}</option>)}
            </select>
            <input id="join-phone" type="tel" required inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(normalizeLocalPhone(event.currentTarget.value))} minLength={7} maxLength={15} pattern="[0-9]{7,15}" placeholder={selectedPhoneCountry.phoneExample} dir="ltr" className="min-h-14 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm"/>
          </div>
        </div>

        {isTalent ? (
          <>
            <div>
              <label htmlFor="join-nationality" className="mb-2 block text-sm text-white/65">{isRtl ? "الجنسية" : "Nationality"}{requiredMark}</label>
              <select id="join-nationality" required value={nationality} onChange={(event) => setNationality(event.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر الجنسية" : "Choose nationality"}</option>
                {NATIONALITY_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-black text-white">{isRtl ? option.ar : option.en}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="join-gender" className="mb-2 block text-sm text-white/65">{isRtl ? "الجنس" : "Gender"}{requiredMark}</label>
              <select id="join-gender" required value={gender} onChange={(event) => setGender(event.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر" : "Choose"}</option>
                {GENDER_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-black text-white">{isRtl ? option.ar : option.en}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="join-residence-country" className="mb-2 block text-sm text-white/65">{isRtl ? "بلد الإقامة" : "Country of residence"}{requiredMark}</label>
              <select id="join-residence-country" required value={residenceCountry} onChange={(event) => { setResidenceCountry(event.currentTarget.value); setCity(""); setOtherCity(""); }} className={inputClass}>
                {TALENT_SIGNUP_COUNTRIES.map((country) => <option key={country.code} value={country.code} className="bg-black text-white">{isRtl ? country.ar : country.en}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="join-city" className="mb-2 block text-sm text-white/65">{isRtl ? "المدينة" : "City"}{requiredMark}</label>
              <select id="join-city" required value={city} onChange={(event) => setCity(event.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر المدينة" : "Choose city"}</option>
                {selectedResidenceCountry.cities.map((option) => <option key={option.value} value={option.value} className="bg-black text-white">{isRtl ? option.ar : option.en}</option>)}
              </select>
            </div>

            {city === "other" ? (
              <div className="sm:col-span-2">
                <label htmlFor="join-other-city" className="mb-2 block text-sm text-white/65">{isRtl ? "اكتب اسم المدينة" : "Enter city name"}{requiredMark}</label>
                <input id="join-other-city" required value={otherCity} onChange={(event) => setOtherCity(event.currentTarget.value)} className={inputClass} />
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <label htmlFor="join-talent-type" className="mb-2 block text-sm text-white/65">{isRtl ? "نوع الموهبة" : "Talent type"}{requiredMark}</label>
              <select id="join-talent-type" required value={talentType} onChange={(event) => setTalentType(event.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر نوع موهبتك" : "Choose your talent type"}</option>
                {TALENT_CATEGORIES.map((category) => <option key={category.slug} value={category.slug} className="bg-black text-white">{isRtl ? category.ar : category.en}</option>)}
              </select>
            </div>
          </>
        ) : null}

        <div>
          <label htmlFor="join-password" className="mb-2 block text-sm text-white/65">{isRtl ? "كلمة المرور" : "Password"}{requiredMark}</label>
          <div className="relative">
            <input id="join-password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.currentTarget.value)} placeholder={isRtl ? "8 أحرف على الأقل" : "At least 8 characters"} className={`${inputClass} ${isRtl ? "pr-4 pl-14" : "pl-4 pr-14"}`}/>
            <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")} aria-pressed={showPassword} className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white ${isRtl ? "left-2" : "right-2"}`}><PasswordVisibilityIcon visible={showPassword}/></button>
          </div>
        </div>

        <div>
          <label htmlFor="join-password-confirmation" className="mb-2 block text-sm text-white/65">{isRtl ? "تأكيد كلمة المرور" : "Confirm password"}{requiredMark}</label>
          <div className="relative">
            <input id="join-password-confirmation" type={showPasswordConfirmation ? "text" : "password"} required minLength={8} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.currentTarget.value)} placeholder={isRtl ? "أعد كتابة كلمة المرور" : "Enter your password again"} className={`${inputClass} ${isRtl ? "pr-4 pl-14" : "pl-4 pr-14"}`}/>
            <button type="button" onClick={() => setShowPasswordConfirmation((current) => !current)} aria-label={showPasswordConfirmation ? (isRtl ? "إخفاء تأكيد كلمة المرور" : "Hide password confirmation") : (isRtl ? "إظهار تأكيد كلمة المرور" : "Show password confirmation")} aria-pressed={showPasswordConfirmation} className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white ${isRtl ? "left-2" : "right-2"}`}><PasswordVisibilityIcon visible={showPasswordConfirmation}/></button>
          </div>
        </div>
      </div>

      {isTalent ? (
        <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <legend className="px-2 text-sm font-medium text-white">{isRtl ? "ظهور الملف" : "Profile visibility"}{requiredMark}</legend>
          <p className="text-xs leading-6 text-white/45">{isRtl ? "اختر كيف تريد أن يظهر ملفك بعد الاعتماد." : "Choose how your profile may be used after approval."}</p>
          {PROFILE_VISIBILITY_OPTIONS.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
              <input type="radio" name="profile_visibility" value={option.value} checked={profileVisibility === option.value} onChange={() => setProfileVisibility(option.value)} required className="mt-1 h-4 w-4 accent-[#c8a96a]" />
              <span>
                <span className="block text-sm font-medium text-white">{isRtl ? option.ar : option.en}</span>
                <span className="mt-1 block text-xs leading-6 text-white/45">{isRtl ? option.descriptionAr : option.descriptionEn}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.currentTarget.checked)} required className="mt-1 h-5 w-5 shrink-0 accent-[#c8a96a]"/>
        <span className="text-xs leading-6 text-white/50">{isRtl ? "أوافق على " : "I agree to the "}<Link href={`/${locale}/terms`} target="_blank" rel="noreferrer" className="text-gold transition hover:text-gold-soft">{isRtl ? "الشروط والأحكام" : "Terms and Conditions"}</Link>{isRtl ? " و" : " and "}<Link href={`/${locale}/privacy`} target="_blank" rel="noreferrer" className="text-gold transition hover:text-gold-soft">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link></span>
      </label>

      {isTalent ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <input type="checkbox" checked={acceptedDataConsent} onChange={(event) => setAcceptedDataConsent(event.currentTarget.checked)} required className="mt-1 h-5 w-5 shrink-0 accent-[#c8a96a]"/>
          <span className="text-xs leading-6 text-white/50">{isRtl ? "أؤكد أن المعلومات التي قدمتها صحيحة، وأسمح لملامح بحفظ بياناتي والتواصل معي بخصوص الفرص والمشاريع المناسبة. لن تُستخدم صوري أو فيديوهاتي في إعلانات تجارية خارج خدمات ملامح دون موافقة مناسبة." : "I confirm that the information I provided is accurate and allow MLAMH to store my data and contact me about relevant opportunities and projects. My photos or videos will not be used in commercial advertising outside MLAMH services without appropriate consent."}</span>
        </label>
      ) : null}

      <button type="submit" disabled={submitting} aria-disabled={submitting} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"/><span>{isRtl ? "جارٍ إنشاء الحساب..." : "Creating account..."}</span></> : <span>{isRtl ? "إنشاء الحساب" : "Create account"}</span>}
      </button>
      <p className="text-center text-[11px] leading-5 text-white/30">{isRtl ? "بعد تأكيد بريدك ستدخل إلى لوحة التحكم لإكمال ملفك المهني ومعرض أعمالك." : "After email verification you’ll enter the dashboard to complete your professional profile and portfolio."}</p>
    </form>
  );
}
