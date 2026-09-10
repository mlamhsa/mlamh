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
}: {
  isRtl: boolean;
  currentProfileImageUrl?: string | null;
  currentCoverImageUrl?: string | null;
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

  const profilePreviewUrl =
    profileObjectUrl ?? currentProfileImageUrl ?? null;

  return (
    <section className="rounded-[2rem] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6 md:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-gold">
          {isRtl ? "شعار الجهة" : "Organization Logo"}
        </p>
        <p className="mt-2 text-sm leading-6 text-white/40">
          {isRtl
            ? "أضف شعارًا واضحًا للجهة. سيظهر في ملف الجهة والفرص المنشورة."
            : "Add a clear organization logo. It will appear on the organization profile and published opportunities."}
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
                alt={isRtl ? "معاينة شعار الجهة" : "Organization logo preview"}
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
              ? "يفضل صورة مربعة 800×800 بصيغة JPG أو PNG أو WEBP. يتم الحفظ عند الضغط على زر حفظ التغييرات."
              : "A square 800×800 JPG, PNG or WEBP image is recommended. It is saved when you press Save Changes."}
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
                ? "حجم الشعار يجب ألا يتجاوز 5 ميجابايت."
                : "Logo must not exceed 5 MB.",
            );
            input.value = "";
            return;
          }

          setProfileFile(file);
        }}
        className="sr-only"
      />

      {profileError ? (
        <p className="mt-3 text-xs leading-6 text-red-300">
          {profileError}
        </p>
      ) : null}
    </section>
  );
}
