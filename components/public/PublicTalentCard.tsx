import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";
import {
  getTalentCategory,
  getTalentCity,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { talentPath } from "@/lib/utils/routes";

type PublicTalentCardProps = {
  talent: Talent;
  locale: Locale;
  showInviteAction?: boolean;
};

export function PublicTalentCard({
  talent,
  locale,
  showInviteAction = false,
}: PublicTalentCardProps) {
  const isRtl = locale === "ar";

  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);
  const profileHref = talentPath(locale, talent.slug ?? talent.id);
  const inviteHref = `${profileHref}#request-talent`;

  const displayName =
    name || (isRtl ? "موهبة غير مسماة" : "Unnamed Talent");
  const imageAlt = [displayName, category, city].filter(Boolean).join(" — ");

  const placeholderInitials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const ViewProfileIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gray-elevated/20 transition duration-500 hover:-translate-y-1 hover:border-gold/25 hover:bg-gray-elevated/30 focus-within:ring-2 focus-within:ring-gold/50">
      <Link
        href={profileHref}
        aria-label={
          isRtl
            ? `عرض ملف ${displayName}`
            : `View ${displayName}'s profile`
        }
        className="relative block aspect-[4/5] w-full overflow-hidden bg-black/70 focus-visible:outline-none"
      >
        {talent.image_url ? (
          <Image
            src={talent.image_url}
            alt={imageAlt}
            fill
            priority={Boolean(talent.featured)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
            className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-gold/[0.09] px-5 text-center">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-gold/10 bg-gold/[0.04] blur-sm" />
            <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full border border-white/[0.06] bg-white/[0.025]" />

            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/25 bg-black/35 text-3xl font-light tracking-[0.08em] text-gold shadow-2xl shadow-black/30 backdrop-blur-sm">
              {placeholderInitials || "M"}
            </div>

            <p className="relative mt-5 text-[10px] uppercase tracking-[0.35em] text-white/35">
              MLAMH TALENT
            </p>

            <p className="relative mt-2 text-xs text-white/45">
              {isRtl ? "الصورة قيد الإضافة" : "Photo coming soon"}
            </p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/20" />

        {(talent.featured || talent.verified) && (
          <div
            className={`absolute top-4 z-10 flex max-w-[calc(100%-2rem)] flex-wrap gap-2 ${
              isRtl ? "right-4" : "left-4"
            }`}
          >
            {talent.featured ? (
              <StatusBadge
                icon={<Sparkles size={12} aria-hidden="true" />}
                label={isRtl ? "موهبة مميزة" : "Featured"}
                tone="gold"
                isRtl={isRtl}
              />
            ) : null}

            {talent.verified ? (
              <StatusBadge
                icon={<BadgeCheck size={12} aria-hidden="true" />}
                label={isRtl ? "موثق" : "Verified"}
                tone="success"
                isRtl={isRtl}
              />
            ) : null}
          </div>
        )}

        <div
          className={`absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          {(category || city) && (
            <p
              className={`mb-2 truncate text-[10px] text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.24em]"
              }`}
            >
              {[category, city].filter(Boolean).join(" • ")}
            </p>
          )}

          <h2
            className={`line-clamp-2 min-h-[3.25rem] break-words text-2xl font-light leading-[1.15] text-white ${
              isRtl ? "tracking-normal" : "tracking-tight"
            }`}
            style={{
              fontFamily: isRtl
                ? "var(--font-noto-arabic)"
                : "var(--font-cormorant)",
            }}
          >
            {displayName}
          </h2>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="grid min-w-0 grid-cols-2 gap-4 border-b border-white/[0.08] pb-4">
          <InfoBlock
            label={isRtl ? "التصنيف" : "Category"}
            value={category}
            isRtl={isRtl}
          />

          <InfoBlock
            label={isRtl ? "المدينة" : "City"}
            value={city}
            isRtl={isRtl}
          />
        </div>

        <div className={`mt-auto grid gap-2 pt-5 ${showInviteAction ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link
            href={profileHref}
            className="inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-xs text-white/55 transition hover:border-gold/30 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <span>{isRtl ? "عرض الملف" : "View profile"}</span>
            <ViewProfileIcon size={15} aria-hidden="true" />
          </Link>

          {showInviteAction ? (
            <Link
              href={inviteHref}
              aria-label={
                isRtl
                  ? `دعوة ${displayName} للتواصل`
                  : `Invite ${displayName} to connect`
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-3 text-center text-xs font-semibold text-black transition hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              <UserRoundPlus size={15} aria-hidden="true" />
              <span>{isRtl ? "دعوة للتواصل" : "Invite"}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  icon,
  label,
  tone,
  isRtl,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "gold" | "success";
  isRtl: boolean;
}) {
  const toneClass =
    tone === "gold"
      ? "border-gold/35 text-gold"
      : "border-emerald-400/30 text-emerald-300";

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border bg-black/60 px-3 py-1 text-[10px] shadow-lg shadow-black/15 backdrop-blur-md ${toneClass} ${
        isRtl ? "tracking-normal" : "uppercase tracking-[0.18em]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

function InfoBlock({
  label,
  value,
  isRtl,
}: {
  label: string;
  value?: string | null;
  isRtl: boolean;
}) {
  return (
    <div className="min-w-0">
      <p
        className={`truncate text-[9px] text-gray-muted ${
          isRtl
            ? "tracking-normal"
            : "uppercase tracking-[0.22em]"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 line-clamp-2 min-h-10 break-words text-sm leading-5 text-white/80">
        {value || "—"}
      </p>
    </div>
  );
}
