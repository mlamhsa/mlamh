"use client";

import Link from "next/link";
import {
  useActionState,
  useState,
  startTransition,
} from "react";

import type { ReactNode } from "react";

import { submitTalentAction } from "@/lib/actions/submit-talent";
import { initialSubmitTalentState } from "@/lib/actions/submit-talent-state";

import type { Dictionary, Locale } from "@/lib/i18n";

import type { TalentSubmissionErrors } from "@/lib/validations/talent-submission";

const MAX_GALLERY_IMAGES = 8;

async function compressImageFile(
  file: File,
  options: {
    maxWidth: number;
    quality: number;
  },
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = reject;

        img.src = imageUrl;
      },
    );

    const scale = Math.min(
      1,
      options.maxWidth / image.width,
    );

    const width = Math.round(image.width * scale);

    const height = Math.round(
      image.height * scale,
    );

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return file;
    }

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/webp",
          options.quality,
        );
      },
    );

    if (!blob) {
      return file;
    }

    const originalName = file.name.replace(
      /\.[^/.]+$/,
      "",
    );

    return new File(
      [blob],
      `${originalName}.webp`,
      {
        type: "image/webp",
        lastModified: Date.now(),
      },
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
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

      {required ? (
        <span className="text-gold"> *</span>
      ) : null}
    </label>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <p className="mt-1.5 text-xs text-red-400/90">
      {message}
    </p>
  );
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
          error
            ? "border-red-400/50"
            : "border-white/10"
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
          error
            ? "border-red-400/50"
            : "border-white/10"
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
}: {
  dict: Dictionary;
  locale: Locale;
  isRtl: boolean;
  displayFont: string;
  bodyFont: string;
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

      <Link
        href={`/${locale}`}
        className={`btn-luxury mt-10 inline-flex items-center gap-2 border border-gold/40 px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold/10 ${
          isRtl ? "flex-row-reverse" : ""
        }`}
      >
        {j.backHome}
      </Link>
    </div>
  );
}

export function JoinTalentForm({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const j = dict.join;

  const isRtl = locale === "ar";

  const [clientError, setClientError] =
    useState<string | null>(null);

  const [isCompressing, setIsCompressing] =
    useState(false);

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  const [state, formAction, isPending] =
    useActionState(
      submitTalentAction,
      initialSubmitTalentState,
    );

  const errors =
    (state?.errors ?? {}) as TalentSubmissionErrors;

  async function handleFormAction(
    formData: FormData,
  ) {
    setClientError(null);

    setIsCompressing(true);

    try {
      const imageFile = formData.get("image");

      if (
        imageFile instanceof File &&
        imageFile.size > 0
      ) {
        const compressedProfileImage =
          await compressImageFile(imageFile, {
            maxWidth: 1200,
            quality: 0.75,
          });

        formData.set(
          "image",
          compressedProfileImage,
        );
      }

      const galleryFiles = formData
        .getAll("gallery")
        .filter(
          (file): file is File =>
            file instanceof File &&
            file.size > 0,
        )
        .slice(0, MAX_GALLERY_IMAGES);

      formData.delete("gallery");

      for (const file of galleryFiles) {
        const compressedGalleryImage =
          await compressImageFile(file, {
            maxWidth: 1600,
            quality: 0.75,
          });

        formData.append(
          "gallery",
          compressedGalleryImage,
        );
      }

      startTransition(() => {
        formAction(formData);
      });
    } catch {
      setClientError(
        locale === "ar"
          ? "تعذر ضغط الصور. جرّب صورًا أخرى أو حجمًا أصغر."
          : "Unable to compress images. Try different or smaller images.",
      );
    } finally {
      setIsCompressing(false);
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
      />
    );
  }

  return (
    <form
      action={handleFormAction}
      noValidate
      className={
        isRtl ? "text-right" : "text-left"
      }
    >
      {/* بقية الفورم كما هو بدون تغيير */}
    </form>
  );
}