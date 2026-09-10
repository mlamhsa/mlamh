"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const MAX_PROFILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export default function PublisherImageUploadFields({
  isRtl,
  currentProfileImageUrl,
  isIndividual = false,
}: {
  isRtl: boolean;
  currentProfileImageUrl?: string | null;
  currentCoverImageUrl?: string | null;
  isIndividual?: boolean;
}) {
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const profileObjectUrl = useMemo(
    () => (profileFile ? URL.createObjectURL(profileFile) : null),
    [profileFile],
  );

  useEffect(() => {
    return () => {
      if (profileObjectUrl) {
        URL.revokeObjectURL(profileObjectUrl);
      }
    };
  }, [profileObjectUrl]);

  const previewUrl = profileObjectUrl ?? currentProfileImageUrl ?? null;

  return (
    <section className="rounded-[2rem] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6 md:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-gold">
          {isIndividual
            ? isRtl
              ? "الصورة أو شعار النشاط"
              : "Photo or Business Logo"
            : isRtl
              ? "شعار الجهة"
              : "Organization Logo"}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/40">
          {isIndividual
            ? isRtl
              ? "اختياري. أضف صورة شخصية أو شعار نشاطك إذا كان لديك متجر أو صالون أو مشروع صغير."
              : "Optional. Add a personal photo or business logo if you run a shop, salon, or small business."
            : isRtl
              ? "استخدم شعارًا واضحًا ومربعًا ليظهر بشكل احترافي في ملف الجهة والفرص."
              : "Use a clear square logo for a professional appearance across your profile and opportunities."}
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <label
          htmlFor="profile-image"
          className="group relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[1.75rem] border border-dashed border-gold/25 bg-gold/[0.025] transition hover:border-gold/50 sm:h-36 sm:w-36"
        >
          {previewUrl ? (
            <>
              <Image
                src={previewUrl}
                alt={
                  isIndividual
                    ? isRtl
                      ? "معاينة الصورة"
                      : "Image preview"
                    : isRtl
                      ? "معاينة شعار الجهة"
                      : "Organization logo preview"
                }
                fill
                unoptimized={previewUrl.startsWith("blob:")}
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
                {isIndividual
                  ? isRtl
                    ? "إضافة صورة"
                    : "Add Image"
                  : isRtl
                    ? "إضافة شعار"
                    : "Add Logo"}
              </p>
            </div>
          )}
        </label>

        <div className="min-w-0 flex-1">
          <label
            htmlFor="profile-image"
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-5 text-sm text-white/65 transition hover:border-gold/30 hover:text-gold"
          >
            {previewUrl
              ? isRtl
                ? "تغيير الصورة"
                : "Change Image"
              : isRtl
                ? "اختيار صورة"
                : "Choose Image"}
          </label>

          <p className="mt-3 max-w-md text-xs leading-6 text-white/35">
            {isRtl
              ? "JPG أو PNG أو WEBP — بحد أقصى 5 ميجابايت. تُحفظ الصورة عند الضغط على «حفظ التغييرات»."
              : "JPG, PNG or WEBP — up to 5 MB. The image is saved when you press “Save Changes”."}
          </p>
        </div>
      </div>

      <input
        id="profile-image"
        name="profile_image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
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
                ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت."
                : "Image must not exceed 5 MB.",
            );
            input.value = "";
            return;
          }

          setProfileFile(file);
        }}
        className="sr-only"
      />

      {profileError ? (
        <p className="mt-3 text-xs leading-6 text-red-300">{profileError}</p>
      ) : null}
    </section>
  );
}
