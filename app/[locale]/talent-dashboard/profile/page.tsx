"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import TalentProfileReviewSubmitButton from "@/components/talent/TalentProfileReviewSubmitButton";
import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentBirthDateAction } from "@/lib/actions/update-own-talent-birth-date";
import { updateOwnTalentMainImageAction } from "@/lib/actions/update-own-talent-main-image";
import { getTalentCategoryLabel } from "@/lib/data/talent-categories";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";

type TalentRecord = Record<string, unknown> & {
  name_ar?: string | null;
  name_en?: string | null;
  phone?: string | null;
  image_url?: string | null;
  primary_role?: string | null;
  category_slug?: string | null;
  base_country_code?: string | null;
  city_slug?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  gender?: string | null;
  nationality?: string | null;
  nationality_slug?: string | null;
  date_of_birth?: string | null;
  profile_visibility?: string | null;
  data_accuracy_contact_consent?: boolean | null;
  approval_status?: string | null;
};

const GENDER_LABELS: Record<string, { ar: string; en: string }> = {
  male: { ar: "ذكر", en: "Male" },
  female: { ar: "أنثى", en: "Female" },
  other: { ar: "أخرى", en: "Other" },
  prefer_not_to_say: { ar: "أفضل عدم الإفصاح", en: "Prefer not to say" },
};

const COUNTRY_LABELS: Record<string, { ar: string; en: string }> = {
  SA: { ar: "السعودية", en: "Saudi Arabia" },
  AE: { ar: "الإمارات", en: "United Arab Emirates" },
  QA: { ar: "قطر", en: "Qatar" },
};

const NATIONALITY_LABELS: Record<string, { ar: string; en: string }> = {
  saudi: { ar: "سعودي", en: "Saudi" }, emirati: { ar: "إماراتي", en: "Emirati" },
  kuwaiti: { ar: "كويتي", en: "Kuwaiti" }, bahraini: { ar: "بحريني", en: "Bahraini" },
  qatari: { ar: "قطري", en: "Qatari" }, omani: { ar: "عُماني", en: "Omani" },
  yemeni: { ar: "يمني", en: "Yemeni" }, jordanian: { ar: "أردني", en: "Jordanian" },
  palestinian: { ar: "فلسطيني", en: "Palestinian" }, lebanese: { ar: "لبناني", en: "Lebanese" },
  syrian: { ar: "سوري", en: "Syrian" }, iraqi: { ar: "عراقي", en: "Iraqi" },
  egyptian: { ar: "مصري", en: "Egyptian" }, sudanese: { ar: "سوداني", en: "Sudanese" },
  moroccan: { ar: "مغربي", en: "Moroccan" }, algerian: { ar: "جزائري", en: "Algerian" },
  tunisian: { ar: "تونسي", en: "Tunisian" }, libyan: { ar: "ليبي", en: "Libyan" },
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function TalentProfileGuidedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";
  const router = useRouter();
  const photoRef = useRef<HTMLElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const [talent, setTalent] = useState<TalentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [dateMessage, setDateMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    setLoadError("");
    try {
      const result = (await getOwnTalentProfileAction(locale)) as TalentRecord | null;
      setTalent(result);
      setBirthDate(clean(result?.date_of_birth).slice(0, 10));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : isArabic ? "تعذر تحميل الملف." : "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const readiness = useMemo(() => getTalentProfileReadiness(talent ?? {}), [talent]);
  const strength = useMemo(() => calculateProfileCompletion((talent ?? {}) as never), [talent]);
  const percentage = readiness.totalRequirements
    ? Math.round((readiness.completedRequirements / readiness.totalRequirements) * 100)
    : 0;

  const role = clean(talent?.primary_role) || clean(talent?.category_slug);
  const roleLabel = getTalentCategoryLabel(role, locale) || role || (isArabic ? "غير محدد" : "Not set");
  const city = (isArabic ? clean(talent?.city_ar) : clean(talent?.city_en)) || clean(talent?.city_slug) || (isArabic ? "غير محدد" : "Not set");
  const genderKey = clean(talent?.gender);
  const gender = GENDER_LABELS[genderKey]?.[locale] || genderKey || (isArabic ? "غير محدد" : "Not set");
  const countryCode = clean(talent?.base_country_code).toUpperCase();
  const country = COUNTRY_LABELS[countryCode]?.[locale] || countryCode || (isArabic ? "غير محدد" : "Not set");
  const nationalityKey = clean(talent?.nationality_slug) || clean(talent?.nationality);
  const nationality = NATIONALITY_LABELS[nationalityKey]?.[locale] || nationalityKey || (isArabic ? "غير محدد" : "Not set");
  const firstMissing = readiness.missingRequirements[0];
  const missingCount = readiness.missingRequirements.length;
  const hasProfileImage = Boolean(clean(talent?.image_url));

  function goToRequirement(key: string) {
    if (key === "profile_image") {
      photoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (key === "date_of_birth") {
      dateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => dateRef.current?.focus(), 300);
      return;
    }
    router.push(`/${locale}/talent-dashboard/profile/advanced#${key}`);
  }

  async function saveBirthDate() {
    if (!birthDate) return;
    setSavingDate(true);
    setDateMessage("");
    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("date_of_birth", birthDate);
    const result = await updateOwnTalentBirthDateAction(payload);
    setDateMessage(result.message);
    if (result.success) {
      await loadProfile();
      router.refresh();
    }
    setSavingDate(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto w-full max-w-7xl animate-pulse space-y-4">
          <div className="h-10 w-56 rounded-xl bg-white/5" />
          <div className="h-48 rounded-[2rem] bg-white/[0.03]" />
          <div className="h-56 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </main>
    );
  }

  if (!talent || loadError) {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-40 text-white" dir={isArabic ? "rtl" : "ltr"}>
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.05] p-7 text-center">
          <h1 className="text-2xl font-light">{isArabic ? "تعذر فتح ملفك" : "We couldn't open your profile"}</h1>
          <p className="mt-3 text-sm text-white/55">{loadError || (isArabic ? "لم يتم العثور على ملف الموهبة." : "Talent profile not found.")}</p>
          <button onClick={() => void loadProfile()} className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">{isArabic ? "إعادة المحاولة" : "Try again"}</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-background px-4 pb-28 pt-40 text-white sm:px-6 sm:pt-44 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{isArabic ? "الملف المهني" : "PROFESSIONAL PROFILE"}</p>
          <h1 className="mt-3 text-3xl font-light leading-tight sm:text-5xl">{isArabic ? "أكمل ملفك المهني" : "Complete your professional profile"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">{isArabic ? "بيانات التسجيل محفوظة. أكمل فقط المتطلبات الأساسية ثم أرسل ملفك للمراجعة." : "Your signup details are saved. Complete only the core requirements, then submit for review."}</p>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] border border-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.18),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_280px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                {[roleLabel, city, gender, country].map((value) => <span key={value} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">{value}</span>)}
              </div>
              <h2 className="mt-6 text-2xl font-light sm:text-3xl">
                {readiness.isReady ? (isArabic ? "ملفك جاهز للمراجعة" : "Your profile is ready for review") : (isArabic ? `باقي ${missingCount === 1 ? "خطوة واحدة" : `${missingCount} خطوات`} لإرسال ملفك` : `${missingCount} step${missingCount === 1 ? "" : "s"} left before review`)}
              </h2>
              {!readiness.isReady && firstMissing ? (
                <button onClick={() => goToRequirement(firstMissing.key)} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-black">{isArabic ? "أكمل الخطوة التالية" : "Complete next step"}</button>
              ) : (
                <TalentProfileReviewSubmitButton locale={locale} onSubmitted={loadProfile} />
              )}
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              <p className="text-xs text-white/40">{isArabic ? "جاهزية الاعتماد" : "Approval readiness"}</p>
              <div className="mt-2 flex items-end justify-between"><p className="text-4xl font-light">{percentage}%</p><p className="text-xs text-white/45">{readiness.completedRequirements}/{readiness.totalRequirements}</p></div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${percentage}%` }} /></div>
            </div>
          </div>
        </section>

        <section ref={photoRef} id="profile-image" className={`mb-6 rounded-[2rem] border p-5 sm:p-7 ${hasProfileImage ? "border-emerald-400/20 bg-emerald-400/[0.025]" : "border-gold/30 bg-gold/[0.035]"}`}>
          <div className="grid gap-6 md:grid-cols-[150px_1fr] md:items-center">
            <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-full border-2 border-gold/35 bg-black/30 md:mx-0">
              {hasProfileImage ? <Image src={clean(talent.image_url)} alt={isArabic ? "الصورة الشخصية" : "Profile photo"} fill unoptimized sizes="144px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-5xl text-gold">{(clean(talent.name_ar) || clean(talent.name_en) || "M").charAt(0)}</div>}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "الصورة الشخصية" : "PROFILE PHOTO"}</p>
              <h2 className="mt-2 text-2xl font-light">{hasProfileImage ? (isArabic ? "صورتك الشخصية مضافة" : "Your profile photo is set") : (isArabic ? "أضف صورة شخصية واحدة على الأقل" : "Add at least one profile photo")}</h2>
              <p className="mt-2 text-sm leading-7 text-white/50">{isArabic ? "الصورة الشخصية شرط أساسي لإرسال الملف للمراجعة. معرض الأعمال منفصل واختياري." : "A profile photo is required before review. Your work gallery is separate and optional."}</p>
              <form action={updateOwnTalentMainImageAction} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="return_to" value="profile" />
                <input type="file" name="profile_image" required accept="image/jpeg,image/png,image/webp" className="block min-h-12 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/70 file:me-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black" />
                <button type="submit" className="min-h-12 rounded-2xl bg-gold px-6 text-sm font-semibold text-black">{hasProfileImage ? (isArabic ? "تغيير الصورة" : "Change photo") : (isArabic ? "حفظ الصورة" : "Save photo")}</button>
              </form>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "بياناتك الحالية" : "YOUR DETAILS"}</p><h2 className="mt-2 text-2xl font-light">{isArabic ? "من التسجيل" : "From signup"}</h2></div>
            <Link href={`/${locale}/talent-dashboard/profile/advanced#identity`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 hover:border-gold/30 hover:text-gold">{isArabic ? "تعديل البيانات" : "Edit details"}</Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[[isArabic ? "نوع الموهبة" : "Talent type", roleLabel],[isArabic ? "المدينة" : "City", city],[isArabic ? "الجنس" : "Gender", gender],[isArabic ? "الجنسية" : "Nationality", nationality]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] text-white/35">{label}</p><p className="mt-2 text-sm text-white/80">{value}</p></div>)}
          </div>
        </section>

        {!readiness.isReady ? (
          <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "المتبقي" : "WHAT'S LEFT"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "أكمل المطلوب فقط" : "Complete only what's required"}</h2>
            <div className="mt-6 space-y-3">
              {readiness.missingRequirements.map((requirement, index) => (
                <button key={requirement.key} onClick={() => goToRequirement(requirement.key)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-start hover:border-gold/35">
                  <div className="flex items-center gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.07] text-sm text-gold">{index + 1}</span><div><p className="text-sm text-white/85">{isArabic ? requirement.ar : requirement.en}</p><p className="mt-1 text-xs text-white/35">{requirement.key === "profile_image" ? (isArabic ? "صورة واضحة تمثلك مهنيًا" : "A clear professional photo") : requirement.key === "date_of_birth" ? (isArabic ? "بالتقويم الميلادي" : "Gregorian calendar") : (isArabic ? "مطلوب للاعتماد" : "Required for approval")}</p></div></div><span className="text-gold">{isArabic ? "←" : "→"}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {firstMissing?.key === "date_of_birth" ? (
          <section className="mb-6 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "الخطوة الحالية" : "CURRENT STEP"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "أضف تاريخ ميلادك" : "Add your date of birth"}</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input ref={dateRef} type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setBirthDate(event.target.value)} dir="ltr" className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-gold/50" />
              <button onClick={() => void saveBirthDate()} disabled={!birthDate || savingDate} className="min-h-14 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:opacity-40">{savingDate ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ والمتابعة" : "Save and continue")}</button>
            </div>
            {dateMessage ? <p className="mt-3 text-xs text-white/55">{dateMessage}</p> : null}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6"><p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "بعد الاعتماد" : "AFTER APPROVAL"}</p><div className="mt-2 flex items-center justify-between"><h2 className="text-xl font-light">{isArabic ? "قوِّ ملفك" : "Strengthen your profile"}</h2><span className="text-2xl text-gold">{strength}%</span></div><p className="mt-3 text-sm leading-7 text-white/45">{isArabic ? "النبذة والمهارات والخبرة والمقاسات اختيارية للاعتماد." : "Bio, skills, experience and measurements are optional for approval."}</p></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6"><p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "معرض الأعمال" : "PORTFOLIO"}</p><h2 className="mt-2 text-xl font-light">{isArabic ? "أعمالك وصورك الإضافية" : "Your work and extra photos"}</h2><p className="mt-3 text-sm leading-7 text-white/45">{isArabic ? "اختياري ولا يؤثر على إرسال الملف للمراجعة." : "Optional and does not block review submission."}</p><Link href={`/${locale}/talent-dashboard/gallery`} className="mt-5 inline-flex text-sm text-gold">{isArabic ? "فتح معرض الأعمال ←" : "Open portfolio →"}</Link></div>
        </section>
      </div>
    </main>
  );
}
