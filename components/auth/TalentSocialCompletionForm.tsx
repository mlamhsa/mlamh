"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import {
  GENDER_OPTIONS,
  NATIONALITY_OPTIONS,
  TALENT_SIGNUP_COUNTRIES,
} from "@/lib/data/talent-signup";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  suggestedName: string;
  email: string;
  provider?: "google" | "apple" | "email" | "social";
  initial?: {
    nationality?: string;
    gender?: string;
    residenceCountryCode?: string;
    citySlug?: string;
    talentType?: string;
    profileVisibility?: "public" | "private";
  };
};

const ACTIVE_MARKET_CODE = "SA";

function normalizeLocalPhone(value: string) {
  return value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 15);
}

export function TalentSocialCompletionForm({
  locale,
  suggestedName,
  email,
  provider = "social",
  initial,
}: Props) {
  const isRtl = locale === "ar";
  const router = useRouter();
  const [fullName, setFullName] = useState(suggestedName);
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState(initial?.nationality ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [city, setCity] = useState(initial?.citySlug ?? "");
  const [talentType, setTalentType] = useState(initial?.talentType ?? "");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedAccuracy, setAcceptedAccuracy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // New registrations use the currently active Saudi market. If an older,
  // incomplete account already carries a valid country value, preserve it so
  // this UX change never rewrites that user's existing market data.
  const selectedResidenceCountry = useMemo(() => {
    const preserved = initial?.residenceCountryCode
      ? TALENT_SIGNUP_COUNTRIES.find((item) => item.code === initial.residenceCountryCode)
      : null;
    return preserved ?? TALENT_SIGNUP_COUNTRIES.find((item) => item.code === ACTIVE_MARKET_CODE) ?? TALENT_SIGNUP_COUNTRIES[0];
  }, [initial?.residenceCountryCode]);

  const phoneCountry = useMemo(
    () => TALENT_SIGNUP_COUNTRIES.find((item) => item.code === ACTIVE_MARKET_CODE) ?? TALENT_SIGNUP_COUNTRIES[0],
    [],
  );
  const normalizedPhone = phone ? `${phoneCountry.dialCode}${phone}` : "";
  const inputClass = "min-h-14 w-full rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none transition focus:border-gold/60";
  const providerLabel = provider === "google" ? "Google" : provider === "apple" ? "Apple" : null;

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
        phone_country_iso: phoneCountry.code,
        phone_country_code: phoneCountry.dialCode,
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
        profile_visibility: initial?.profileVisibility ?? "public",
        preferred_locale: locale,
        terms_accepted: true,
        terms_accepted_at: now,
        data_accuracy_contact_consent: true,
        data_accuracy_contact_consent_at: now,
        onboarding_status: "profile_in_progress",
        onboarding_step: "core_data",
      };

      const { error: metadataError } = await supabase.auth.updateUser({ data: metadata });
      if (metadataError) throw metadataError;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("NO_SESSION");

      const response = await fetch("/api/account/details", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ displayName: cleanName, phone: normalizedPhone, accountType: "talent" }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.code ?? "FINALIZE_FAILED");

      window.dispatchEvent(new Event("mlamh:account-updated"));
      router.replace(`/${locale}/talent-dashboard/profile`);
      router.refresh();
    } catch (submitError) {
      console.error("[TalentSocialCompletionForm]", submitError);
      setError(isRtl ? "تعذر حفظ بياناتك الآن. تحقق من البيانات وحاول مرة أخرى." : "We could not save your details. Check the information and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] px-4 py-3 text-sm leading-6 text-white/65">
        {providerLabel
          ? isRtl
            ? `تم تسجيل دخولك عبر ${providerLabel}. جلبنا بيانات حسابك، وأكمل فقط البيانات الأساسية أدناه.`
            : `You're signed in with ${providerLabel}. We loaded your account details; complete only the essentials below.`
          : isRtl
            ? "أكمل البيانات الأساسية مرة واحدة، ثم ستنتقل مباشرة إلى ملفك المهني."
            : "Complete the essentials once, then you'll go straight to your professional profile."}
      </div>

      {error ? <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={isRtl ? "الاسم الكامل" : "Full name"}>
          <input required value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} autoComplete="name" minLength={2} maxLength={100} className={inputClass} />
        </Field>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <p className="text-xs text-white/35">{isRtl ? "البريد الإلكتروني" : "Email"}</p>
          <p className="mt-1 truncate text-sm text-white/75" dir="ltr">{email}</p>
          <p className="mt-1 text-[11px] text-white/30">{isRtl ? "من حساب تسجيل الدخول" : "From your sign-in account"}</p>
        </div>
      </div>

      <Field label={isRtl ? "رقم الجوال" : "Mobile number"}>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2" dir="ltr">
          <div className="flex min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] px-3 text-sm text-white/70">{phoneCountry.dialCode}</div>
          <input required type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(normalizeLocalPhone(e.currentTarget.value))} placeholder={phoneCountry.phoneExample} autoComplete="tel-national" className={`${inputClass} text-left`} />
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "الجنسية" : "Nationality"}>
          <select required value={nationality} onChange={(e) => setNationality(e.currentTarget.value)} className={inputClass}>
            <option value="">{isRtl ? "اختر الجنسية" : "Select nationality"}</option>
            {NATIONALITY_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
          </select>
        </Field>
        <Field label={isRtl ? "الجنس" : "Gender"}>
          <select required value={gender} onChange={(e) => setGender(e.currentTarget.value)} className={inputClass}>
            <option value="">{isRtl ? "اختر" : "Select"}</option>
            {GENDER_OPTIONS.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isRtl ? "المدينة" : "City"}>
          <select required value={city} onChange={(e) => setCity(e.currentTarget.value)} className={inputClass}>
            <option value="">{isRtl ? "اختر المدينة" : "Select city"}</option>
            {selectedResidenceCountry.cities.map((item) => <option key={item.value} value={item.value} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
          </select>
        </Field>
        <Field label={isRtl ? "نوع الموهبة" : "Talent type"}>
          <select required value={talentType} onChange={(e) => setTalentType(e.currentTarget.value)} className={inputClass}>
            <option value="">{isRtl ? "اختر نوع الموهبة" : "Select talent type"}</option>
            {TALENT_CATEGORIES.map((item) => <option key={item.slug} value={item.slug} className="bg-black">{isRtl ? item.ar : item.en}</option>)}
          </select>
        </Field>
      </div>

      <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs leading-6 text-white/45">
        {isRtl
          ? "ملامح يعمل حاليًا في السعودية، لذلك لا نطلب منك اختيار بلد الإقامة أثناء التسجيل. يمكنك إضافة بقية بيانات ملفك المهني بعد هذه الخطوة."
          : "MLAMH currently operates in Saudi Arabia, so we don't ask you to choose a residence country during signup. You can add the rest of your professional profile next."}
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="checkbox" required checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.currentTarget.checked)} className="mt-1 h-5 w-5 accent-[#c8a96a]" />
        <span className="text-xs leading-6 text-white/55">
          {isRtl ? "أوافق على " : "I agree to the "}<Link href={`/${locale}/terms`} target="_blank" className="text-gold">{isRtl ? "الشروط" : "Terms"}</Link>{isRtl ? " و" : " and "}<Link href={`/${locale}/privacy`} target="_blank" className="text-gold">{isRtl ? "سياسة الخصوصية" : "Privacy Policy"}</Link>.
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input type="checkbox" required checked={acceptedAccuracy} onChange={(e) => setAcceptedAccuracy(e.currentTarget.checked)} className="mt-1 h-5 w-5 accent-[#c8a96a]" />
        <span className="text-xs leading-6 text-white/55">
          {isRtl
            ? "أؤكد أن المعلومات التي قدمتها صحيحة، وأسمح لملامح بحفظ بياناتي والتواصل معي بخصوص الفرص والمشاريع المناسبة. ولا تُستخدم صوري أو فيديوهاتي في إعلانات تجارية خارج خدمات ملامح دون موافقة مناسبة."
            : "I confirm the information I provided is accurate and allow MLAMH to store my data and contact me about relevant opportunities and projects. My photos or videos will not be used in external commercial advertising without appropriate consent."}
        </span>
      </label>

      <button type="submit" disabled={submitting} className="min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:opacity-60">
        {submitting ? (isRtl ? "جارٍ حفظ بياناتك..." : "Saving your details...") : (isRtl ? "حفظ والانتقال إلى ملفي" : "Save and continue to my profile")}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm text-white/70">{label}<span className="text-gold"> *</span></span>{children}</label>;
}
