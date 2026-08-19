import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  MapPin,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

import {
  getTalentCategory,
  getTalentName,
} from "@/lib/utils/talent-formatters";

import { talentPath } from "@/lib/utils/routes";

type MobileTalent = Talent & {
  image_url?: string | null;
  profile_image_url?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
};

type MobileTalentShowcaseProps = {
  locale: Locale;
  talents: MobileTalent[];
};

function getTalentCity(
  talent: MobileTalent,
  locale: Locale,
) {
  return locale === "ar"
    ? talent.city_ar ?? talent.city_en ?? null
    : talent.city_en ?? talent.city_ar ?? null;
}

function getTalentImage(
  talent: MobileTalent,
) {
  return (
    talent.image_url ??
    talent.profile_image_url ??
    talent.avatar_url ??
    talent.photo_url ??
    null
  );
}

function getProfileHref(
  locale: Locale,
  talent: MobileTalent,
) {
  return talentPath(
    locale,
    talent.slug ?? talent.id,
  );
}

export function MobileTalentShowcase({
  locale,
  talents,
}: MobileTalentShowcaseProps) {
  const isArabic = locale === "ar";

  const DirectionArrow = isArabic
    ? ArrowLeft
    : ArrowRight;

  const availableTalents = talents
    .map((talent) => ({
      ...talent,
      resolvedImage: getTalentImage(talent),
    }))
    .filter(
      (
        talent,
      ): talent is MobileTalent & {
        resolvedImage: string;
      } => Boolean(talent.resolvedImage),
    );

  if (availableTalents.length === 0) {
    return (
      <div className="px-4">
        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] px-5 py-7 text-center">
          <p className="text-sm font-medium text-white/70">
            {isArabic
              ? "لا توجد مواهب بصور منشورة حاليًا"
              : "No talent profiles with images yet"}
          </p>

          <p className="mt-2 text-xs leading-5 text-white/30">
            {isArabic
              ? "ستظهر الملفات هنا فور نشرها."
              : "Published talent profiles will appear here."}
          </p>
        </div>
      </div>
    );
  }

  const featured = availableTalents.filter(
    (talent) => talent.featured,
  );

  const regular = availableTalents.filter(
    (talent) => !talent.featured,
  );

  const selectedTalents = [
    ...featured,
    ...regular,
  ].slice(0, 6);

  const primaryTalent = selectedTalents[0];
  const secondaryTalents =
    selectedTalents.slice(1);

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="relative"
    >
      {/* Main featured talent */}
      <Link
        href={getProfileHref(
          locale,
          primaryTalent,
        )}
        className="group relative mx-4 block overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0b0b0b]"
      >
        <div className="relative aspect-[4/4.35] overflow-hidden">
          <Image
            src={primaryTalent.resolvedImage}
            alt={
              getTalentName(
                primaryTalent,
                locale,
              ) || "Talent"
            }
            fill
            priority
            sizes="100vw"
            className="object-cover object-top transition duration-700 group-active:scale-[1.015]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1">
                {primaryTalent.featured && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-black/55 px-2.5 py-1 text-[10px] text-gold backdrop-blur-md">
                    <BadgeCheck
                      size={12}
                      strokeWidth={1.8}
                    />

                    <span>
                      {isArabic
                        ? "موهبة مميزة"
                        : "Featured talent"}
                    </span>
                  </div>
                )}

                <h3 className="truncate text-[1.55rem] font-semibold leading-tight text-white">
                  {getTalentName(
                    primaryTalent,
                    locale,
                  )}
                </h3>

                <TalentMeta
                  talent={primaryTalent}
                  locale={locale}
                />
              </div>

              <span className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md">
                <DirectionArrow size={17} />
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Secondary talents */}
      {secondaryTalents.length > 0 && (
        <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {secondaryTalents.map(
            (talent) => {
              const name = getTalentName(
                talent,
                locale,
              );

              return (
                <Link
                  key={talent.id}
                  href={getProfileHref(
                    locale,
                    talent,
                  )}
                  className="group w-[42vw] min-w-[154px] max-w-[184px] shrink-0 snap-start"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-[#0b0b0b]">
                    <Image
                      src={talent.resolvedImage}
                      alt={name || "Talent"}
                      fill
                      sizes="44vw"
                      className="object-cover object-top transition duration-700 group-active:scale-[1.02]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />

                    {talent.featured && (
                      <span className="absolute end-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-black/50 text-gold backdrop-blur-md">
                        <BadgeCheck
                          size={13}
                          strokeWidth={1.8}
                        />
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <p className="truncate text-[15px] font-semibold text-white">
                        {name}
                      </p>

                      <TalentMeta
                        talent={talent}
                        locale={locale}
                        compact
                      />
                    </div>
                  </div>
                </Link>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function TalentMeta({
  talent,
  locale,
  compact = false,
}: {
  talent: MobileTalent;
  locale: Locale;
  compact?: boolean;
}) {
  const category = getTalentCategory(
    talent,
    locale,
  );

  const city = getTalentCity(
    talent,
    locale,
  );

  if (!category && !city) {
    return null;
  }

  return (
    <div
      className={[
        "flex min-w-0 items-center gap-2",
        compact ? "mt-1.5" : "mt-2.5",
      ].join(" ")}
    >
      {category && (
        <span
          className={[
            "truncate text-gold",
            compact
              ? "text-[10px]"
              : "text-xs",
          ].join(" ")}
        >
          {category}
        </span>
      )}

      {category && city && (
        <span className="h-1 w-1 shrink-0 rounded-full bg-white/25" />
      )}

      {city && (
        <span
          className={[
            "flex min-w-0 items-center gap-1 truncate text-white/45",
            compact
              ? "text-[10px]"
              : "text-xs",
          ].join(" ")}
        >
          <MapPin
            size={compact ? 10 : 12}
            strokeWidth={1.6}
            className="shrink-0"
          />

          <span className="truncate">
            {city}
          </span>
        </span>
      )}
    </div>
  );
}