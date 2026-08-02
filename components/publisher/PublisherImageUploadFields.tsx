"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 md:p-8">
      <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
        {isRtl ? "هوية الناشر" : "Publisher Identity"}
      </p>

      <div className="grid gap-8">
        <div>
          <label
            htmlFor="cover-image"
            className="mb-3 block text-xs uppercase tracking-[0.25em] text-white/40"
          >
            {isRtl ? "معاينة الغلاف" : "Cover Preview"}
          </label>

          <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black sm:h-56 sm:rounded-3xl">
            {coverPreviewUrl ? (
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
            ) : (
              <p className="px-4 text-center text-sm text-white/35">
                {isRtl
                  ? "لم يتم اختيار غلاف"
                  : "No cover selected"}
              </p>
            )}
          </div>

          <input
            id="cover-image"
            name="cover_image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              setCoverFile(event.target.files?.[0] ?? null);
            }}
            className={`mt-4 block w-full min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-gold/50 sm:px-4 sm:py-4 ${
              isRtl
                ? "file:ml-3 file:mr-0"
                : "file:mr-3"
            } file:rounded-lg file:border-0 file:bg-gold/10 file:px-3 file:py-2 file:text-sm file:text-gold`}
          />

          <p className="mt-2 text-xs leading-6 text-white/35">
            {isRtl
              ? "يفضل غلاف عريض مثل 1600×500."
              : "Recommended cover size: 1600×500."}
          </p>
        </div>

        <div>
          <label
            htmlFor="profile-image"
            className="mb-3 block text-xs uppercase tracking-[0.25em] text-white/40"
          >
            {isRtl
              ? "معاينة صورة البروفايل"
              : "Profile Image Preview"}
          </label>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-black sm:h-36 sm:w-36">
              {profilePreviewUrl ? (
                <Image
                  src={profilePreviewUrl}
                  alt={
                    isRtl
                      ? "معاينة صورة البروفايل"
                      : "Profile image preview"
                  }
                  fill
                  unoptimized={profilePreviewUrl.startsWith("blob:")}
                  sizes="144px"
                  className="object-cover"
                />
              ) : (
                <span className="px-3 text-center text-xs text-white/35">
                  {isRtl ? "لا توجد صورة" : "No image"}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <input
                id="profile-image"
                name="profile_image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setProfileFile(event.target.files?.[0] ?? null);
                }}
                className={`block w-full min-w-0 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-gold/50 sm:px-4 sm:py-4 ${
                  isRtl
                    ? "file:ml-3 file:mr-0"
                    : "file:mr-3"
                } file:rounded-lg file:border-0 file:bg-gold/10 file:px-3 file:py-2 file:text-sm file:text-gold`}
              />

              <p className="mt-2 text-xs leading-6 text-white/35">
                {isRtl
                  ? "يفضل صورة مربعة مثل 800×800."
                  : "Recommended profile size: 800×800."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}