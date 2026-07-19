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
      className="group block overflow-hidden rounded-[30px] border border-white/[0.08] bg-gray-elevated/20 transition-all duration-500 hover:-translate-y-1 hover:border-gold/25 hover:bg-gray-elevated/30"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black">
        {talent.image_url ? (
          <Image
            src={talent.image_url}
            alt={name || "Talent image"}
            fill
            priority={Boolean(talent.featured)}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm uppercase tracking-[0.3em] text-white/30">
            No image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        <div
          className={`absolute top-4 flex flex-wrap gap-2 ${
            isRtl ? "right-4" : "left-4"
          }`}
        >
          {talent.featured ? (
            <span className="rounded-full border border-gold/35 bg-black/55 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-gold backdrop-blur">
              {isRtl ? "موهبة مميزة" : "Featured"}
            </span>
          ) : null}

          {talent.verified ? (
            <span className="rounded-full border border-emerald-400/30 bg-black/55 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-emerald-300 backdrop-blur">
              {isRtl ? "موثق" : "Verified"}
            </span>
          ) : null}
        </div>

        <div
          className={`absolute bottom-5 left-5 right-5 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-gold">
            {[category, city].filter(Boolean).join(" • ")}
          </p>

          <h2
            className="text-2xl font-light tracking-tight text-white"
            style={{
              fontFamily: isRtl
                ? "var(--font-noto-arabic)"
                : "var(--font-cormorant)",
            }}
          >
            {name || (isRtl ? "موهبة غير مسماة" : "Unnamed Talent")}
          </h2>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 border-b border-white/[0.08] pb-5">
          <InfoBlock
            label={isRtl ? "التصنيف" : "Category"}
            value={category}
          />

          <InfoBlock
            label={isRtl ? "المدينة" : "City"}
            value={city}
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.28em] text-white/45 transition group-hover:text-gold">
            {isRtl ? "عرض الملف" : "View Profile"}
          </span>

          <span
            className={`text-white/30 transition group-hover:text-gold ${
              isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"
            }`}
          >
            {isRtl ? "←" : "→"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
        {label}
      </p>

      <p className="mt-2 text-sm text-white/80">{value || "—"}</p>
    </div>
  );
}