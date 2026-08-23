"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  autoSavePublisherProfileAction,
  submitPublisherProfileForReviewAction,
  updatePublisherProfileAction,
} from "@/lib/actions/update-publisher-profile";
import PublisherImageUploadFields from "@/components/publisher/PublisherImageUploadFields";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

const PUBLISHER_TYPE_OPTIONS = [
  {
    value: "production_company",
    ar: "شركة إنتاج",
    en: "Production Company",
  },
  {
    value: "advertising_agency",
    ar: "وكالة إعلانية",
    en: "Advertising Agency",
  },
  {
    value: "casting_agency",
    ar: "وكالة كاستينغ",
    en: "Casting Agency",
  },
  {
    value: "talent_agency",
    ar: "وكالة مواهب",
    en: "Talent Agency",
  },
  {
    value: "brand",
    ar: "علامة تجارية",
    en: "Brand",
  },
  {
    value: "content_company",
    ar: "شركة محتوى",
    en: "Content Company",
  },
  {
    value: "individual",
    ar: "فرد / مستقل",
    en: "Individual / Freelancer",
  },
  {
    value: "other",
    ar: "أخرى",
    en: "Other",
  },
] as const;

type PublisherData = {
  company_name: string | null;
  contact_name: string | null;
  publisher_type: string | null;
  city: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
  verified: boolean | null;
status: string | null;
verification_status: string | null;
verification_method: string | null;
verification_email: string | null;
verification_document_url: string | null;
verification_submitted_at: string | null;
verification_reviewed_at: string | null;
};

type PublisherProfileFormProps = {
  locale: string;
  isRtl: boolean;
  approvalStatus: string;
  publisher: PublisherData;
};

export default function PublisherProfileForm({
  locale,
  isRtl,
  approvalStatus,
  publisher,
}: PublisherProfileFormProps) {
  const router = useRouter();

  const isIndividual =
    publisher.publisher_type === "individual";

    const isProfilePending =
  approvalStatus === "pending" ||
  approvalStatus === "submitted";

const isProfileApproved =
  approvalStatus === "approved";

const isProfileRejected =
  approvalStatus === "rejected" ||
  approvalStatus === "changes_requested";

  const selectedCity = resolveCityValue(publisher.city);

  const verificationRequirements = isIndividual
  ? []
  : [
      {
        key: "company_name",
        complete: Boolean(
          publisher.company_name?.trim(),
        ),
        label: isRtl
          ? "اسم الجهة"
          : "Organization name",
      },
      {
        key: "contact_name",
        complete: Boolean(
          publisher.contact_name?.trim(),
        ),
        label: isRtl
          ? "اسم مسؤول الحساب"
          : "Account manager name",
      },
      {
        key: "publisher_type",
        complete: Boolean(
          publisher.publisher_type?.trim(),
        ),
        label: isRtl
          ? "نوع الجهة"
          : "Organization type",
      },
      {
        key: "city",
        complete: Boolean(
          publisher.city?.trim(),
        ),
        label: isRtl
          ? "المدينة"
          : "City",
      },
      {
        key: "profile_image_url",
        complete: Boolean(
          publisher.profile_image_url?.trim(),
        ),
        label: isRtl
          ? "شعار الجهة"
          : "Organization logo",
      },
    ];

const completedVerificationRequirements =
  verificationRequirements.filter(
    (item) => item.complete,
  ).length;

const isVerificationReady =
  !isIndividual &&
  verificationRequirements.length > 0 &&
  completedVerificationRequirements ===
    verificationRequirements.length;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function saveNow() {
    const form = formRef.current;

    if (!form || isSaving) {
      return;
    }

    setIsSaving(true);
    setIsSaved(false);

    try {
      const formData = new FormData(form);
      const fileFieldNames: string[] = [];

      // نستبعد ملفات الصور من الحفظ التلقائي للنصوص؛
 // رفع الصور يتم تلقائيًا من مكوّن الصور نفسه.
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          fileFieldNames.push(key);
        }
      }

      for (const key of fileFieldNames) {
        formData.delete(key);
      }

      await autoSavePublisherProfileAction(formData);

router.refresh();

setIsSaved(true);

if (savedTimerRef.current) {
  clearTimeout(savedTimerRef.current);
}

savedTimerRef.current = setTimeout(() => {
  setIsSaved(false);
}, 3000);
      
    } catch (error) {
      console.error(
        "Publisher profile auto-save failed:",
        error,
      );

      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  }

  function scheduleSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setIsSaved(false);

    saveTimerRef.current = setTimeout(() => {
      void saveNow();
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
  
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  return (
    <form
      ref={formRef}
      action={updatePublisherProfileAction}
      onChange={scheduleSave}
      className="grid gap-8"
    >
      <input type="hidden" name="locale" value={locale} />

      <div
  aria-live="polite"
  className={`fixed bottom-[calc(env(safe-area-inset-bottom)+6rem)] left-1/2 z-[9500] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm shadow-xl transition-all duration-300 ${
    isSaving
      ? "border-amber-500/40 bg-amber-500/95 text-white"
      : isSaved
        ? "border-emerald-500/40 bg-emerald-600 text-white"
        : "pointer-events-none opacity-0"
  }`}
>
  {isSaving
    ? (isRtl
        ? "⏳ جارٍ حفظ التغييرات..."
        : "⏳ Saving changes...")
    : (isRtl
        ? "✅ تم حفظ جميع التغييرات تلقائيًا."
        : "✅ All changes saved automatically.")}
</div>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
        <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
        {isIndividual
  ? isRtl
    ? "المعلومات الأساسية"
    : "Basic Information"
  : isRtl
    ? "هوية الجهة"
    : "Organization Identity"}
        </p>

        {isIndividual ? (
  <>
    <Field
      label={
        isRtl
          ? "الاسم المهني"
          : "Professional Name"
      }
      name="contact_name"
      defaultValue={publisher.contact_name ?? ""}
      dir={isRtl ? "rtl" : "ltr"}
      placeholder={
        isRtl
          ? "مثال: أسامة عياش"
          : "e.g. Osama Ayyash"
      }
      required
    />

    <div>
    <label className="mb-2.5 block text-sm font-medium text-white/65">
        {isRtl ? "نوع الحساب" : "Account Type"}
      </label>

      <div className="inline-flex min-h-12 items-center rounded-full border border-gold/20 bg-gold/[0.06] px-5 text-sm text-gold">
        {isRtl
          ? "فرد / مستقل"
          : "Individual / Freelancer"}
      </div>

      <input
        type="hidden"
        name="publisher_type"
        value="individual"
      />
    </div>

    <div className="max-w-md">
  <label className="mb-2.5 block text-sm font-medium text-white/65">
    {isRtl ? "المدينة" : "City"}
    <span className="ms-1 text-gold">*</span>
  </label>

  <select
    name="city"
    defaultValue={
      selectedCity || publisher.city || ""
    }
    required
    className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm text-white outline-none transition duration-200 hover:border-white/15 focus:border-gold/45 focus:bg-white/[0.05] focus:ring-4 focus:ring-gold/[0.06]"
  >
        <option value="" disabled>
          {isRtl ? "اختر المدينة" : "Select city"}
        </option>

        {publisher.city && !selectedCity ? (
          <option value={publisher.city}>
            {publisher.city}
          </option>
        ) : null}

        {SAUDI_CITIES.map((city) => (
          <option
            key={city.slug}
            value={city.slug}
          >
            {isRtl ? city.ar : city.en}
          </option>
        ))}
      </select>
    </div>

    <div className="md:col-span-2">
      <Textarea
        label={
          isRtl
            ? "نبذة عنك"
            : "About You"
        }
        name="description"
        defaultValue={publisher.description ?? ""}
        dir={isRtl ? "rtl" : "ltr"}
        placeholder={
          isRtl
            ? "اكتب نبذة مختصرة عنك وطبيعة الفرص أو المشاريع التي تنشرها."
            : "Write a short introduction about yourself and the type of opportunities or projects you publish."
        }
        required
      />
    </div>
  </>
) : (
  <>
  <div className="grid gap-x-6 gap-y-7 md:grid-cols-2">
    <Field
      label={isRtl ? "اسم الجهة" : "Organization Name"}
      name="company_name"
      defaultValue={publisher.company_name ?? ""}
      dir={isRtl ? "rtl" : "ltr"}
      placeholder={
        isRtl
          ? "مثال: وكالة ملامح للمواهب"
          : "e.g. MLAMH Talent Agency"
      }
      required
    />

<div className="flex flex-col">
  <label className="mb-2.5 block text-sm font-medium text-white/65">
    {isRtl ? "نوع الجهة" : "Organization Type"}
  </label>

  <div className="inline-flex h-12 w-fit items-center rounded-full border border-gold/20 bg-gold/[0.06] px-5 text-sm text-gold">
        {(() => {
          const option = PUBLISHER_TYPE_OPTIONS.find(
            (item) =>
              item.value === publisher.publisher_type,
          );

          return option
            ? isRtl
              ? option.ar
              : option.en
            : publisher.publisher_type ||
                (isRtl
                  ? "غير محدد"
                  : "Not specified");
        })()}
      </div>

      <input
        type="hidden"
        name="publisher_type"
        value={publisher.publisher_type ?? ""}
      />
    </div>

    <div className="max-w-md">
  <label className="mb-2.5 block text-sm font-medium text-white/65">
        {isRtl ? "المدينة" : "City"}
        <span className="ms-1 text-gold">*</span>
      </label>

      <select
        name="city"
        defaultValue={
          selectedCity || publisher.city || ""
        }
        required
        className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm text-white outline-none transition duration-200 hover:border-white/15 focus:border-gold/45 focus:bg-white/[0.05] focus:ring-4 focus:ring-gold/[0.06]"
      >
        <option value="" disabled>
          {isRtl ? "اختر المدينة" : "Select city"}
        </option>

        {publisher.city && !selectedCity ? (
          <option value={publisher.city}>
            {publisher.city}
          </option>
        ) : null}

        {SAUDI_CITIES.map((city) => (
          <option
            key={city.slug}
            value={city.slug}
          >
            {isRtl ? city.ar : city.en}
          </option>
        ))}
      </select>
    </div>

    <div className="md:col-span-2">
      <Textarea
        label={
          isRtl
            ? "نبذة عن الجهة"
            : "Company Description"
        }
        name="description"
        defaultValue={publisher.description ?? ""}
        dir={isRtl ? "rtl" : "ltr"}
        placeholder={
          isRtl
            ? "اكتب وصفًا مختصرًا عن الجهة ونوع الأعمال التي تنشرها."
            : "Write a short description about your company and the kind of opportunities you publish."
        }
      />
    </div>
    </div>
  </>
)}
      </section>

      <PublisherImageUploadFields
  isRtl={isRtl}
  currentProfileImageUrl={
    publisher.profile_image_url
  }
  currentCoverImageUrl={
    publisher.cover_image_url
  }
/>

{!isIndividual ? (
  <section className="rounded-[2rem] border border-white/[0.07] bg-white/[0.018] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] md:p-8">
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr_auto] lg:items-center">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {isRtl ? "جاهزية الحساب" : "Account Readiness"}
        </p>

        <h2 className="mt-3 text-2xl font-light text-white">
  {isProfileApproved
    ? isRtl
      ? "حساب الجهة معتمد ✓"
      : "Organization Account Approved ✓"
    : isProfilePending
      ? isRtl
        ? "ملف الجهة قيد المراجعة"
        : "Organization Profile Under Review"
      : isProfileRejected
        ? isRtl
          ? "يحتاج الملف إلى تحديث"
          : "Profile Needs Updates"
        : isVerificationReady
          ? isRtl
            ? "ملف الجهة جاهز للمراجعة"
            : "Organization Profile Is Ready"
          : isRtl
            ? "أكمل ملف الجهة"
            : "Complete Your Organization Profile"}
</h2>

<p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
  {isProfileApproved
    ? isRtl
      ? "تمت مراجعة بيانات حساب الجهة واعتمادها. يمكنك الآن استخدام صلاحيات الناشر المتاحة."
      : "Your organization account has been reviewed and approved. You can now use the available publisher features."
    : isProfilePending
      ? isRtl
        ? "استلم فريق ملامح ملف الجهة ويقوم بمراجعته الآن. سنبلغك عند صدور القرار."
        : "The MLAMH team has received your organization profile and is reviewing it. We will notify you when a decision is made."
      : isProfileRejected
        ? isRtl
          ? "راجع الملاحظات وحدّث البيانات المطلوبة، ثم أعد إرسال الملف للمراجعة."
          : "Review the feedback, update the required information, then resubmit your profile."
        : isVerificationReady
          ? isRtl
            ? "اكتملت المعلومات الأساسية. أرسل الملف إلى فريق ملامح لمراجعة الحساب قبل استخدام صلاحيات الناشر بالكامل."
            : "The required information is complete. Submit the profile to MLAMH for account review before full publisher access."
          : isRtl
            ? "أكمل المعلومات الأساسية أدناه حتى يصبح حساب الجهة جاهزًا للمراجعة."
            : "Complete the required information below so your organization account is ready for review."}
</p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-white/45">
            {isRtl ? "اكتمال الملف" : "Profile Completion"}
          </p>

          <span className="text-xs text-gold">
            {completedVerificationRequirements}/
            {verificationRequirements.length}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {verificationRequirements.map((requirement) => (
            <div
              key={requirement.key}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className={
                  requirement.complete
                    ? "text-emerald-300"
                    : "text-white/25"
                }
              >
                {requirement.complete ? "✓" : "○"}
              </span>

              <span
                className={
                  requirement.complete
                    ? "text-white/60"
                    : "text-white/35"
                }
              >
                {requirement.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0">
  {isProfileApproved ? (
    <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 text-sm text-emerald-300">
      {isRtl ? "معتمد ✓" : "Approved ✓"}
    </span>
  ) : isProfilePending ? (
    <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 px-5 text-sm text-amber-200">
      {isRtl ? "قيد المراجعة" : "Under Review"}
    </span>
  ) : isVerificationReady ? (
    <button
      type="submit"
      formAction={submitPublisherProfileForReviewAction}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft"
    >
      {isProfileRejected
        ? isRtl
          ? "إعادة الإرسال للمراجعة"
          : "Resubmit for Review"
        : isRtl
          ? "إرسال للمراجعة"
          : "Submit for Review"}
    </button>
  ) : (
    <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm text-white/35">
      {isRtl
        ? "أكمل البيانات أولًا"
        : "Complete Required Fields"}
    </span>
  )}
</div>
    </div>
  </section>
) : null}

{!isIndividual ? (
  <section className="rounded-[2rem] border border-gold/15 bg-gold/[0.025] p-6 md:p-8">
    <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-gold">
            {isRtl
              ? "توثيق الجهة"
              : "Organization Verification"}
          </p>

          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] text-white/40">
            {isRtl ? "خطوة إضافية" : "Additional Step"}
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-light text-white">
          {publisher.verification_status === "verified"
            ? isRtl
              ? "جهتك موثقة ✓"
              : "Your Organization Is Verified ✓"
            : publisher.verification_status === "pending"
              ? isRtl
                ? "طلب التوثيق قيد المراجعة"
                : "Verification Is Under Review"
              : publisher.verification_status === "rejected"
                ? isRtl
                  ? "تعذر اعتماد طلب التوثيق"
                  : "Verification Request Was Rejected"
                : isRtl
                  ? "احصل على شارة الجهة الموثقة"
                  : "Get the Verified Organization Badge"}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
          {publisher.verification_status === "verified"
            ? isRtl
              ? "تم التحقق من أنك مخول بتمثيل هذه الجهة، وستظهر شارة التوثيق في حسابك."
              : "We verified that you are authorized to represent this organization, and the verified badge will appear on your account."
            : publisher.verification_status === "pending"
              ? isRtl
                ? "استلمنا إثبات ارتباطك بالجهة، ويقوم فريق ملامح بمراجعته الآن."
                : "We received your organization proof and the MLAMH team is reviewing it."
              : publisher.verification_status === "rejected"
                ? isRtl
                  ? "يمكنك مراجعة سبب الرفض وتقديم إثبات جديد."
                  : "You can review the rejection reason and submit new proof."
                : isRtl
                  ? "التوثيق مختلف عن مراجعة الحساب: هنا تثبت أنك مخول بتمثيل الجهة للحصول على شارة التوثيق وزيادة الثقة لدى المواهب."
                  : "Verification is different from account review: here you prove that you are authorized to represent the organization to receive a verified badge and build trust with talent."}
        </p>
      </div>

      <div className="shrink-0">
        {publisher.verification_status === "verified" ? (
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 text-sm text-emerald-300">
            {isRtl ? "موثقة ✓" : "Verified ✓"}
          </span>
        ) : publisher.verification_status === "pending" ? (
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 px-5 text-sm text-amber-200">
            {isRtl ? "قيد المراجعة" : "Under Review"}
          </span>
        ) : isProfileApproved ? (
          <Link
            href={`/${locale}/publisher-dashboard/verification`}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            {publisher.verification_status === "rejected"
              ? isRtl
                ? "إعادة طلب التوثيق"
                : "Resubmit Verification"
              : isRtl
                ? "ابدأ التوثيق"
                : "Start Verification"}
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm text-white/35">
            {isRtl
  ? "متاح بعد اعتماد الحساب"
  : "Available After Account Approval"}
          </span>
        )}
      </div>
    </div>
  </section>
) : null}

<section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
  <p className="mb-6 text-sm font-medium text-gold">
    {isRtl
      ? "معلومات التواصل"
      : "Contact Information"}
  </p>

  <div className="grid gap-6 md:grid-cols-2">
  {!isIndividual ? (
  <Field
    label={isRtl ? "اسم مسؤول الحساب" : "Account Manager Name"}
    name="contact_name"
    defaultValue={publisher.contact_name ?? ""}
    dir={isRtl ? "rtl" : "ltr"}
    placeholder={
      isRtl
        ? "اسم الشخص المسؤول عن إدارة الحساب"
        : "Person responsible for managing this account"
    }
    required
  />
) : null}

    <Field
      label={isRtl ? "رقم التواصل" : "Phone"}
      name="phone"
      defaultValue={publisher.phone ?? ""}
      type="tel"
      dir="ltr"
      placeholder={
        isRtl
          ? "مثال: 0551234567"
          : "Example: +966551234567"
      }
    />

    <Field
      label={
        isRtl ? "البريد الإلكتروني" : "Email"
      }
      name="email"
      defaultValue={publisher.email ?? ""}
      type="email"
      dir="ltr"
      placeholder={
        isIndividual
          ? "name@example.com"
          : "example@company.com"
      }
    />

    <Field
      label={
        isRtl ? "الموقع الإلكتروني" : "Website"
      }
      name="website"
      defaultValue={publisher.website ?? ""}
      type="url"
      dir="ltr"
      placeholder="https://example.com"
    />

  </div>
</section>

<section className="rounded-[2rem] border border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.015] to-transparent p-6 md:p-8">
<p className="mb-8 text-sm font-medium text-gold">
    {isRtl ? "روابط التواصل" : "Social Links"}
  </p>

  <div className="grid gap-6 md:grid-cols-2">
    <Field
      label="Instagram"
      name="instagram"
      defaultValue={publisher.instagram ?? ""}
      type="url"
      dir="ltr"
      placeholder="https://instagram.com/username"
    />

    <Field
      label="TikTok"
      name="tiktok_url"
      defaultValue={publisher.tiktok_url ?? ""}
      type="url"
      dir="ltr"
      placeholder="https://tiktok.com/@username"
    />

    <Field
      label="LinkedIn"
      name="linkedin_url"
      defaultValue={publisher.linkedin_url ?? ""}
      type="url"
      dir="ltr"
      placeholder={
        isIndividual
          ? "https://linkedin.com/in/username"
          : "https://linkedin.com/company/company-name"
      }
    />
  </div>
</section>

      <p className="text-center text-xs text-white/45">
      {isRtl
  ? "يتم حفظ التغييرات تلقائيًا، بما في ذلك الشعار وصورة الغلاف."
  : "Changes are saved automatically, including the logo and cover image."}
</p>
{isIndividual ? (
  <div className="mt-3">
    <button
      type="submit"
      formAction={submitPublisherProfileForReviewAction}
      className="min-h-12 w-full rounded-full bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft"
    >
      {isRtl
        ? "إرسال الملف للمراجعة"
        : "Submit Profile for Review"}
    </button>
  </div>
) : null}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  dir,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-white/65">
  {label}
  {required ? (
    <span className="ms-1 text-gold">*</span>
  ) : null}
</label>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        dir={dir}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm text-white outline-none transition duration-200 placeholder:text-white/25 hover:border-white/15 focus:border-gold/45 focus:bg-white/[0.05] focus:ring-4 focus:ring-gold/[0.06]"
      />
    </div>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  dir,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-sm font-medium text-white/65">
  {label}
  {required ? (
    <span className="ms-1 text-gold">*</span>
  ) : null}
</label>

<textarea
  name={name}
  defaultValue={defaultValue}
  dir={dir}
  placeholder={placeholder}
  required={required}
  className="min-h-28 w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-4 text-[15px] leading-7 text-white outline-none transition duration-200 placeholder:text-white/25 hover:border-white/15 focus:border-gold/45 focus:bg-white/[0.05] focus:ring-4 focus:ring-gold/[0.06]"
/>
    </div>
  );
}

function resolveCityValue(
  value: string | null | undefined,
) {
  const normalizedValue = value
    ?.trim()
    .toLocaleLowerCase();

  if (!normalizedValue) {
    return "";
  }

  const city = SAUDI_CITIES.find(
    (item) =>
      item.slug.toLocaleLowerCase() === normalizedValue ||
      item.ar.toLocaleLowerCase() === normalizedValue ||
      item.en.toLocaleLowerCase() === normalizedValue,
  );

  return city?.slug ?? "";
}