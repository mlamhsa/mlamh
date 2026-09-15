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
import { resolveNationality } from "@/lib/data/nationality-normalization";
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  async function loadProfile(options?: { silent?: boolean }) {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const result = (await getOwnTalentProfileAction(locale)) as TalentRecord | null;
      setTalent(result);
      setBirthDate(clean(result?.date_of_birth).slice(0, 10));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : isArabic ? "تعذر تحميل الملف." : "Unable to load your profile.");
    } finally {
      if (!silent) setLoading(false);
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
  const nationalityDefinition = resolveNationality(nationalityKey);
  const nationality = nationalityDefinition
    ? (isArabic ? nationalityDefinition.ar : nationalityDefinition.en)
    : nationalityKey || (isArabic ? "غير محدد" : "Not set");

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
  const canShowCompletionTasks = isDraft || isChangesRequested || isRejected;
  const canEditProfile = !isUnderReview;

  const headerTitle = isApproved
    ? (isArabic ? "ملفي" : "My profile")
    : isUnderReview
      ? (isArabic ? "ملفي قيد المراجعة" : "My profile is under review")
      : isChangesRequested
        ? (isArabic ? "حدّث ملفك" : "Update your profile")
        : isRejected
          ? (isArabic ? "راجع حالة ملفك" : "Review your profile status")
          : (isArabic ? "ملفي" : "My profile");

  const headerDescription = isApproved
    ? (isArabic ? "كل ما يخص هويتك المهنية وأعمالك وروابطك في مكان واحد." : "Manage your professional identity, work and links from one place.")
    : isUnderReview
      ? (isArabic ? "تم إرسال ملفك للمراجعة. لا يلزم أي إجراء الآن، وستتحدث الحالة تلقائيًا عند صدور القرار." : "Your profile has been submitted. No action is needed now; the status will update when a decision is made.")
      : isChangesRequested
        ? (isArabic ? "أكمل التحديثات المطلوبة فقط ثم أعد إرسال الملف للمراجعة." : "Complete only the requested updates, then resubmit your profile.")
        : isRejected
          ? (isArabic ? "راجع حالة الملف وملاحظات المراجعة قبل إجراء أي تعديل جديد." : "Review the profile status and review notes before making new changes.")
          : (isArabic ? "أكمل متطلبات المراجعة، ويمكنك تحسين باقي الملف في أي وقت." : "Complete the review requirements, and strengthen the rest of your profile anytime.");

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

  async function uploadProfilePhoto(file: File) {
    if (uploadingPhoto) return;
    const payload = new FormData();
    payload.set("locale", locale);
    payload.set("return_to", "profile");
    payload.set("profile_image", file, file.name);
    setUploadingPhoto(true);
    try {
      await updateOwnTalentMainImageAction(payload);
    } finally {
      await loadProfile({ silent: true });
      router.refresh();
      setUploadingPhoto(false);
    }
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

  const profileSections = [
    {
      href: `/${locale}/talent-dashboard/profile/advanced#identity`,
      title: isArabic ? "البيانات الأساسية" : "Basic information",
      description: isArabic ? "الاسم، نوع الموهبة، المدينة، الجنسية والبيانات الأساسية." : "Name, talent type, city, nationality and core details.",
      status: readiness.isReady ? (isArabic ? "مكتمل" : "Complete") : (isArabic ? "راجع البيانات" : "Review details"),
    },
    {
      href: `/${locale}/talent-dashboard/profile/details`,
      title: isArabic ? "البيانات المهنية" : "Professional details",
      description: isArabic ? "التوفر، التنقل، المهارات، الخبرة والمظهر والقياسات المناسبة لنوع موهبتك." : "Availability, travel, skills, experience and relevant appearance or measurements.",
      status: isArabic ? "إدارة" : "Manage",
    },
    {
      href: `/${locale}/talent-dashboard/gallery`,
      title: isArabic ? "الصور والأعمال" : "Photos & work",
      description: isArabic ? "صور الأعمال الإضافية التي تساعد الناشرين على تقييم ملفك." : "Additional work photos that help publishers evaluate your profile.",
      status: isArabic ? "إدارة" : "Manage",
    },
    {
      href: `/${locale}/talent-dashboard/gallery/links`,
      title: isArabic ? "الفيديو والروابط المهنية" : "Video & professional links",
      description: isArabic ? "Showreel وروابط الفيديو والبورتفوليو الخارجي وحساباتك المهنية. لا يوجد رفع فيديو مباشر حاليًا." : "Showreel, video links, external portfolio and professional social accounts. Direct video upload is not enabled yet.",
      status: isArabic ? "إدارة" : "Manage",
    },
    {
      href: `/${locale}/talent-dashboard/profile/privacy`,
      title: isArabic ? "الخصوصية وظهور الملف" : "Privacy & profile visibility",
      description: isArabic ? "تحكم في ظهور ملفك العام بشكل مستقل عن حالة الاعتماد." : "Control public profile visibility independently from approval status.",
      status: clean(talent.profile_visibility) || (isArabic ? "راجع الإعداد" : "Review setting"),
    },
  ];

  return (
    <main className="min-h-screen w-full bg-background px-4 pb-28 pt-40 text-white sm:px-6 sm:pt-44 lg:pt-36" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">{isArabic ? "ملفي" : "MY PROFILE"}</p>
          <h1 className="mt-3 text-3xl font-light leading-tight sm:text-5xl">{headerTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">{headerDescription}</p>
        </header>

        <section className="mb-6 overflow-hidden rounded-[2rem] border border-gold/25 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.18),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_300px] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                {[roleLabel, city, gender, country].map((value) => <span key={value} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/65">{value}</span>)}
              </div>
              <h2 className="mt-6 text-2xl font-light sm:text-3xl">
                {isApproved
                  ? (isArabic ? "ملفك معتمد ونشط" : "Your profile is approved and active")
                  : isUnderReview
                    ? (isArabic ? "ملفك قيد المراجعة" : "Your profile is under review")
                    : isChangesRequested
                      ? (isArabic ? "هناك تحديثات مطلوبة قبل إعادة الإرسال" : "Updates are required before resubmission")
                      : isRejected
                        ? (isArabic ? "راجع ملاحظات الملف قبل إعادة الإرسال" : "Review the profile notes before resubmitting")
                        : readiness.isReady
                          ? (isArabic ? "متطلبات المراجعة مكتملة" : "Review requirements complete")
                          : (isArabic ? `باقي ${missingCount === 1 ? "خطوة واحدة" : `${missingCount} خطوات`} قبل الإرسال للمراجعة` : `${missingCount} step${missingCount === 1 ? "" : "s"} left before review`)}
              </h2>

              <div className="mt-5 flex flex-wrap gap-3">
                {!isApproved && !isUnderReview && firstMissing ? (
                  <button onClick={() => goToRequirement(firstMissing.key)} className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-black">{isArabic ? "أكمل الخطوة التالية" : "Complete next step"}</button>
                ) : null}
                {canShowCompletionTasks && readiness.isReady ? (
                  <TalentProfileReviewSubmitButton
                    locale={locale}
                    onSubmitted={loadProfile}
                    label={isChangesRequested || isRejected ? (isArabic ? "إعادة إرسال الملف للمراجعة" : "Resubmit profile for review") : undefined}
                  />
                ) : null}
                {isApproved && publicSlug ? (
                  <Link href={`/${locale}/talent/${publicSlug}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold text-white/70 hover:border-gold/30 hover:text-gold">
                    {isArabic ? "عرض الملف العام" : "View public profile"}
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              {isApproved ? (
                <>
                  <p className="text-xs text-white/40">{isArabic ? "قوة الملف" : "Profile strength"}</p>
                  <div className="mt-2 flex items-end justify-between"><p className="text-4xl font-light">{strength}%</p><p className="text-xs text-emerald-200">{isArabic ? "معتمد" : "Approved"}</p></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${strength}%` }} /></div>
                  <p className="mt-3 text-xs leading-6 text-white/40">{isArabic ? "قوة الملف تعكس اكتمال العناصر الاختيارية ولا تغيّر حالة الاعتماد." : "Profile strength reflects optional enrichment and does not change approval status."}</p>
                </>
              ) : isUnderReview ? (
                <>
                  <p className="text-xs text-white/40">{isArabic ? "حالة المراجعة" : "Review status"}</p>
                  <p className="mt-3 text-2xl font-light text-amber-100">{isArabic ? "قيد المراجعة" : "Under review"}</p>
                  <p className="mt-3 text-xs leading-6 text-white/40">{isArabic ? "لا يلزم أي إجراء الآن." : "No action is needed right now."}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-white/40">{isArabic ? "متطلبات المراجعة" : "Review requirements"}</p>
                  <div className="mt-2 flex items-end justify-between"><p className="text-4xl font-light">{percentage}%</p><p className="text-xs text-white/45">{readiness.completedRequirements}/{readiness.totalRequirements}</p></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${percentage}%` }} /></div>
                  <p className="mt-3 text-xs leading-6 text-white/40">{isArabic ? "هذه المتطلبات فقط تتحكم في إمكانية إرسال الملف للمراجعة." : "Only these requirements control whether the profile can be submitted for review."}</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section ref={photoRef} id="profile-image" className={`mb-6 rounded-[2rem] border p-5 sm:p-7 ${hasProfileImage ? "border-emerald-400/20 bg-emerald-400/[0.025]" : "border-gold/30 bg-gold/[0.035]"}`}>
          <div className="grid gap-6 md:grid-cols-[120px_1fr] md:items-center">
            <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-2 border-gold/35 bg-black/30 md:mx-0">
              {hasProfileImage ? <Image src={clean(talent.image_url)} alt={isArabic ? "الصورة الشخصية" : "Profile photo"} fill unoptimized sizes="112px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-4xl text-gold">{(clean(talent.name_ar) || clean(talent.name_en) || "M").charAt(0)}</div>}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "الصورة الشخصية" : "PROFILE PHOTO"}</p>
              <h2 className="mt-2 text-xl font-light">{hasProfileImage ? (isArabic ? "الصورة الشخصية مضافة" : "Profile photo added") : (isArabic ? "أضف صورة شخصية" : "Add a profile photo")}</h2>
              <p className="mt-2 text-sm leading-7 text-white/50">{isArabic ? "الصورة الشخصية مختلفة عن صور الأعمال الإضافية." : "Your profile photo is separate from additional work photos."}</p>
              {canEditProfile ? (
                <div className="mt-4">
                  <label className={`relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-2xl bg-gold px-6 text-sm font-semibold text-black transition ${uploadingPhoto ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                    <input type="file" name="profile_image" accept="image/jpeg,image/png,image/webp" disabled={uploadingPhoto} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (!file || uploadingPhoto) return; void uploadProfilePhoto(file); }} />
                    <span className="pointer-events-none">{uploadingPhoto ? (isArabic ? "جارٍ الرفع..." : "Uploading...") : hasProfileImage ? (isArabic ? "تغيير الصورة" : "Change photo") : (isArabic ? "اختيار صورة" : "Choose photo")}</span>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "إدارة ملفي" : "MANAGE MY PROFILE"}</p>
              <h2 className="mt-2 text-2xl font-light">{isArabic ? "كل بياناتك من هنا" : "Everything about your profile, here"}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">{isArabic ? "لا تحتاج للبحث بين صفحات مختلفة. اختر القسم الذي تريد تحديثه." : "You do not need to hunt through separate pages. Choose the section you want to update."}</p>
            </div>
            <div className="text-xs text-white/35">{roleLabel} · {city} · {nationality}</div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {profileSections.map((section) => (
              <Link key={section.href} href={section.href} className="group flex min-h-36 flex-col justify-between rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-gold/35 hover:bg-gold/[0.035]">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-medium text-white/85 group-hover:text-gold">{section.title}</h3>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">{section.status}</span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-white/40">{section.description}</p>
                </div>
                <span className="mt-4 text-sm text-gold">{isArabic ? "فتح القسم ←" : "Open section →"}</span>
              </Link>
            ))}
          </div>
        </section>

        {canShowCompletionTasks && !readiness.isReady ? (
          <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "متطلبات المراجعة" : "REVIEW REQUIREMENTS"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "أكمل المطلوب فقط" : "Complete only what is required"}</h2>
            <p className="mt-2 text-sm text-white/45">{isArabic ? "العناصر المهنية الإضافية لا تمنع إرسال الملف للمراجعة." : "Optional professional enrichment does not block review submission."}</p>
            <div className="mt-6 space-y-3">
              {readiness.missingRequirements.map((requirement, index) => (
                <button key={requirement.key} onClick={() => goToRequirement(requirement.key)} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4 text-start hover:border-gold/35">
                  <div className="flex items-center gap-4"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.07] text-sm text-gold">{index + 1}</span><div><p className="text-sm text-white/85">{isArabic ? requirement.ar : requirement.en}</p><p className="mt-1 text-xs text-white/35">{isArabic ? "مطلوب لإرسال الملف للمراجعة" : "Required to submit for review"}</p></div></div><span className="text-gold">{isArabic ? "←" : "→"}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {canShowCompletionTasks && isBirthDateMissing ? (
          <section className="mb-6 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold">{isArabic ? "متطلب ناقص" : "MISSING REQUIREMENT"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "أضف تاريخ ميلادك" : "Add your date of birth"}</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input ref={dateRef} type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setBirthDate(event.target.value)} dir="ltr" className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 text-white outline-none focus:border-gold/50" />
              <button onClick={() => void saveBirthDate()} disabled={!birthDate || savingDate} className="min-h-14 rounded-2xl bg-gold px-7 text-sm font-semibold text-black disabled:opacity-40">{savingDate ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : (isArabic ? "حفظ والمتابعة" : "Save and continue")}</button>
            </div>
            {dateMessage ? <p className="mt-3 text-xs text-white/55">{dateMessage}</p> : null}
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "قوة الملف" : "PROFILE STRENGTH"}</p>
              <h2 className="mt-2 text-xl font-light">{isArabic ? "تحسينات اختيارية" : "Optional improvements"}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">{isArabic ? "هذه العناصر تساعد الجهات على تقييمك وتحسّن جودة المطابقة، لكنها لا تمنع إرسال ملفك للمراجعة." : "These elements help publishers evaluate you and improve matching quality, but they do not block review submission."}</p>
            </div>
            <span className="text-3xl font-light text-gold">{strength}%</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link href={`/${locale}/talent-dashboard/profile/details`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70 hover:border-gold/35 hover:text-gold">{isArabic ? "أضف مهارات وخبرة ومعلومات مهنية ←" : "Add skills, experience and professional details →"}</Link>
            <Link href={`/${locale}/talent-dashboard/gallery`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70 hover:border-gold/35 hover:text-gold">{isArabic ? "أضف صور أعمال قوية ←" : "Add strong work photos →"}</Link>
            <Link href={`/${locale}/talent-dashboard/gallery/links`} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70 hover:border-gold/35 hover:text-gold">{isArabic ? "أضف Showreel وروابطك المهنية ←" : "Add a showreel and professional links →"}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
