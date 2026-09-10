"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentBirthDateAction } from "@/lib/actions/update-own-talent-birth-date";
import { setOwnTalentProfileImageFromGalleryAction } from "@/lib/actions/set-own-talent-profile-image";
import { getTalentCategoryLabel } from "@/lib/data/talent-categories";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import { calculateProfileCompletion } from "@/lib/utils/profile-completion";

type TalentRecord = Record<string, unknown> & {
  name_ar?: string | null;
  name_en?: string | null;
  phone?: string | null;
  image_url?: string | null;
  gallery_images?: unknown;
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
  saudi: { ar: "سعودي", en: "Saudi" },
  emirati: { ar: "إماراتي", en: "Emirati" },
  kuwaiti: { ar: "كويتي", en: "Kuwaiti" },
  bahraini: { ar: "بحريني", en: "Bahraini" },
  qatari: { ar: "قطري", en: "Qatari" },
  omani: { ar: "عُماني", en: "Omani" },
  yemeni: { ar: "يمني", en: "Yemeni" },
  jordanian: { ar: "أردني", en: "Jordanian" },
  palestinian: { ar: "فلسطيني", en: "Palestinian" },
  lebanese: { ar: "لبناني", en: "Lebanese" },
  syrian: { ar: "سوري", en: "Syrian" },
  iraqi: { ar: "عراقي", en: "Iraqi" },
  egyptian: { ar: "مصري", en: "Egyptian" },
  sudanese: { ar: "سوداني", en: "Sudanese" },
  moroccan: { ar: "مغربي", en: "Moroccan" },
  algerian: { ar: "جزائري", en: "Algerian" },
  tunisian: { ar: "تونسي", en: "Tunisian" },
  libyan: { ar: "ليبي", en: "Libyan" },
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      return normalizeGallery(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  return [];
}

export default function TalentProfileGuidedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = use(params);
  const locale: Locale = isValidLocale(localeParam) ? localeParam : "ar";
  const isArabic = locale === "ar";
  const router = useRouter();
  const dateRef = useRef<HTMLInputElement>(null);

  const [talent, setTalent] = useState<TalentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [dateMessage, setDateMessage] = useState("");
  const [settingProfileImage, setSettingProfileImage] = useState(false);
  const [profileImageMessage, setProfileImageMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    setLoadError("");
    try {
      const result = (await getOwnTalentProfileAction(locale)) as TalentRecord | null;
      setTalent(result);
      setBirthDate(clean(result?.date_of_birth).slice(0, 10));
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : isArabic
            ? "تعذر تحميل الملف."
            : "Unable to load your profile.",
      );
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
  const roleLabel =
    getTalentCategoryLabel(role, locale) || role || (isArabic ? "غير محدد" : "Not set");
  const cityLabel = isArabic ? clean(talent?.city_ar) : clean(talent?.city_en);
  const city = cityLabel || clean(talent?.city_slug) || (isArabic ? "غير محدد" : "Not set");
  const genderKey = clean(talent?.gender);
  const gender =
    GENDER_LABELS[genderKey]?.[locale] || genderKey || (isArabic ? "غير محدد" : "Not set");
  const countryCode = clean(talent?.base_country_code).toUpperCase();
  const country =
    COUNTRY_LABELS[countryCode]?.[locale] || countryCode || (isArabic ? "غير محدد" : "Not set");
  const nationalityKey = clean(talent?.nationality_slug) || clean(talent?.nationality);
  const nationality =
    NATIONALITY_LABELS[nationalityKey]?.[locale] ||
    nationalityKey ||
    (isArabic ? "غير محدد" : "Not set");

  const galleryImages = useMemo(() => normalizeGallery(talent?.gallery_images), [talent?.gallery_images]);
  const firstGalleryImage = galleryImages[0] || "";
  const firstMissing = readiness.missingRequirements[0];
  const missingCount = readiness.missingRequirements.length;

  function goToRequirement(key: string) {
    if (key === "date_of_birth") {
      dateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => dateRef.current?.focus(), 350);
      return;
    }
    if (key === "profile_image") {
      router.push(`/${locale}/talent-dashboard/gallery`);
      return;
    }
    router.push(`/${locale}/talent-dashboard/profile/advanced#${
      key === "primary_role"
        ? "specialization"
        : key === "country"
          ? "residence-country"
          : key === "profile_visibility" || key === "data_accuracy_contact_consent"
            ? "privacy"
            : "identity"
    }`);
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

  async function useUploadedImageAsProfilePhoto() {
    if (!firstGalleryImage || settingProfileImage) return;

    setSettingProfileImage(true);
    setProfileImageMessage("");

    const result = await setOwnTalentProfileImageFromGalleryAction(locale, firstGalleryImage);
    setProfileImageMessage(result.message);

    if (result.success) {
      await loadProfile();
      router.refresh();
    }

    setSettingProfileImage(false);
  }

  if (loading) {
    return (
      <main
        className="min-h-screen bg-background px-4 pb-24 pt-40 text-white"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-10 w-56 rounded-xl bg-white/5" />
          <div className="h-48 rounded-[2rem] bg-white/[0.03]" />
          <div className="h-56 rounded-[2rem] bg-white/[0.03]" />
        </div>
      </main>
    );
  }

  if (!talent || loadError) {
    return (
      <main
        className="min-h-screen bg-background px-4 pb-24 pt-40 text-white"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="mx-auto max-w-xl rounded-[2rem] border border-red-400/20 bg-red-400/[0.05] p-7 text-center">
          <h1 className="text-2xl font-light">
            {isArabic ? "تعذر فتح ملفك" : "We couldn't open your profile"}
          </h1>
          <p className="mt-3 text-sm text-white/55">
            {loadError ||
              (isArabic ? "لم يتم العثور على ملف الموهبة." : "Talent profile not found.")}
          </p>
          <button
            onClick={() => void loadProfile()}
            className="mt-6 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black"
          >
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-background px-4 pb-28 pt-40 text-white sm:px-6 sm:pt-44 lg:pt-36"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            {isArabic ? "الملف المهني" : "PROFESSIONAL PROFILE"}
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-light leading-tight sm:text-5xl">
                {isArabic ? "أكمل ملفك المهني" : "Complete your professional profile"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                {isArabic
                  ? "جمعنا البيانات التي أدخلتها أثناء التسجيل. ركّز فقط على الخطوات المتبقية، وسنرشدك خطوة بخطوة."
                  : "We've carried over the information from signup. Focus only on what's left and we'll guide you step by step."}
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-2 text-xs text-emerald-200">
              {isArabic ? "✓ بيانات التسجيل محفوظة" : "✓ Signup data saved"}
            </span>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] border border-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.18),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_280px] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">
                  {roleLabel}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">
                  {city}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">
                  {gender}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">
                  {country}
                </span>
              </div>

              <h2 className="mt-6 text-2xl font-light sm:text-3xl">
                {readiness.isReady
                  ? isArabic
                    ? "ملفك جاهز للمراجعة"
                    : "Your profile is ready for review"
                  : isArabic
                    ? `باقي ${missingCount === 1 ? "خطوة واحدة" : `${missingCount} خطوات`} لإرسال ملفك`
                    : `${missingCount} step${missingCount === 1 ? "" : "s"} left before review`}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/55">
                {readiness.isReady
                  ? isArabic
                    ? "أكملت جميع متطلبات الاعتماد الأساسية."
                    : "You've completed every core approval requirement."
                  : isArabic
                    ? "لا نطلب منك إعادة البيانات التي سجلتها سابقًا. أكمل فقط العناصر الناقصة أدناه."
                    : "We won't ask you to re-enter signup data. Complete only the missing items below."}
              </p>

              {!readiness.isReady && firstMissing ? (
                <button
                  onClick={() => goToRequirement(firstMissing.key)}
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-black transition hover:bg-[#e0bd73]"
                >
                  {isArabic ? "أكمل الخطوة التالية" : "Complete next step"}
                </button>
              ) : (
                <Link
                  href={`/${locale}/talent-dashboard/profile/advanced`}
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-semibold text-black"
                >
                  {isArabic ? "مراجعة الملف وإرساله" : "Review and submit"}
                </Link>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-white/40">
                    {isArabic ? "جاهزية الاعتماد" : "Approval readiness"}
                  </p>
                  <p className="mt-2 text-4xl font-light text-white">{percentage}%</p>
                </div>
                <p className="text-xs text-white/45">
                  {readiness.completedRequirements}/{readiness.totalRequirements}
                </p>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-4 text-xs leading-6 text-white/40">
                {isArabic
                  ? "هذه النسبة تخص متطلبات الاعتماد فقط، وليست قوة ملفك."
                  : "This score reflects approval requirements only, not profile strength."}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold">
                {isArabic ? "بياناتك الحالية" : "YOUR DETAILS"}
              </p>
              <h2 className="mt-2 text-2xl font-light">
                {isArabic ? "أدخلناها لك من التسجيل" : "Carried over from signup"}
              </h2>
            </div>
            <Link
              href={`/${locale}/talent-dashboard/profile/advanced#identity`}
              className="text-sm text-white/50 underline decoration-white/20 underline-offset-4 transition hover:text-gold"
            >
              {isArabic ? "تعديل البيانات" : "Edit details"}
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [isArabic ? "نوع الموهبة" : "Talent type", roleLabel],
              [isArabic ? "المدينة" : "City", city],
              [isArabic ? "الجنس" : "Gender", gender],
              [isArabic ? "الجنسية" : "Nationality", nationality],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] text-white/35">{label}</p>
                <p className="mt-2 text-sm text-white/80">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {!readiness.isReady ? (
          <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-gold">
                  {isArabic ? "المتبقي" : "WHAT'S LEFT"}
                </p>
                <h2 className="mt-2 text-2xl font-light">
                  {isArabic ? "أكمل المطلوب فقط" : "Complete only what's required"}
                </h2>
              </div>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1.5 text-xs text-amber-200">
                {missingCount}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {readiness.missingRequirements.map((requirement, index) => (
                <button
                  key={requirement.key}
                  onClick={() => goToRequirement(requirement.key)}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-start transition hover:border-gold/35 hover:bg-gold/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.07] text-sm text-gold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white/85">
                        {isArabic ? requirement.ar : requirement.en}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        {requirement.key === "profile_image"
                          ? isArabic
                            ? "صورة واضحة تمثلك مهنيًا"
                            : "A clear professional photo"
                          : requirement.key === "date_of_birth"
                            ? isArabic
                              ? "بالتقويم الميلادي"
                              : "Gregorian calendar"
                            : isArabic
                              ? "مطلوب للاعتماد"
                              : "Required for approval"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-gold transition group-hover:translate-x-[-2px]"
                    aria-hidden="true"
                  >
                    {isArabic ? "←" : "→"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {firstMissing?.key === "profile_image" && firstGalleryImage ? (
          <section className="mb-6 rounded-[2rem] border border-emerald-400/20 bg-emerald-400/[0.045] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-300">
              {isArabic ? "وجدنا صورتك المرفوعة" : "UPLOADED PHOTO FOUND"}
            </p>
            <h2 className="mt-2 text-2xl font-light">
              {isArabic ? "اعتمدها كصورتك الشخصية" : "Use it as your profile photo"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/50">
              {isArabic
                ? "الصورة موجودة في معرض أعمالك، لكنها لم تُعتمد كصورة شخصية بعد. اضغط مرة واحدة لاعتمادها وتحديث نسبة الجاهزية."
                : "The photo is already in your portfolio but has not been selected as your profile photo. Confirm it once to update your readiness."}
            </p>
            <button
              onClick={() => void useUploadedImageAsProfilePhoto()}
              disabled={settingProfileImage}
              className="mt-5 min-h-12 rounded-full bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {settingProfileImage
                ? isArabic
                  ? "جارٍ الاعتماد..."
                  : "Setting photo..."
                : isArabic
                  ? "اعتماد الصورة والمتابعة"
                  : "Use photo and continue"}
            </button>
            {profileImageMessage ? (
              <p className="mt-3 text-xs text-white/60">{profileImageMessage}</p>
            ) : null}
          </section>
        ) : null}

        {firstMissing?.key === "date_of_birth" ? (
          <section className="mb-6 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">
              {isArabic ? "الخطوة الحالية" : "CURRENT STEP"}
            </p>
            <h2 className="mt-2 text-2xl font-light">
              {isArabic ? "أضف تاريخ ميلادك" : "Add your date of birth"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-white/50">
              {isArabic
                ? "نستخدم تاريخ الميلاد للمطابقة المناسبة والتحقق من أهلية بعض الفرص. أدخله بالتقويم الميلادي."
                : "We use your date of birth for matching and eligibility. Enter it using the Gregorian calendar."}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                ref={dateRef}
                type="date"
                value={birthDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setBirthDate(event.target.value)}
                dir="ltr"
                className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-gold/50"
              />
              <button
                onClick={() => void saveBirthDate()}
                disabled={!birthDate || savingDate}
                className="min-h-14 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingDate
                  ? isArabic
                    ? "جارٍ الحفظ..."
                    : "Saving..."
                  : isArabic
                    ? "حفظ والمتابعة"
                    : "Save and continue"}
              </button>
            </div>
            {dateMessage ? <p className="mt-3 text-xs text-white/55">{dateMessage}</p> : null}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                  {isArabic ? "بعد الاعتماد" : "AFTER APPROVAL"}
                </p>
                <h2 className="mt-2 text-xl font-light">
                  {isArabic ? "قوِّ ملفك" : "Strengthen your profile"}
                </h2>
              </div>
              <span className="text-2xl font-light text-gold">{strength}%</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/45">
              {isArabic
                ? "النبذة والمهارات والخبرة والمقاسات اختيارية للاعتماد، لكنها تساعدك في الظهور في ترشيحات أفضل."
                : "Bio, skills, experience and measurements are optional for approval, but help you rank for better matches."}
            </p>
            <Link
              href={`/${locale}/talent-dashboard/profile/advanced`}
              className="mt-5 inline-flex text-sm text-gold"
            >
              {isArabic ? "تطوير الملف" : "Improve profile"} {isArabic ? "←" : "→"}
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
              {isArabic ? "معرض الأعمال" : "PORTFOLIO"}
            </p>
            <h2 className="mt-2 text-xl font-light">
              {isArabic ? "صورك وأعمالك في مكان واحد" : "Your work in one place"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/45">
              {isArabic
                ? "أضف صورًا مهنية ورتّب معرضك. الصورة الشخصية تُعتمد بشكل مستقل حتى تكون واضحة للجهات."
                : "Add professional work and organize your gallery. Your profile photo is selected separately so it stays clear to publishers."}
            </p>
            <Link
              href={`/${locale}/talent-dashboard/gallery`}
              className="mt-5 inline-flex text-sm text-gold"
            >
              {isArabic ? "فتح معرض الأعمال" : "Open portfolio"} {isArabic ? "←" : "→"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
