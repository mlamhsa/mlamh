"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type QuickJoinFormProps = {
  locale: "ar" | "en";
  accountType: "talent" | "publisher";
  action?: (formData: FormData) => void | Promise<void>;
  intent?: "actor" | "model" | "publisher";
};

type CountryOption = {
  code: string;
  dialCode: string;
  nameAr: string;
  nameEn: string;
  example: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "SA", dialCode: "+966", nameAr: "السعودية", nameEn: "Saudi Arabia", example: "5XXXXXXXX" },
  { code: "AE", dialCode: "+971", nameAr: "الإمارات", nameEn: "United Arab Emirates", example: "5XXXXXXXX" },
  { code: "KW", dialCode: "+965", nameAr: "الكويت", nameEn: "Kuwait", example: "XXXXXXXX" },
  { code: "QA", dialCode: "+974", nameAr: "قطر", nameEn: "Qatar", example: "XXXXXXXX" },
  { code: "BH", dialCode: "+973", nameAr: "البحرين", nameEn: "Bahrain", example: "XXXXXXXX" },
  { code: "OM", dialCode: "+968", nameAr: "عُمان", nameEn: "Oman", example: "XXXXXXXX" },
  { code: "EG", dialCode: "+20", nameAr: "مصر", nameEn: "Egypt", example: "1XXXXXXXXX" },
  { code: "JO", dialCode: "+962", nameAr: "الأردن", nameEn: "Jordan", example: "7XXXXXXXX" },
  { code: "MA", dialCode: "+212", nameAr: "المغرب", nameEn: "Morocco", example: "6XXXXXXXX" },
  { code: "DZ", dialCode: "+213", nameAr: "الجزائر", nameEn: "Algeria", example: "XXXXXXXXX" },
  { code: "TN", dialCode: "+216", nameAr: "تونس", nameEn: "Tunisia", example: "XXXXXXXX" },
  { code: "LB", dialCode: "+961", nameAr: "لبنان", nameEn: "Lebanon", example: "XXXXXXXX" },
  { code: "SY", dialCode: "+963", nameAr: "سوريا", nameEn: "Syria", example: "9XXXXXXXX" },
  { code: "IQ", dialCode: "+964", nameAr: "العراق", nameEn: "Iraq", example: "7XXXXXXXXX" },
  { code: "YE", dialCode: "+967", nameAr: "اليمن", nameEn: "Yemen", example: "XXXXXXXXX" },
  { code: "US", dialCode: "+1", nameAr: "الولايات المتحدة وكندا", nameEn: "United States & Canada", example: "XXXXXXXXXX" },
  { code: "GB", dialCode: "+44", nameAr: "المملكة المتحدة", nameEn: "United Kingdom", example: "7XXXXXXXXX" },
];

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
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("SA");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedCountry = useMemo(() => COUNTRY_OPTIONS.find((country) => country.code === countryCode) ?? COUNTRY_OPTIONS[0], [countryCode]);
  const normalizedPhone = phone ? `${selectedCountry.dialCode}${phone}` : "";
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

    setSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const resolvedIntent = intent ?? (accountType === "publisher" ? "publisher" : undefined);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: accountType === "talent" ? cleanName : null,
            contact_name: accountType === "publisher" ? cleanName : null,
            phone: normalizedPhone,
            phone_country_iso: selectedCountry.code,
            phone_country_code: selectedCountry.dialCode,
            phone_verified: false,
            account_type: accountType,
            signup_intent: resolvedIntent ?? null,
            onboarding_status: "email_verification_required",
            onboarding_step: "email_verification",
            approval_status: "not_submitted",
            preferred_locale: locale,
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });

      if (error) {
        setErrorMessage(signupError(error.message, isRtl));
        setSubmitting(false);
        return;
      }

      if (data.session && data.user) {
        router.replace(accountType === "talent" ? `/${locale}/join/talent` : `/${locale}/join/publisher`);
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

      <div>
        <label htmlFor="join-full-name" className="mb-2 block text-sm text-white/65">{accountType === "publisher" ? (isRtl ? "اسم المسؤول" : "Contact person name") : (isRtl ? "الاسم الكامل" : "Full name")}{requiredMark}</label>
        <input id="join-full-name" type="text" required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.currentTarget.value)} placeholder={accountType === "publisher" ? (isRtl ? "اكتب اسم الشخص المسؤول عن الحساب" : "Enter the account contact person's name") : (isRtl ? "اكتب اسمك الكامل" : "Enter your full name")} className={inputClass}/>
      </div>

      <div>
        <label htmlFor="join-email" className="mb-2 block text-sm text-white/65">{isRtl ? "البريد الإلكتروني" : "Email address"}{requiredMark}</label>
        <input id="join-email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(event) => setEmail(event.currentTarget.value)} placeholder="name@example.com" dir="ltr" className={`${inputClass} text-left`}/>
      </div>

      <div>
        <label htmlFor="join-phone" className="mb-2 block text-sm text-white/65">{isRtl ? "رقم الجوال" : "Mobile number"}{requiredMark}</label>
        <div className="grid grid-cols-[8.75rem_minmax(0,1fr)] gap-2">
          <label htmlFor="join-country" className="sr-only">{isRtl ? "الدولة ومفتاح الاتصال" : "Country and calling code"}</label>
          <select id="join-country" value={countryCode} onChange={(event) => { setCountryCode(event.currentTarget.value); setPhone(""); }} className="min-h-14 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-gold/50">
            {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.code} className="bg-black text-white">{country.dialCode} {isRtl ? country.nameAr : country.nameEn}</option>)}
          </select>
          <input id="join-phone" type="tel" required inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(normalizeLocalPhone(event.currentTarget.value))} minLength={7} maxLength={15} pattern="[0-9]{7,15}" placeholder={selectedCountry.example} dir="ltr" className="min-h-14 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-4 text-left text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm"/>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-white/30" dir="ltr">{normalizedPhone || `${selectedCountry.dialCode}${selectedCountry.example}`}</p>
      </div>

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

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.currentTarget.checked)} required className="mt-1 h-5 w-5 shrink-0 accent-[#c8a96a]"/>
        <span className="text-xs leading-6 text-white/50">{isRtl ? "أوافق على " : "I agree to the "}<Link href={`/${locale}/terms`} target="_blank" rel="noreferrer" className="text-gold transition hover:text-gold-soft">{isRtl ? "الشروط والأحكام" : "Terms and Conditions"}</Link>{isRtl ? " و" : " and "}<Link href={`/${locale}/privacy`} target="_blank" rel="noreferrer" className="text-gold transition hover:text-gold-soft">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link></span>
      </label>

      <button type="submit" disabled={submitting} aria-disabled={submitting} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? <><span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"/><span>{isRtl ? "جارٍ إنشاء الحساب..." : "Creating account..."}</span></> : <span>{isRtl ? "إنشاء الحساب" : "Create account"}</span>}
      </button>
      <p className="text-center text-[11px] leading-5 text-white/30">{isRtl ? "سيتم تأكيد البريد برمز من 6 أرقام. توثيق رقم الجوال عبر SMS سيُفعّل لاحقًا." : "Email is verified with a 6-digit code. SMS mobile verification will be enabled later."}</p>
    </form>
  );
}
