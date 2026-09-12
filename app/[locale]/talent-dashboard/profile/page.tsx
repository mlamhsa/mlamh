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
  slug?: string | null;
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
  const photoFormRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const [talent, setTalent] = useState<TalentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [dateMessage, setDateMessage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
  const isBirthDateMissing = readiness.missingRequirements.some((requirement) => requirement.key === "date_of_birth");
  const hasProfileImage = Boolean(clean(talent?.image_url));
  const publicSlug = clean(talent?.slug);
  const approvalStatus = clean(talent?.approval_status).toLowerCase() || "not_submitted";
  const isUnderReview = approvalStatus === "submitted" || approvalStatus === "pending";
  const isApproved = approvalStatus === "approved";
  const isChangesRequested = approvalStatus === "changes_requested";
  const isRejected = approvalStatus === "rejected";
  const isDraft = approvalStatus === "not_submitted";
  const canShowCompletionTasks = isDraft || isChangesRequested;
  const canEditProfile = !isUnderReview;

  const headerTitle = isApproved
    ? (isArabic ? "ملفك المهني" : "Your professional profile")
    : isUnderReview
      ? (isArabic ? "ملفك قيد المراجعة" : "Your profile is under review")
      : isChangesRequested
        ? (isArabic ? "حدّث ملفك المهني" : "Update your professional profile")
        : isRejected
          ? (isArabic ? "راجع حالة ملفك" : "Review your profile status")
          : (isArabic ? "أكمل ملفك المهني" : "Complete your professional profile");

  const headerDescription = isApproved
    ? (isArabic ? "ملفك معتمد وفعال. يمكنك تحسين بياناتك المهنية ومعرض أعمالك في أي وقت." : "Your profile is approved and active. You can keep improving your professional details and portfolio at any time.")
    : isUnderReview
      ? (isArabic ? "تم إرسال ملفك للمراجعة. لا يلزم أي إجراء الآن، وستتحدث الحالة تلقائيًا عند صدور القرار." : "Your profile has been submitted. No action is needed now; the status will update when a decision is made.")
      : isChangesRequested
        ? (isArabic ? "طلب فريق المراجعة تحديث بعض البيانات. أكمل المطلوب فقط ثم أعد الإرسال." : "The review team requested updates. Complete only what is required, then resubmit.")
        : isRejected
          ? (isArabic ? "راجع حالة الملف وملاحظات المراجعة قبل إجراء أي تعديل جديد." : "Review the profile status and review notes before making new changes.")
          : (isArabic ? "بيانات التسجيل محفوظة. أكمل فقط المتطلبات الأساسية ثم أرسل ملفك للمراجعة." : "Your signup details are saved. Complete only the core requirements, then submit for review.");

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
          <h1 className="mt-3 text-3xl font-light leading-tight sm:text-5xl">{headerTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">{headerDescription}</p>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] border border-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.18),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_280px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                {[roleLabel, city, gender, country].map((value) => <span key={value} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">{value}</span>)}
              </div>
              <h2 className="mt-6 text-2xl font-light sm:text-3xl">
                {isApproved
                  ? (isArabic ? "ملفك معتمد ونشط" : "Your profile is approved and active")
                  : isUnderReview
                    ? (isArabic ? "تم إرسال ملفك للمراجعة" : "Your profile has been submitted for review")
                    : isChangesRequested
                      ? (isArabic ? "هناك تحديثات مطلوبة قبل الاعتماد" : "Updates are required before approval")
                      : isRejected
                        ? (isArabic ? "الملف يحتاج مراجعة قبل إعادة الإرسال" : "Review your profile before resubmitting")
                        : readiness.isReady
                          ? (isArabic ? "ملفك جاهز للمراجعة" : "Your profile is ready for review")
                          : (isArabic ? `باقي ${missingCount === 1 ? "خطوة واحدة" : `${missingCount} خطوات`} لإرسال ملفك` : `${missingCount} steps left to submit your profile`)}
              </h2>
              {!isApproved && !isUnderReview && firstMissing ? <button onClick={() => goToRequirement(firstMissing.key)} className="mt-5 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">{isArabic ? "أكمل الخطوة التالية" : "Complete next step"}</button> : null}
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              {isApproved ? (
                <>
                  <p className="text-xs text-white/40">{isArabic ? "قوة الملف" : "Profile strength"}</p>
                  <div className="mt-2 flex items-end justify-between"><p className="text-4xl font-light">{strength}%</p><p className="text-xs text-emerald-200">{isArabic ? "معتمد" : "Approved"}</p></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${strength}%` }} /></div>
                  <p className="mt-3 text-xs leading-6 text-white/40">{isArabic ? "استمر بإضافة أعمالك ومعلوماتك المهنية لزيادة قوة ظهورك." : "Keep adding work and professional details to strengthen your profile."}</p>
                </>
              ) : isUnderReview ? (
                <>
                  <p className="text-xs text-white/40">{isArabic ? "حالة الملف" : "Profile status"}</p>
                  <p className="mt-3 text-2xl font-light text-amber-100">{isArabic ? "قيد المراجعة" : "Under review"}</p>
                  <p className="mt-3 text-xs leading-6 text-white/40">{isArabic ? "سنحدث الحالة فور اكتمال المراجعة." : "We will update this status as soon as review is complete."}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/40">{isArabic ? "جاهزية الاعتماد" : "Approval readiness"}</p>
                  <div className="mt-2 flex items-end justify-between"><p className="text-4xl font-light">{percentage}%</p><p className="text-xs text-white/45">{readiness.completedRequirements}/{readiness.totalRequirements}</p></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${percentage}%` }} /></div>
                </>
              )}
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
              <p className="mt-2 text-sm leading-7 text-white/50">
                {isApproved
                  ? (isArabic ? "صورتك هي أول ما يراه الناشرون. استخدم صورة واضحة وحديثة تعكس حضورك المهني." : "Your photo is one of the first things publishers see. Use a clear, current image that represents you professionally.")
                  : isUnderReview
                    ? (isArabic ? "ملفك قيد المراجعة حاليًا. لا تحتاج لتغيير الصورة الآن." : "Your profile is currently under review. You do not need to change the photo now.")
                    : (isArabic ? "الصورة الشخصية شرط أساسي لإرسال الملف للمراجعة. معرض الأعمال منفصل واختياري." : "A profile photo is required before review. Your work gallery is separate and optional.")}
              </p>
              {canEditProfile ? (
                <form ref={photoFormRef} action={updateOwnTalentMainImageAction} className="mt-5">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="return_to" value="profile" />
                  <input
                    ref={photoInputRef}
                    type="file"
                    name="profile_image"
                    required
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onClick={(event) => {
                      event.currentTarget.value = "";
                    }}
                    onChange={(event) => {
                      if (!event.currentTarget.files?.length || uploadingPhoto) return;
                      setUploadingPhoto(true);
                      window.setTimeout(() => photoFormRef.current?.requestSubmit(), 0);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-gold px-6 text-sm font-semibold text-black transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {uploadingPhoto
                      ? (isArabic ? "جارٍ رفع الصورة..." : "Uploading photo...")
                      : hasProfileImage
                        ? (isArabic ? "اختيار صورة جديدة" : "Choose a new photo")
                        : (isArabic ? "اختيار صورة من الاستديو" : "Choose photo from library")}
                  </button>
                  <p className={`mt-3 text-xs ${uploadingPhoto ? "text-gold" : "text-white/35"}`}>
                    {uploadingPhoto
                      ? (isArabic ? "جارٍ رفع الصورة، لا تغلق الصفحة." : "Uploading your photo. Please keep this page open.")
                      : (isArabic ? "اختر صورة JPG أو PNG أو WEBP وسيبدأ الرفع مباشرة." : "Choose a JPG, PNG or WEBP image and upload will start automatically.")}
                  </p>
                </form>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "بياناتك الحالية" : "YOUR DETAILS"}</p><h2 className="mt-2 text-2xl font-light">{isArabic ? "ملخص الملف" : "Profile summary"}</h2></div>
            {canEditProfile ? (
              <Link href={`/${locale}/talent-dashboard/profile/${isApproved ? "details" : "advanced#identity"}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 text-sm text-white/60 hover:border-gold/30 hover:text-gold">
                {isArabic ? "تعديل الملف" : "Edit profile"}
              </Link>
            ) : null}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[[isArabic ? "نوع الموهبة" : "Talent type", roleLabel],[isArabic ? "المدينة" : "City", city],[isArabic ? "الجنس" : "Gender", gender],[isArabic ? "الجنسية" : "Nationality", nationality]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[11px] text-white/35">{label}</p><p className="mt-2 text-sm text-white/80">{value}</p></div>)}
          </div>
        </section>

        {canShowCompletionTasks && !readiness.isReady ? (
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

        {canShowCompletionTasks && isBirthDateMissing ? (
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
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "قوة الملف" : "PROFILE STRENGTH"}</p>
            <div className="mt-2 flex items-center justify-between"><h2 className="text-xl font-light">{isArabic ? "قوِّ ملفك" : "Strengthen your profile"}</h2><span className="text-2xl text-gold">{strength}%</span></div>
            <p className="mt-3 text-sm leading-7 text-white/45">
              {isApproved
                ? (isArabic ? "أضف المهارات والخبرة والمقاسات والأعمال المناسبة لتزيد جودة ملفك ووضوحه للناشرين." : "Add relevant skills, experience, measurements and work to make your profile stronger for publishers.")
                : (isArabic ? "النبذة والمهارات والخبرة والمقاسات اختيارية للاعتماد." : "Bio, skills, experience and measurements are optional for approval.")}
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "معرض الأعمال" : "PORTFOLIO"}</p>
            <h2 className="mt-2 text-xl font-light">{isArabic ? "أعمالك وصورك الإضافية" : "Your work and extra photos"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/45">
              {isApproved
                ? (isArabic ? "اعرض أفضل أعمالك ليتمكن الناشرون من تقييمك بسرعة وبشكل احترافي." : "Show your best work so publishers can evaluate you quickly and professionally.")
                : (isArabic ? "اختياري ولا يؤثر على إرسال الملف للمراجعة." : "Optional and does not block review submission.")}
            </p>
            <Link href={`/${locale}/talent-dashboard/gallery`} className="mt-5 inline-flex text-sm text-gold">{isArabic ? "فتح معرض الأعمال ←" : "Open portfolio →"}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}