"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { checkAuthEmailExistsAction } from "@/lib/actions/check-auth-email";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  TALENT_SIGNUP_COUNTRIES,
} from "@/lib/data/talent-signup";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = { locale: "ar" | "en" };
type SignupStep = 1 | 2 | 3;

type ExistingAccountState = {
  exists: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
};

function normalizeLocalPhone(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 15);
}

function signupError(message: string | undefined, isRtl: boolean) {
  const normalized = String(message ?? "").toLowerCase();
  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already")
  ) {
    return isRtl
      ? "هذا البريد الإلكتروني مسجل مسبقًا. استخدم تسجيل الدخول أو استعادة كلمة المرور."
      : "This email is already registered. Sign in or reset your password.";
  }
  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("email rate")
  ) {
    return isRtl
      ? "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many attempts. Please wait a moment and try again.";
  }
  return isRtl
    ? "تعذر إنشاء الحساب حاليًا. تحقق من البيانات وحاول مرة أخرى."
    : "Could not create your account. Check your details and try again.";
}

export function TalentEmailSignupForm({ locale }: Props) {
  const isRtl = locale === "ar";
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>(1);
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
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [existingAccount, setExistingAccount] = useState<ExistingAccountState | null>(null);

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

  function clearMessages() {
    setErrorMessage("");
    setExistingAccount(null);
  }

  function validateStepOne() {
    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 100) {
      setErrorMessage(isRtl ? "أدخل اسمًا صحيحًا." : "Enter a valid name.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setErrorMessage(isRtl ? "أدخل بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address.");
      return false;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      setErrorMessage(isRtl ? "أدخل رقم جوال صحيحًا مع مفتاح الدولة." : "Enter a valid mobile number with country code.");
      return false;
    }
    if (!nationality || !gender) {
      setErrorMessage(isRtl ? "أكمل الجنسية والجنس للمتابعة." : "Complete nationality and gender to continue.");
      return false;
    }
    return true;
  }

  function validateStepTwo() {
    if (!residenceCountry || !city || !talentType) {
      setErrorMessage(isRtl ? "أكمل بلد الإقامة والمدينة ونوع الموهبة للمتابعة." : "Complete country of residence, city and talent type to continue.");
      return false;
    }
    const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
    const selectedCity = selectedResidenceCountry.cities.find((item) => item.value === city);
    if (!category || !selectedCity) {
      setErrorMessage(isRtl ? "تحقق من نوع الموهبة والمدينة." : "Check the talent type and city.");
      return false;
    }
    return true;
  }

  async function goToStepTwo() {
    clearMessages();
    if (!validateStepOne()) return;

    const cleanEmail = email.trim().toLowerCase();
    setCheckingEmail(true);
    try {
      const duplicate = await checkAuthEmailExistsAction(cleanEmail);
      if (duplicate.exists) {
        setExistingAccount({
          exists: true,
          hasPassword: duplicate.hasPassword,
          hasGoogle: duplicate.hasGoogle,
          hasApple: duplicate.hasApple,
        });
        return;
      }
      setStep(2);
    } catch (error) {
      console.error("[TalentEmailSignupForm.checkEmail]", error);
      setErrorMessage(isRtl ? "تعذر التحقق من البريد الآن. حاول مرة أخرى." : "We could not check this email right now. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  }

  function goToStepThree() {
    clearMessages();
    if (!validateStepTwo()) return;
    setStep(3);
  }

  function goBack() {
    clearMessages();
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || step !== 3) return;

    clearMessages();

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();

    if (!validateStepOne() || !validateStepTwo()) return;
    if (password.length < 8) {
      return setErrorMessage(isRtl ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Password must contain at least 8 characters.");
    }
    if (password !== passwordConfirmation) {
      return setErrorMessage(isRtl ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
    }
    if (!acceptedTerms || !acceptedAccuracy) {
      return setErrorMessage(isRtl ? "يجب الموافقة على الشروط ودقة البيانات والتواصل للمتابعة." : "Accept the terms and data/contact consent to continue.");
    }

    const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
    const selectedCity = selectedResidenceCountry.cities.find((item) => item.value === city);
    if (!category || !selectedCity) {
      return setErrorMessage(isRtl ? "تحقق من نوع الموهبة والمدينة." : "Check the talent type and city.");
    }

    setSubmitting(true);

    try {
      const duplicate = await checkAuthEmailExistsAction(cleanEmail);
      if (duplicate.exists) {
        setExistingAccount({
          exists: true,
          hasPassword: duplicate.hasPassword,
          hasGoogle: duplicate.hasGoogle,
          hasApple: duplicate.hasApple,
        });
        setStep(1);
        setSubmitting(false);
        return;
      }

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

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setExistingAccount({
          exists: true,
          hasPassword: true,
          hasGoogle: false,
          hasApple: false,
        });
        setStep(1);
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
      setErrorMessage(
        isRtl
          ? "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى."
          : "An error occurred while creating your account. Please try again.",
      );
      setSubmitting(false);
    }
  }

  const existingAccountMessage = existingAccount?.hasGoogle && !existingAccount.hasPassword
    ? isRtl
      ? "يبدو أنك أنشأت حسابك سابقًا باستخدام Google. استخدم تسجيل الدخول بحساب Google نفسه."
      : "It looks like you previously created your account with Google. Sign in with the same Google account."
    : existingAccount?.hasApple && !existingAccount.hasPassword
      ? isRtl
        ? "يبدو أنك أنشأت حسابك سابقًا باستخدام Apple. استخدم تسجيل الدخول بحساب Apple نفسه."
        : "It looks like you previously created your account with Apple. Sign in with the same Apple account."
      : isRtl
        ? "لديك حساب سابق في ملامح. سجّل الدخول بدل إنشاء حساب جديد، أو استعد كلمة المرور إذا نسيتها."
        : "You already have an MLAMH account. Sign in instead of creating another account, or reset your password if needed.";

  const stepCopy = [
    {
      title: isRtl ? "بيانات الحساب" : "Account details",
      body: isRtl ? "عرّفنا بنفسك وأدخل بيانات التواصل الأساسية." : "Tell us who you are and add your essential contact details.",
    },
    {
      title: isRtl ? "بيانات الموهبة" : "Talent details",
      body: isRtl ? "حدد مكانك وتخصصك وطريقة ظهور ملفك في ملامح." : "Choose your location, talent type and profile visibility.",
    },
    {
      title: isRtl ? "الأمان والموافقة" : "Security & consent",
      body: isRtl ? "أنشئ كلمة المرور وراجع الموافقات قبل إنشاء الحساب." : "Create your password and review the required consents.",
    },
  ][step - 1];

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gold">{isRtl ? `المرحلة ${step} من 3` : `Step ${step} of 3`}</p>
            <h2 className="mt-1 text-lg font-medium text-white">{stepCopy.title}</h2>
            <p className="mt-1 text-xs leading-6 text-white/45">{stepCopy.body}</p>
          </div>
          <span className="shrink-0 rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1.5 text-xs text-gold">{step}/3</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <span key={item} className={`h-1.5 rounded-full transition ${item <= step ? "bg-gold" : "bg-white/10"}`} />
          ))}
        </div>
      </div>

      <p className="text-xs text-white/40">
        <span className="text-gold">*</span> {isRtl ? "حقل مطلوب" : "Required field"}
      </p>

      {existingAccount?.exists ? (
        <div role="alert" className="rounded-2xl border border-gold/30 bg-gold/[0.07] p-5">
          <h3 className="text-base font-medium text-white">{isRtl ? "هذا البريد مسجل مسبقًا" : "This email is already registered"}</h3>
          <p className="mt-2 text-sm leading-7 text-white/55">{existingAccountMessage}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}/login`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gold px-4 text-sm font-medium text-black transition hover:bg-gold-soft">
              {isRtl ? "تسجيل الدخول" : "Sign in"}
            </Link>
            <Link href={`/${locale}/forgot-password`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm text-white/70 transition hover:border-gold/35 hover:text-gold">
              {isRtl ? "نسيت كلمة المرور؟" : "Forgot password?"}
            </Link>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={isRtl ? "الاسم الكامل" : "Full name"} requiredMark={requiredMark}>
              <input required value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} autoComplete="name" className={inputClass} />
            </Field>
            <Field label={isRtl ? "البريد الإلكتروني" : "Email"} requiredMark={requiredMark}>
              <input required type="email" value={email} onChange={(e) => { setEmail(e.currentTarget.value); setExistingAccount(null); }} autoComplete="email" dir="ltr" className={`${inputClass} text-left`} />
            </Field>
          </div>

          <Field label={isRtl ? "رقم الجوال" : "Mobile number"} requiredMark={requiredMark}>
            <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-2">
              <select value={phoneCountry} onChange={(e) => { setPhoneCountry(e.currentTarget.value); setPhone(""); }} className={inputClass}>
                {TALENT_SIGNUP_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code} className="bg-black">{country.dialCode} {isRtl ? country.ar : country.en}</option>
                ))}
              </select>
              <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(normalizeLocalPhone(e.currentTarget.value))} placeholder={selectedPhoneCountry.phoneExample} dir="ltr" className={`${inputClass} text-left`} />
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={isRtl ? "الجنسية" : "Nationality"} requiredMark={requiredMark}>
              <select required value={nationality} onChange={(e) => setNationality(e.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر الجنسية" : "Select nationality"}</option>
                {NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
              </select>
            </Field>
            <Field label={isRtl ? "الجنس" : "Gender"} requiredMark={requiredMark}>
              <select required value={gender} onChange={(e) => setGender(e.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر" : "Select"}</option>
                {GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
              </select>
            </Field>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={isRtl ? "بلد الإقامة" : "Country of residence"} requiredMark={requiredMark}>
              <select required value={residenceCountry} onChange={(e) => { setResidenceCountry(e.currentTarget.value); setCity(""); }} className={inputClass}>
                {TALENT_SIGNUP_COUNTRIES.map((country) => <option key={country.code} value={country.code} className="bg-black">{isRtl ? country.ar : country.en}</option>)}
              </select>
            </Field>
            <Field label={isRtl ? "المدينة" : "City"} requiredMark={requiredMark}>
              <select required value={city} onChange={(e) => setCity(e.currentTarget.value)} className={inputClass}>
                <option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>
                {selectedResidenceCountry.cities.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
              </select>
            </Field>
          </div>

          <Field label={isRtl ? "نوع الموهبة" : "Talent type"} requiredMark={requiredMark}>
            <select required value={talentType} onChange={(e) => setTalentType(e.currentTarget.value)} className={inputClass}>
              <option value="">{isRtl ? "اختر نوع الموهبة" : "Select talent type"}</option>
              {TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
            </select>
          </Field>

          <div>
            <p className="mb-3 text-sm font-medium text-white/75">{isRtl ? "ظهور الملف" : "Profile visibility"}{requiredMark}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFILE_VISIBILITY_OPTIONS.map((option) => (
                <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 transition ${visibility === option.value ? "border-gold/50 bg-gold/[0.06]" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="visibility" value={option.value} checked={visibility === option.value} onChange={() => setVisibility(option.value)} className="mt-1 accent-[#c8a96a]" />
                    <span>
                      <strong className="block text-sm text-white">{isRtl ? option.ar : option.en}</strong>
                      <span className="mt-1 block text-xs leading-6 text-white/45">{isRtl ? option.descriptionAr : option.descriptionEn}</span>
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={isRtl ? "كلمة المرور" : "Password"} requiredMark={requiredMark}>
              <input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} className={inputClass} />
            </Field>
            <Field label={isRtl ? "تأكيد كلمة المرور" : "Confirm password"} requiredMark={requiredMark}>
              <input required minLength={8} type="password" autoComplete="new-password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.currentTarget.value)} className={inputClass} />
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
            <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.currentTarget.checked)} required className="mt-1 h-5 w-5 accent-[#c8a96a]" />
            <span className="text-xs leading-6 text-white/55">
              {isRtl ? "أوافق على " : "I agree to the "}
              <Link href={`/${locale}/terms`} target="_blank" className="text-gold">{isRtl ? "الشروط والأحكام" : "Terms"}</Link>
              {isRtl ? " و" : " and "}
              <Link href={`/${locale}/privacy`} target="_blank" className="text-gold">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
            <input type="checkbox" checked={acceptedAccuracy} onChange={(e) => setAcceptedAccuracy(e.currentTarget.checked)} required className="mt-1 h-5 w-5 accent-[#c8a96a]" />
            <span className="text-xs leading-6 text-white/55">
              {isRtl
                ? "أؤكد أن بياناتي صحيحة، وأسمح لملامح بحفظها والتواصل معي بخصوص الفرص والمشاريع المناسبة. ولا تُستخدم صوري أو فيديوهاتي في إعلانات تجارية خارج خدمات ملامح دون موافقة مناسبة."
                : "I confirm my information is accurate and allow MLAMH to store it and contact me about relevant opportunities and projects. My photos or videos will not be used in external commercial advertising without appropriate consent."}
            </span>
          </label>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {step > 1 ? (
          <button type="button" onClick={goBack} disabled={submitting || checkingEmail} className="min-h-13 flex-1 rounded-2xl border border-white/10 px-5 text-sm font-medium text-white/70 transition hover:border-gold/35 hover:text-gold disabled:opacity-50">
            {isRtl ? "رجوع" : "Back"}
          </button>
        ) : null}

        {step === 1 ? (
          <button type="button" onClick={() => void goToStepTwo()} disabled={checkingEmail} className="min-h-14 flex-[2] rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:opacity-60">
            {checkingEmail ? (isRtl ? "جارٍ التحقق..." : "Checking...") : (isRtl ? "التالي" : "Continue")}
          </button>
        ) : step === 2 ? (
          <button type="button" onClick={goToStepThree} className="min-h-14 flex-[2] rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft">
            {isRtl ? "التالي" : "Continue"}
          </button>
        ) : (
          <button type="submit" disabled={submitting} className="min-h-14 flex-[2] rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:opacity-60">
            {submitting ? (isRtl ? "جارٍ التحقق وإنشاء الحساب..." : "Checking and creating account...") : (isRtl ? "إنشاء الحساب" : "Create account")}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, requiredMark, children }: { label: string; requiredMark: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/65">{label}{requiredMark}</span>
      {children}
    </label>
  );
}
