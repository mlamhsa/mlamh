"use client";

import Link from "next/link";
import {
  useActionState,
  useState,
  startTransition,
} from "react";
import type { ReactNode } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { submitTalentAction as rawSubmitTalentAction } from "@/lib/actions/submit-talent";
import {
  initialSubmitTalentState,
  type SubmitTalentState,
} from "@/lib/actions/submit-talent-state";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { TalentSubmissionErrors } from "@/lib/validations/talent-submission";

const BUCKET_NAME = "talent-images";
const MAX_GALLERY_IMAGES = 1;
const MAX_IMAGE_SIZE_MB = 15;

function getExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";

  return null;
}

async function uploadPublicSubmissionImage(file: File) {
  const extension = getExtension(file.type);

  if (!extension) {
    throw new Error("Only JPG, PNG, WEBP, and AVIF images are allowed.");
  }

  const supabase = createBrowserSupabaseClient();

  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = `submissions/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return publicUrl;
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[9px] uppercase tracking-[0.35em] text-gray-muted"
    >
      {children}
      {required ? <span className="text-gold"> *</span> : null}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="mt-1.5 text-xs text-red-400/90">{message}</p>;
}

function FormInput({
  id,
  name,
  type = "text",
  placeholder,
  required,
  error,
  dir,
  min,
  max,
}: {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  dir?: "ltr" | "rtl";
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        dir={dir}
        min={min}
        max={max}
        className={`w-full border bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-300 focus:border-gold/50 ${
          error ? "border-red-400/50" : "border-white/10"
        }`}
      />

      <FieldError message={error} />
    </div>
  );
}

function FormTextarea({
  id,
  name,
  placeholder,
  error,
  dir,
  rows = 4,
}: {
  id: string;
  name: string;
  placeholder?: string;
  error?: string;
  dir?: "ltr" | "rtl";
  rows?: number;
}) {
  return (
    <div>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        dir={dir}
        className={`w-full resize-y border bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-colors duration-300 focus:border-gold/50 ${
          error ? "border-red-400/50" : "border-white/10"
        }`}
      />

      <FieldError message={error} />
    </div>
  );
}

function SectionTitle({
  title,
  isRtl,
}: {
  title: string;
  isRtl: boolean;
}) {
  return (
    <div
      className={`mb-8 flex items-center gap-4 ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      <h2 className="text-[10px] uppercase tracking-[0.4em] text-gold">
        {title}
      </h2>

      <span className="gold-line flex-1" />
    </div>
  );
}

function JoinSuccess({
  dict,
  locale,
  isRtl,
  displayFont,
  bodyFont,
  onReset,
}: {
  dict: Dictionary;
  locale: Locale;
  isRtl: boolean;
  displayFont: string;
  bodyFont: string;
  onReset: () => void;
}) {
  const j = dict.join;

  return (
    <div
      className={`opacity-0-start animate-fade-up border border-gold/25 bg-gold/[0.04] px-8 py-14 text-center md:px-12 md:py-16 ${
        isRtl ? "text-right" : "text-left"
      }`}
    >
      <div className="gold-line mx-auto mb-8 max-w-xs" />

      <h2
        className="mb-4 text-3xl font-light text-white md:text-4xl"
        style={{ fontFamily: displayFont }}
      >
        {j.successTitle}
      </h2>

      <p
        className="mx-auto max-w-lg text-sm leading-relaxed text-white/65 md:text-base"
        style={{ fontFamily: bodyFont }}
      >
        {j.successMessage}
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center border border-white/15 px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
        >
          {locale === "ar"
            ? "إرسال طلب جديد"
            : "Submit another application"}
        </button>

        <Link
          href={`/${locale}`}
          className={`btn-luxury inline-flex items-center gap-2 border border-gold/40 px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold/10 ${
            isRtl ? "flex-row-reverse" : ""
          }`}
        >
          {j.backHome}
        </Link>
      </div>
    </div>
  );
}

export function JoinTalentForm(props: {
  dict: Dictionary;
  locale: Locale;
}) {
  const [formKey, setFormKey] = useState(0);

  return (
    <JoinTalentFormInner
      key={formKey}
      {...props}
      onReset={() => setFormKey((key) => key + 1)}
    />
  );
}

function JoinTalentFormInner({
  dict,
  locale,
  onReset,
}: {
  dict: Dictionary;
  locale: Locale;
  onReset: () => void;
}) {
  const j = dict.join;
  const isRtl = locale === "ar";

  const [clientError, setClientError] =
    useState<string | null>(null);

  const [isUploadingImages, setIsUploadingImages] =
    useState(false);

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  const submitTalentAction = rawSubmitTalentAction as (
    state: SubmitTalentState,
    formData: FormData
  ) => Promise<SubmitTalentState>;

  const [state, formAction, isPending] = useActionState(
    submitTalentAction,
    initialSubmitTalentState
  );

  const errors = (state?.errors ?? {}) as TalentSubmissionErrors;

  async function handleFormAction(formData: FormData) {
    setClientError(null);

    const allFiles = [
      formData.get("image"),
      ...formData.getAll("gallery"),
    ].filter(
      (file): file is File => file instanceof File && file.size > 0
    );

    const oversizedFile = allFiles.find(
      (file) => file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024
    );

    if (oversizedFile) {
      setClientError(
        locale === "ar"
          ? `حجم الصورة كبير جدًا. الحد الأقصى ${MAX_IMAGE_SIZE_MB}MB`
          : `Image too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB`
      );

      return;
    }

    setIsUploadingImages(true);

    try {
      const imageFile = formData.get("image");

      if (imageFile instanceof File && imageFile.size > 0) {
        const imageUrl = await uploadPublicSubmissionImage(imageFile);
        formData.set("image_url", imageUrl);
      }

      const galleryFiles = formData
        .getAll("gallery")
        .filter(
          (file): file is File =>
            file instanceof File && file.size > 0
        )
        .slice(0, MAX_GALLERY_IMAGES);

      formData.delete("gallery_images");

      for (const file of galleryFiles) {
        const imageUrl = await uploadPublicSubmissionImage(file);
        formData.append("gallery_images", imageUrl);
      }

      formData.delete("image");
      formData.delete("gallery");

      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setClientError(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "تعذر رفع الصور. جرّب صورًا أخرى أو حجمًا أصغر."
            : "Unable to upload images. Try different or smaller images."
      );
    } finally {
      setIsUploadingImages(false);
    }
  }

  if (state?.success) {
    return (
      <JoinSuccess
        dict={dict}
        locale={locale}
        isRtl={isRtl}
        displayFont={displayFont}
        bodyFont={bodyFont}
        onReset={onReset}
      />
    );
  }

  return (
    <form
      action={handleFormAction}
      noValidate
      className={isRtl ? "text-right" : "text-left"}
    >
      <input type="hidden" name="locale" value={locale} />

      {clientError ? (
        <p
          className="mb-8 border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {clientError}
        </p>
      ) : null}

      {state?.message && !state?.success ? (
        <p
          className="mb-8 border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      {Object.keys(errors ?? {}).length > 0 ? (
        <p
          className="mb-8 border border-gold/30 bg-gold/[0.04] px-4 py-3 text-sm text-gold"
          role="alert"
        >
          {j.errorBanner}
        </p>
      ) : null}

      <p className="mb-10 text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        <span className="text-gold">*</span> {j.requiredHint}
      </p>

      <SectionTitle title={j.sectionIdentity} isRtl={isRtl} />

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="name_en" required>
            {j.nameEn}
          </FieldLabel>

          <FormInput
            id="name_en"
            name="name_en"
            placeholder={j.placeholderNameEn}
            required
            error={errors.name_en}
            dir="ltr"
          />
        </div>

        <div>
          <FieldLabel htmlFor="name_ar" required>
            {j.nameAr}
          </FieldLabel>

          <FormInput
            id="name_ar"
            name="name_ar"
            placeholder={j.placeholderNameAr}
            required
            error={errors.name_ar}
            dir="rtl"
          />
        </div>

        <div>
          <FieldLabel htmlFor="category_en" required>
            {j.categoryEn}
          </FieldLabel>

          <FormInput
            id="category_en"
            name="category_en"
            placeholder={j.placeholderCategoryEn}
            required
            error={errors.category_en}
            dir="ltr"
          />
        </div>

        <div>
          <FieldLabel htmlFor="category_ar" required>
            {j.categoryAr}
          </FieldLabel>

          <FormInput
            id="category_ar"
            name="category_ar"
            placeholder={j.placeholderCategoryAr}
            required
            error={errors.category_ar}
            dir="rtl"
          />
        </div>
      </div>

      <SectionTitle title={j.sectionDetails} isRtl={isRtl} />

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="city_en">{j.cityEn}</FieldLabel>

          <FormInput
            id="city_en"
            name="city_en"
            placeholder={j.placeholderCityEn}
            error={errors.city_en}
            dir="ltr"
          />
        </div>

        <div>
          <FieldLabel htmlFor="city_ar">{j.cityAr}</FieldLabel>

          <FormInput
            id="city_ar"
            name="city_ar"
            placeholder={j.placeholderCityAr}
            error={errors.city_ar}
            dir="rtl"
          />
        </div>

        <div>
          <FieldLabel htmlFor="age">{j.age}</FieldLabel>

          <FormInput
            id="age"
            name="age"
            type="number"
            min={1}
            max={120}
            placeholder="25"
            error={errors.age}
            dir="ltr"
          />
        </div>

        <div>
          <FieldLabel htmlFor="height">{j.height}</FieldLabel>

          <FormInput
            id="height"
            name="height"
            placeholder={j.placeholderHeight}
            error={errors.height}
            dir="ltr"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel htmlFor="bio_en">{j.bioEn}</FieldLabel>

          <FormTextarea
            id="bio_en"
            name="bio_en"
            placeholder={j.placeholderBioEn}
            error={errors.bio_en}
            dir="ltr"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel htmlFor="bio_ar">{j.bioAr}</FieldLabel>

          <FormTextarea
            id="bio_ar"
            name="bio_ar"
            placeholder={j.placeholderBioAr}
            error={errors.bio_ar}
            dir="rtl"
          />
        </div>
      </div>

      <SectionTitle title={j.sectionContact} isRtl={isRtl} />

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="whatsapp" required>
            {j.whatsapp}
          </FieldLabel>

          <FormInput
            id="whatsapp"
            name="whatsapp"
            type="tel"
            placeholder={j.placeholderWhatsapp}
            required
            error={errors.whatsapp}
            dir="ltr"
          />
        </div>

        <div>
          <FieldLabel htmlFor="instagram">{j.instagram}</FieldLabel>

          <FormInput
            id="instagram"
            name="instagram"
            type="url"
            placeholder={j.placeholderInstagram}
            error={errors.instagram}
            dir="ltr"
          />
        </div>
      </div>

      <div className="mb-8">
        <FieldLabel htmlFor="image">Profile Image</FieldLabel>

        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold"
        />
      </div>

      <div className="mb-10">
        <FieldLabel htmlFor="gallery">Gallery Image</FieldLabel>

        <input
          id="gallery"
          name="gallery"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="w-full border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold"
        />

        <p className="mt-2 text-xs text-gray-muted">
          {locale === "ar"
            ? "يمكن رفع صورة واحدة للمعرض حاليًا."
            : "You can upload one gallery image for now."}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || isUploadingImages}
        className={`btn-luxury w-full border border-gold/40 bg-gold/[0.06] px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition-all duration-300 hover:border-gold hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
          isRtl ? "mr-0 ml-auto block" : ""
        }`}
      >
        {isUploadingImages
          ? locale === "ar"
            ? "جاري رفع الصور..."
            : "Uploading images..."
          : isPending
            ? j.submitting
            : j.submit}
      </button>
    </form>
  );
}