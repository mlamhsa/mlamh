"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
  company_size: string | null;
  founded_year: number | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  instagram: string | null;
  tiktok_url: string | null;
  snapchat_url: string | null;
  linkedin_url: string | null;
  profile_image_url: string | null;
  cover_image_url: string | null;
};

type PublisherProfileFormProps = {
  locale: string;
  isRtl: boolean;
  publisher: PublisherData;
};

export default function PublisherProfileForm({
  locale,
  isRtl,
  publisher,
}: PublisherProfileFormProps) {
  const selectedCity = resolveCityValue(publisher.city);

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

      // الصور تبقى للحفظ اليدوي فقط.
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          fileFieldNames.push(key);
        }
      }

      for (const key of fileFieldNames) {
        formData.delete(key);
      }

      await autoSavePublisherProfileAction(formData);

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
          {isRtl
            ? "المعلومات الأساسية"
            : "Basic Information"}
        </p>

        <div className="grid gap-6 md:grid-cols-2">
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

<div>
  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
    {isRtl ? "نوع الجهة" : "Organization Type"}
  </label>

  <div className="w-full border border-white/10 bg-white/[0.02] px-4 py-4 text-white/70">
    {(() => {
      const option = PUBLISHER_TYPE_OPTIONS.find(
        (item) => item.value === publisher.publisher_type
      );

      return option
        ? isRtl
          ? option.ar
          : option.en
        : publisher.publisher_type || (isRtl ? "غير محدد" : "Not specified");
    })()}
  </div>

  <input
    type="hidden"
    name="publisher_type"
    value={publisher.publisher_type ?? ""}
  />
</div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
            {isRtl ? "المدينة" : "City"}
            <span className="ms-1 text-gold">*</span>
            </label>

            <select
              name="city"
              defaultValue={
                selectedCity || publisher.city || ""
              }
              required
              className="w-full border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-gold/50"
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
                <option key={city.slug} value={city.slug}>
                  {isRtl ? city.ar : city.en}
                </option>
              ))}
            </select>
          </div>

          <Field
            label={isRtl ? "حجم الشركة" : "Company Size"}
            name="company_size"
            defaultValue={publisher.company_size ?? ""}
            placeholder={
              isRtl ? "مثال: 1-10" : "Example: 1-10"
            }
            dir="ltr"
          />

          <Field
            label={isRtl ? "سنة التأسيس" : "Founded Year"}
            name="founded_year"
            type="number"
            defaultValue={
              publisher.founded_year?.toString() ?? ""
            }
            placeholder="2020"
            dir="ltr"
          />

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
              required
            />
          </div>
        </div>
      </section>

      <PublisherImageUploadFields
        isRtl={isRtl}
        currentProfileImageUrl={
          publisher.profile_image_url
        }
        currentCoverImageUrl={publisher.cover_image_url}
      />

<section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
  <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
    {isRtl
      ? "معلومات التواصل"
      : "Contact Information"}
  </p>

  <div className="grid gap-6 md:grid-cols-2">
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
      placeholder="example@company.com"
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

    <Field
      label={isRtl ? "العنوان" : "Address"}
      name="address"
      defaultValue={publisher.address ?? ""}
      dir={isRtl ? "rtl" : "ltr"}
      placeholder={
        isRtl
          ? "مثال: الرياض، حي العليا"
          : "Example: Riyadh, Olaya District"
      }
    />
  </div>
</section>

<section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
  <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
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
      label="Snapchat"
      name="snapchat_url"
      defaultValue={publisher.snapchat_url ?? ""}
      type="url"
      dir="ltr"
      placeholder="https://snapchat.com/add/username"
    />

    <Field
      label="LinkedIn"
      name="linkedin_url"
      defaultValue={publisher.linkedin_url ?? ""}
      type="url"
      dir="ltr"
      placeholder="https://linkedin.com/company/company-name"
    />
  </div>
</section>

      <p className="text-center text-xs text-white/45">
  {isRtl
    ? "يتم حفظ البيانات تلقائيًا أثناء الكتابة، أما الصور فتُحفظ عند الضغط على «حفظ الآن»."
    : "Changes are saved automatically while editing. Images are uploaded when you click “Save Now”."}
</p>
<div className="grid gap-3 sm:grid-cols-2">
  <button
    type="submit"
    className="border border-white/15 px-6 py-4 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/50 hover:text-gold"
  >
    {isRtl
      ? "حفظ الآن"
      : "Save Now"}
  </button>

  <button
    type="submit"
    formAction={submitPublisherProfileForReviewAction}
    className="border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.25em] text-gold transition hover:bg-gold hover:text-black"
  >
    {isRtl
      ? "إرسال الملف للمراجعة"
      : "Submit Profile for Review"}
  </button>

  <Link
    href={`/${locale}/publisher-dashboard`}
    className="sm:col-span-2 inline-flex items-center justify-center px-6 py-3 text-xs text-white/40 transition hover:text-gold"
  >
    {isRtl
      ? "العودة إلى لوحة الناشر"
      : "Back to Publisher Dashboard"}
  </Link>
</div>
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
      <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
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
        className="w-full border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
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
      <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/40">
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
        className="min-h-36 w-full border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-gold/50"
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