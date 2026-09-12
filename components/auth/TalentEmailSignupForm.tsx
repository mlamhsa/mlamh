"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { checkAuthEmailExistsAction } from "@/lib/actions/check-auth-email";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = { locale: "ar" | "en" };

type ExistingAccountState = {
  exists: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
};

const ACTIVE_MARKET_CODE = "SA";

function normalizeLocalPhone(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 15);
}

function signupError(message: string | undefined, isRtl: boolean) {
  const normalized = String(message ?? "").toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("user already")) {
    return isRtl
      ? "هذا البريد الإلكتروني مسجل مسبقًا. استخدم تسجيل الدخول أو استعادة كلمة المرور."
      : "This email is already registered. Sign in or reset your password.";
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
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [talentType, setTalentType] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [existingAccount, setExistingAccount] = useState<ExistingAccountState | null>(null);

  const activeMarket = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((country) => country.code === ACTIVE_MARKET_CODE) ?? TALENT_SIGNUP_COUNTRIES[0],
    [],
  );
  const normalizedPhone = phone ? `${activeMarket.dialCode}${phone}` : "";
  const inputClass = "min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm";
  const requiredMark = <span className="text-gold" aria-hidden="true"> *</span>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setErrorMessage("");
    setExistingAccount(null);

    const cleanName = fullName.trim().replace(/\s+/g, " ");
    const cleanEmail = email.trim().toLowerCase();
    const category = TALENT_CATEGORIES.find((item) => item.slug === talentType);
    const selectedCity = activeMarket.cities.find((item) => item.value === city);

    if (cleanName.length < 2 || cleanName.length > 100) return setErrorMessage(isRtl ? "أدخل اسمًا صحيحًا." : "Enter a valid name.");
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setErrorMessage(isRtl ? "أدخل بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address.");
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) return setErrorMessage(isRtl ? "أدخل رقم جوال صحيحًا." : "Enter a valid mobile number.");
    if (!nationality || !gender || !category || !selectedCity) return setErrorMessage(isRtl ? "أكمل جميع البيانات المطلوبة." : "Complete all required information.");
    if (password.length < 8) return setErrorMessage(isRtl ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Password must contain at least 8 characters.");
    if (password !== passwordConfirmation) return setErrorMessage(isRtl ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
    if (!acceptedTerms || !acceptedAccuracy) return setErrorMessage(isRtl ? "يجب الموافقة على الشروط ودقة البيانات والتواصل." : "Accept the terms and data/contact consent.");

    setSubmitting(true);
    try {
      const duplicate = await checkAuthEmailExistsAction(cleanEmail);
      if (duplicate.exists) {
        setExistingAccount({ exists: true, hasPassword: duplicate.hasPassword, hasGoogle: duplicate.hasGoogle, hasApple: duplicate.hasApple });
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
            phone_country_iso: activeMarket.code,
            phone_country_code: activeMarket.dialCode,
            phone_verified: false,
            account_type: "talent",
            signup_intent: "talent",
            talent_type: category.slug,
            nationality_slug: nationality,
            gender,
            residence_country_code: activeMarket.code,
            city_slug: selectedCity.value,
            city_ar: selectedCity.ar,
            city_en: selectedCity.en,
            profile_visibility: "public",
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
        setExistingAccount({ exists: true, hasPassword: true, hasGoogle: false, hasApple: false });
        setSubmitting(false);
        return;
      }

      if (data.session && data.user) {
        const response = await fetch("/api/account/details", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ displayName: cleanName, phone: normalizedPhone, accountType: "talent" }),
        });
        const payload = await response.json().catch(() => null) as { ok?: boolean } | null;
        if (!response.ok || !payload?.ok) throw new Error("FINALIZE_FAILED");
        router.replace(`/${locale}/talent-dashboard/profile`);
        router.refresh();
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

  const existingAccountMessage = existingAccount?.hasGoogle && !existingAccount.hasPassword
    ? isRtl ? "يبدو أنك أنشأت حسابك سابقًا باستخدام Google. استخدم تسجيل الدخول بحساب Google نفسه." : "It looks like you previously created your account with Google. Sign in with the same Google account."
    : existingAccount?.hasApple && !existingAccount.hasPassword
      ? isRtl ? "يبدو أنك أنشأت حسابك سابقًا باستخدام Apple. استخدم تسجيل الدخول بحساب Apple نفسه." : "It looks like you previously created your account with Apple. Sign in with the same Apple account."
      : isRtl ? "لديك حساب سابق في ملامح. سجّل الدخول بدل إنشاء حساب جديد، أو استعد كلمة المرور إذا نسيتها." : "You already have an MLAMH account. Sign in instead of creating another account, or reset your password if needed.";

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] px-4 py-3 text-sm leading-6 text-white/60">
        {isRtl ? "أدخل البيانات الأساسية مرة واحدة. بعد إنشاء الحساب ستنتقل مباشرة إلى ملفك لإضافة الصورة وتاريخ الميلاد ثم إرساله للمراجعة." : "Enter the essentials once. After signup you'll go straight to your profile to add your photo and birth date, then submit it for review."}
      </div>

      {existingAccount?.exists ? (
        <div role="alert" className="rounded-2xl border border-gold/30 bg-gold/[0.07] p-5">
          <h3 className="text-base font-medium text-white">{isRtl ? "هذا البريد مسجل مسبقًا" : "This email is already registered"}</h3>
          <p className="mt-2 text-sm leading-7 text-white/55">{existingAccountMessage}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={`/${locale}/login`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gold px-4 text-sm font-medium text-black">{isRtl ? "تسجيل الدخول" : "Sign in"}</Link>
            <Link href={`/${locale}/forgot-password`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 text-sm text-white/70">{isRtl ? "نسيت كلمة المرور؟" : "Forgot password?"}</Link>
          </div>
        </div>
      ) : null}

      {errorMessage ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{errorMessage}</div> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الاسم الكامل" : "Full name"} requiredMark={requiredMark}><input required value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} autoComplete="name" className={inputClass} /></Field>
        <Field label={isRtl ? "البريد الإلكتروني" : "Email"} requiredMark={requiredMark}><input required type="email" value={email} onChange={(e) => { setEmail(e.currentTarget.value); setExistingAccount(null); }} autoComplete="email" dir="ltr" className={`${inputClass} text-left`} /></Field>
      </div>

      <Field label={isRtl ? "رقم الجوال" : "Mobile number"} requiredMark={requiredMark}>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2" dir="ltr">
          <div className="flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-3 text-sm text-white/70">{activeMarket.dialCode}</div>
          <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(normalizeLocalPhone(e.currentTarget.value))} placeholder={activeMarket.phoneExample} autoComplete="tel-national" className={`${inputClass} text-left`} />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الجنسية" : "Nationality"} requiredMark={requiredMark}><select required value={nationality} onChange={(e) => setNationality(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر الجنسية" : "Select nationality"}</option>{NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
        <Field label={isRtl ? "الجنس" : "Gender"} requiredMark={requiredMark}><select required value={gender} onChange={(e) => setGender(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر" : "Select"}</option>{GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "المدينة" : "City"} requiredMark={requiredMark}><select required value={city} onChange={(e) => setCity(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>{activeMarket.cities.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
        <Field label={isRtl ? "نوع الموهبة" : "Talent type"} requiredMark={requiredMark}><select required value={talentType} onChange={(e) => setTalentType(e.currentTarget.value)} className={inputClass}><option value="">{isRtl ? "اختر نوع الموهبة" : "Select talent type"}</option>{TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug} className="bg-black">{isRtl ? item.ar : item.en}</option>)}</select></Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "كلمة المرور" : "Password"} requiredMark={requiredMark}>
          <div className="relative">
            <input required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} className={`${inputClass} ${isRtl ? "pl-14" : "pr-14"}`} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? (isRtl ? "إخفاء كلمة المرور" : "Hide password") : (isRtl ? "إظهار كلمة المرور" : "Show password")} aria-pressed={showPassword} className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-gold ${isRtl ? "left-2" : "right-2"}`}>
              {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </Field>
        <Field label={isRtl ? "تأكيد كلمة المرور" : "Confirm password"} requiredMark={requiredMark}>
          <div className="relative">
            <input required minLength={8} type={showPasswordConfirmation ? "text" : "password"} autoComplete="new-password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.currentTarget.value)} className={`${inputClass} ${isRtl ? "pl-14" : "pr-14"}`} />
            <button type="button" onClick={() => setShowPasswordConfirmation((value) => !value)} aria-label={showPasswordConfirmation ? (isRtl ? "إخفاء تأكيد كلمة المرور" : "Hide password confirmation") : (isRtl ? "إظهار تأكيد كلمة المرور" : "Show password confirmation")} aria-pressed={showPasswordConfirmation} className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-gold ${isRtl ? "left-2" : "right-2"}`}>
              {showPasswordConfirmation ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
            </button>
          </div>
        </Field>
      </div>

      <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs leading-6 text-white/45">{isRtl ? "السوق النشط حاليًا هو السعودية، لذلك تم حذف اختيار بلد الإقامة من التسجيل. الجنسية تبقى مستقلة ويمكن اختيار أي جنسية." : "Saudi Arabia is the currently active market, so residence-country selection has been removed from signup. Nationality remains independent."}</p>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.currentTarget.checked)} required className="mt-1 h-5 w-5 accent-[#c8a96a]" /><span className="text-xs leading-6 text-white/55">{isRtl ? "أوافق على " : "I agree to the "}<Link href={`/${locale}/terms`} target="_blank" className="text-gold">{isRtl ? "الشروط والأحكام" : "Terms"}</Link>{isRtl ? " و" : " and "}<Link href={`/${locale}/privacy`} target="_blank" className="text-gold">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.</span></label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3"><input type="checkbox" checked={acceptedAccuracy} onChange={(e) => setAcceptedAccuracy(e.currentTarget.checked)} required className="mt-1 h-5 w-5 accent-[#c8a96a]" /><span className="text-xs leading-6 text-white/55">{isRtl ? "أؤكد أن بياناتي صحيحة، وأسمح لملامح بحفظها والتواصل معي بخصوص الفرص والمشاريع المناسبة. ولا تُستخدم صوري أو فيديوهاتي في إعلانات تجارية خارج خدمات ملامح دون موافقة مناسبة." : "I confirm my information is accurate and allow MLAMH to store it and contact me about relevant opportunities and projects. My photos or videos will not be used in external commercial advertising without appropriate consent."}</span></label>

      <button type="submit" disabled={submitting} className="min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:opacity-60">{submitting ? (isRtl ? "جارٍ إنشاء الحساب..." : "Creating account...") : (isRtl ? "إنشاء الحساب والمتابعة إلى ملفي" : "Create account and continue to my profile")}</button>
    </form>
  );
}

function Field({ label, requiredMark, children }: { label: string; requiredMark: React.ReactNode; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm text-white/70">{label}{requiredMark}</span>{children}</label>;
}
