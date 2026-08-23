"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const MAX_PROFILE_SIZE = 5 * 1024 * 1024;
const MAX_COVER_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export default function PublisherImageUploadFields({
  isRtl,
  currentProfileImageUrl,
  currentCoverImageUrl,
}: {
  isRtl: boolean;
  currentProfileImageUrl?: string | null;
  currentCoverImageUrl?: string | null;
}) {
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const profileObjectUrl = useMemo(
    () => (profileFile ? URL.createObjectURL(profileFile) : null),
    [profileFile],
  );

  const coverObjectUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  );

  useEffect(() => {
    return () => {
      if (profileObjectUrl) {
        URL.revokeObjectURL(profileObjectUrl);
      }
    };
  }, [profileObjectUrl]);

  useEffect(() => {
    return () => {
      if (coverObjectUrl) {
        URL.revokeObjectURL(coverObjectUrl);
      }
    };
  }, [coverObjectUrl]);

  const profilePreviewUrl =
    profileObjectUrl ?? currentProfileImageUrl ?? null;

  const coverPreviewUrl =
    coverObjectUrl ?? currentCoverImageUrl ?? null;

  return (
    <section className="rounded-[2rem] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6 md:p-8">
      <div className="mb-7">
  <p className="text-sm font-medium text-gold">
    {isRtl ? "الهوية البصرية" : "Visual Identity"}
  </p>

  <p className="mt-2 text-sm leading-6 text-white/40">
    {isRtl
      ? "أضف شعار الجهة وصورة الغلاف التي ستظهر للمواهب في ملفك وفرصك."
      : "Add the organization logo and cover image shown across your profile and opportunities."}
  </p>
</div>

      <div className="grid gap-8">
      <div>
  <div className="mb-3 flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-white/70">
        {isRtl ? "صورة الغلاف" : "Cover Image"}
      </p>

      <p className="mt-1 text-xs text-white/35">
        {isRtl
          ? "يفضل مقاس 1600×500 — JPG أو PNG أو WEBP"
          : "Recommended 1600×500 — JPG, PNG or WEBP"}
      </p>
    </div>

    {coverPreviewUrl ? (
  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-xs text-emerald-300">
    {coverFile
      ? isRtl
        ? "جاري الحفظ..."
        : "Saving..."
      : isRtl
        ? "تم الحفظ"
        : "Saved"}
  </span>
) : null}
  </div>

  <label
    htmlFor="cover-image"
    className="group relative flex min-h-52 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-white/15 bg-white/[0.02] transition hover:border-gold/35 hover:bg-gold/[0.025] sm:min-h-60"
  >
    {coverPreviewUrl ? (
      <>
        <Image
          src={coverPreviewUrl}
          alt={
            isRtl
              ? "معاينة صورة الغلاف"
              : "Cover image preview"
          }
          fill
          unoptimized={coverPreviewUrl.startsWith("blob:")}
          sizes="(max-width: 640px) 100vw, 896px"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/35 opacity-0 transition group-hover:opacity-100" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full border border-white/15 bg-black/65 px-5 py-2.5 text-sm text-white">
            {isRtl ? "تغيير الغلاف" : "Change Cover"}
          </span>
        </div>
      </>
    ) : (
      <div className="px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-xl text-gold">
          +
        </div>

        <p className="mt-4 text-sm font-medium text-white/70">
          {isRtl
            ? "اختر صورة غلاف للجهة"
            : "Choose an organization cover"}
        </p>

        <p className="mt-2 text-xs leading-6 text-white/35">
          {isRtl
            ? "اضغط هنا لاختيار الصورة"
            : "Click here to choose an image"}
        </p>
      </div>
    )}
  </label>

  <input
    id="cover-image"
    name="cover_image"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(event) => {
      event.stopPropagation();
    
      const input = event.currentTarget;
      const file = input.files?.[0] ?? null;
    
      setCoverError(null);

  if (!file) {
    setCoverFile(null);
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    setCoverFile(null);
    setCoverError(
      isRtl
        ? "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP."
        : "Unsupported image format. Use JPG, PNG or WEBP.",
    );
    input.value = "";
    return;
  }

  if (file.size > MAX_COVER_SIZE) {
    setCoverFile(null);
    setCoverError(
      isRtl
        ? "حجم صورة الغلاف يجب ألا يتجاوز 10 ميجابايت."
        : "Cover image must not exceed 10 MB.",
    );
    input.value = "";
    return;
  }

  setCoverFile(file);

input.form?.requestSubmit();
}}
    className="sr-only"
  />
  {coverError ? (
  <p className="mt-3 text-xs leading-6 text-red-300">
    {coverError}
  </p>
) : null}
</div>

<div className="border-t border-white/[0.07] pt-7">
  <div className="mb-4">
    <p className="text-sm font-medium text-white/70">
      {isRtl ? "شعار الجهة" : "Organization Logo"}
    </p>
    {profilePreviewUrl ? (
  <span className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-xs text-emerald-300">
    {profileFile
      ? isRtl
        ? "جاري الحفظ..."
        : "Saving..."
      : isRtl
        ? "تم الحفظ"
        : "Saved"}
  </span>
) : null}
    <p className="mt-1 text-xs text-white/35">
      {isRtl
        ? "يفضل صورة مربعة 800×800 — JPG أو PNG أو WEBP"
        : "Recommended square image 800×800 — JPG, PNG or WEBP"}
    </p>
  </div>

  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
    <label
      htmlFor="profile-image"
      className="group relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-gold/25 bg-gold/[0.025] transition hover:border-gold/50 sm:h-36 sm:w-36"
    >
      {profilePreviewUrl ? (
        <>
          <Image
            src={profilePreviewUrl}
            alt={
              isRtl
                ? "معاينة شعار الجهة"
                : "Organization logo preview"
            }
            fill
            unoptimized={profilePreviewUrl.startsWith("blob:")}
            sizes="144px"
            className="object-cover"
          />

          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
            <span className="text-xs text-white">
              {isRtl ? "تغيير" : "Change"}
            </span>
          </div>
        </>
      ) : (
        <div className="px-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/[0.08] text-lg text-gold">
            +
          </div>

          <p className="mt-2 text-xs text-white/45">
            {isRtl ? "إضافة شعار" : "Add Logo"}
          </p>
        </div>
      )}
    </label>

    <div className="min-w-0 flex-1">
      <label
        htmlFor="profile-image"
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm text-white/65 transition hover:border-gold/30 hover:text-gold"
      >
        {profilePreviewUrl
          ? isRtl
            ? "تغيير الشعار"
            : "Change Logo"
          : isRtl
            ? "اختيار شعار"
            : "Choose Logo"}
      </label>

      <p className="mt-3 max-w-md text-xs leading-6 text-white/35">
        {isRtl
          ? "استخدم شعارًا واضحًا بخلفية مناسبة ليظهر بشكل جيد في ملف الجهة والفرص."
          : "Use a clear logo that displays well across your organization profile and opportunities."}
      </p>
    </div>
  </div>

  <input
    id="profile-image"
    name="profile_image"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(event) => {
      event.stopPropagation();
    
      const input = event.currentTarget;
      const file = input.files?.[0] ?? null;
    
      setProfileError(null);
    
      if (!file) {
        setProfileFile(null);
        return;
      }
    
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        setProfileFile(null);
        setProfileError(
          isRtl
            ? "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP."
            : "Unsupported image format. Use JPG, PNG or WEBP.",
        );
        input.value = "";
        return;
      }
    
      if (file.size > MAX_PROFILE_SIZE) {
        setProfileFile(null);
        setProfileError(
          isRtl
            ? "حجم الشعار يجب ألا يتجاوز 5 ميجابايت."
            : "Logo must not exceed 5 MB.",
        );
        input.value = "";
        return;
      }
    
      setProfileFile(file);
    
      input.form?.requestSubmit();
    }}
    className="sr-only"
  />
  {profileError ? (
  <p className="mt-3 text-xs leading-6 text-red-300">
    {profileError}
  </p>
) : null}
</div>
      </div>
    </section>
  );
}