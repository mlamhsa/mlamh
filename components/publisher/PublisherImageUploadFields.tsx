"use client";

import { useMemo, useState } from "react";

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

  const profilePreviewUrl = useMemo(() => {
    if (!profileFile) return currentProfileImageUrl ?? null;
    return URL.createObjectURL(profileFile);
  }, [profileFile, currentProfileImageUrl]);

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return currentCoverImageUrl ?? null;
    return URL.createObjectURL(coverFile);
  }, [coverFile, currentCoverImageUrl]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
      <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">
        {isRtl ? "هوية الناشر" : "Publisher Identity"}
      </p>

      <div className="grid gap-8">
        <div>
          <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-white/40">
            {isRtl ? "معاينة الغلاف" : "Cover Preview"}
          </label>

          <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black">
            {coverPreviewUrl ? (
              <img
                src={coverPreviewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="text-sm text-white/35">
                {isRtl ? "لم يتم اختيار غلاف" : "No cover selected"}
              </p>
            )}
          </div>

          <input
            name="cover_image"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="mt-4 w-full border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition file:mr-4 file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold focus:border-gold/50"
          />

          <p className="mt-2 text-xs text-white/35">
            {isRtl
              ? "يفضل غلاف عريض مثل 1600×500."
              : "Recommended cover size: 1600×500."}
          </p>
        </div>

        <div>
          <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-white/40">
            {isRtl ? "معاينة صورة البروفايل" : "Profile Image Preview"}
          </label>

          <div className="flex items-center gap-5">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-black">
              {profilePreviewUrl ? (
                <img
                  src={profilePreviewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-white/35">
                  {isRtl ? "لا توجد صورة" : "No image"}
                </span>
              )}
            </div>

            <div className="flex-1">
              <input
                name="profile_image"
                type="file"
                accept="image/*"
                onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                className="w-full border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition file:mr-4 file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold focus:border-gold/50"
              />

              <p className="mt-2 text-xs text-white/35">
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