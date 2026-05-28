import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";
import {
  getTalentCategory,
  getTalentCity,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { talentPath } from "@/lib/utils/routes";

export function PublicTalentCard({
  talent,
  locale,
}: {
  talent: Talent;
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);

  return (
    <Link
      href={talentPath(locale, talent.slug ?? talent.id)}
      className="group overflow-hidden rounded-[28px] border border-white/[0.08] bg-gray-elevated/20 transition-all duration-500 hover:-translate-y-1 hover:border-gold/20"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        {talent.image_url ? (
          <Image
            src={talent.image_url}
            alt={name || "Talent image"}
            fill
            priority={talent.featured}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">
            No image
          </div>
        )}

        {talent.featured ? (
          <div className="absolute top-4 left-4 rounded-full border border-gold/30 bg-black/40 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-gold backdrop-blur">
            {isRtl ? "مميز" : "Featured"}
          </div>
        ) : null}
      </div>

      <div className="p-6">
        <h2
          className="text-3xl font-light tracking-tight text-white"
          style={{
            fontFamily: isRtl
              ? "var(--font-noto-arabic)"
              : "var(--font-cormorant)",
          }}
        >
          {name || (isRtl ? "موهبة غير مسماة" : "Unnamed Talent")}
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-5">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
              {isRtl ? "التصنيف" : "Category"}
            </p>

            <p className="mt-2 text-sm text-white/80">{category || "—"}</p>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
              {isRtl ? "المدينة" : "City"}
            </p>

            <p className="mt-2 text-sm text-white/80">{city || "—"}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}