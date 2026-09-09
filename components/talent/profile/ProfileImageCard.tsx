import Image from "next/image";

import { updateOwnTalentProfileImageAction } from "@/lib/actions/update-own-talent-profile-image";

type Props = {
  locale: "ar" | "en";
  imageUrl?: string | null;
};

export default function ProfileImageCard({ locale, imageUrl }: Props) {
  const isArabic = locale === "ar";

  return (
    <section className="rounded-[1.75rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.11),transparent_45%),rgba(255,255,255,0.02)] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={isArabic ? "الصورة الشخصية" : "Profile photo"}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-gold/60" aria-hidden="true">
              ◉
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-light text-white sm:text-2xl">
              {isArabic ? "الصورة الشخصية" : "Profile photo"}
            </h2>
            <span className="rounded-full border border-gold/25 bg-gold/[0.08] px-2.5 py-1 text-[10px] text-gold">
              ⭐ {isArabic ? "مطلوبة للاعتماد" : "Required for approval"}
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
            {isArabic
              ? "ارفع صورة رئيسية واضحة وحديثة. هذه الصورة مستقلة عن معرض الأعمال وهي الصورة المعتمدة لملفك عند الظهور والترشيح."
              : "Upload a clear, recent main photo. It is separate from your portfolio gallery and is the primary image used for your profile and recommendations."}
          </p>

          <form action={updateOwnTalentProfileImageAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input type="hidden" name="locale" value={locale} />
            <input
              required
              type="file"
              name="profile_image"
              accept="image/jpeg,image/png,image/webp"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-xs text-white/55 file:me-3 file:rounded-lg file:border-0 file:bg-gold file:px-3 file:py-2 file:text-xs file:font-medium file:text-black"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/[0.08] px-5 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              {imageUrl
                ? isArabic
                  ? "تغيير الصورة"
                  : "Change photo"
                : isArabic
                  ? "رفع الصورة"
                  : "Upload photo"}
            </button>
          </form>

          <p className="mt-2 text-[11px] text-white/30">
            {isArabic ? "JPG أو PNG أو WEBP — بحد أقصى 10MB" : "JPG, PNG or WEBP — maximum 10MB"}
          </p>
        </div>
      </div>
    </section>
  );
}
