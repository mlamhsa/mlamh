import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Eye,
  MapPin,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import {
  getAdminDictionary,
  getAdminLanguage,
  withAdminLanguage,
  type AdminLanguage,
} from "@/lib/admin/i18n";

import type {
  AdminTalent,
} from "@/lib/repositories/talents/TalentRepository";

import { calculateTalentCompletion } from "@/lib/utils/talent-completion";

type PendingTalentCardProps = {
  talent: AdminTalent;
  language?: AdminLanguage | string | null;
};

type StatusPresentation = {
  label: string;
  className: string;
  icon: typeof CheckCircle2;
};

function getStatusPresentation({
  status,
  language,
}: {
  status: string | null | undefined;
  language: AdminLanguage;
}): StatusPresentation {
  const dictionary = getAdminDictionary(language);

  switch (status) {
    case "suspended":
      return {
        label: dictionary.statuses.suspended,
        className:
          "border-red-400/20 bg-red-500/[0.08] text-red-300",
        icon: ShieldAlert,
      };

    case "active":
      return {
        label:
          language === "ar"
            ? "نشط"
            : "Active",
        className:
          "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
        icon: CheckCircle2,
      };

    default:
      return {
        label:
          language === "ar"
            ? "غير محدد"
            : "Unknown",
        className:
          "border-white/10 bg-white/[0.04] text-white/45",
        icon: CircleDashed,
      };
  }
}

function getCompletionStyle(completion: number) {
  if (completion >= 80) {
    return {
      badge:
        "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300",
      bar: "bg-emerald-400",
    };
  }

  if (completion >= 50) {
    return {
      badge:
        "border-gold/20 bg-gold/[0.08] text-gold",
      bar: "bg-gold",
    };
  }

  return {
    badge:
      "border-red-400/20 bg-red-400/[0.08] text-red-300",
    bar: "bg-red-400",
  };
}

function formatDate(
  value: string | null | undefined,
  language: AdminLanguage,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    language === "ar"
      ? "ar-SA"
      : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function normalizeNumber(value: unknown) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

export function PendingTalentCard({
  talent,
  language: languageParam,
}: PendingTalentCardProps) {
  const language = getAdminLanguage(
    languageParam,
  );

  const dictionary =
    getAdminDictionary(language);

  const isArabic =
    language === "ar";

  const statusPresentation =
    getStatusPresentation({
      status: talent.status,
      language,
    });

  const StatusIcon =
    statusPresentation.icon;

  const completion = Math.min(
    100,
    Math.max(
      0,
      normalizeNumber(
        calculateTalentCompletion(talent),
      ),
    ),
  );

  const completionStyle =
    getCompletionStyle(completion);

  const primaryName =
    (
      isArabic
        ? talent.name_ar ||
          talent.name_en
        : talent.name_en ||
          talent.name_ar
    )?.trim() ||
    (
      isArabic
        ? "موهبة بدون اسم"
        : "Unnamed talent"
    );

  const secondaryName =
    (
      isArabic
        ? talent.name_en
        : talent.name_ar
    )?.trim() || null;

  const category =
    (
      isArabic
        ? talent.category_ar ||
          talent.category_en
        : talent.category_en ||
          talent.category_ar
    )?.trim() || "—";

  const city =
    (
      isArabic
        ? talent.city_ar ||
          talent.city_en
        : talent.city_en ||
          talent.city_ar
    )?.trim() || "—";

  const phone =
    talent.account_phone?.trim() ||
    "—";

  const views =
    normalizeNumber(
      talent.views,
    );

  const lastUpdated =
    talent.account_updated_at ||
    talent.updated_at ||
    talent.profile_completed_at;

  const reviewHref =
    withAdminLanguage(
      `/admin/talents/${talent.id}`,
      language,
    );

  return (
    <article
      dir={isArabic ? "rtl" : "ltr"}
      className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition hover:border-white/[0.14] hover:bg-white/[0.028]"
    >
      <div className="grid min-w-0 md:grid-cols-[150px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-black md:aspect-auto md:min-h-[210px]">
          {talent.image_url ? (
            <Image
              src={talent.image_url}
              alt={
                isArabic
                  ? `صورة ${primaryName}`
                  : `${primaryName} profile image`
              }
              fill
              sizes="(max-width: 768px) 100vw, 150px"
              className="object-cover transition duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex h-full min-h-44 items-center justify-center bg-white/[0.02] text-white/20">
              <UserRound
                aria-hidden="true"
                className="h-10 w-10"
              />
            </div>
          )}

          <span className="absolute start-3 top-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] text-white/60 backdrop-blur">
            #{talent.id}
          </span>
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${statusPresentation.className}`}
                >
                  <StatusIcon
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />

                  {statusPresentation.label}
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] ${completionStyle.badge}`}
                >
                  {dictionary.talents.profileCompletion}:{" "}
                  {completion}%
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] ${
                    talent.published
                      ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                      : "border-white/10 bg-white/[0.04] text-white/40"
                  }`}
                >
                  {talent.published
                    ? dictionary.statuses.published
                    : dictionary.statuses.hidden}
                </span>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] ${
                    talent.verified
                      ? "border-sky-400/20 bg-sky-400/[0.07] text-sky-300"
                      : "border-white/10 bg-white/[0.04] text-white/40"
                  }`}
                >
                  {talent.verified
                    ? isArabic
                      ? "موثّق"
                      : "Verified"
                    : isArabic
                      ? "غير موثّق"
                      : "Not verified"}
                </span>
              </div>

              <h2 className="mt-4 truncate text-xl font-light text-white sm:text-2xl">
                {primaryName}
              </h2>

              {secondaryName ? (
                <p
                  dir={
                    isArabic
                      ? "ltr"
                      : "rtl"
                  }
                  className="mt-1 truncate text-sm text-white/40"
                >
                  {secondaryName}
                </p>
              ) : null}
            </div>

            <Link
              href={reviewHref}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.07] px-5 text-sm text-gold transition hover:bg-gold hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              {dictionary.talents.reviewProfile}

              <ArrowUpRight
                aria-hidden="true"
                className={`h-4 w-4 ${
                  isArabic
                    ? "-scale-x-100"
                    : ""
                }`}
              />
            </Link>
          </div>

          <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${completionStyle.bar}`}
              style={{
                width: `${completion}%`,
              }}
            />
          </div>

          <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
                <UserRound className="h-3.5 w-3.5" />
                {dictionary.talents.category}
              </dt>

              <dd className="mt-2 truncate text-sm text-white/70">
                {category}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
                <MapPin className="h-3.5 w-3.5" />
                {dictionary.talents.city}
              </dt>

              <dd className="mt-2 truncate text-sm text-white/70">
                {city}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
                <Phone className="h-3.5 w-3.5" />
                {dictionary.talents.phone}
              </dt>

              <dd
                dir="ltr"
                className={`mt-2 truncate text-sm text-white/70 ${
                  isArabic
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {phone}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
                <Eye className="h-3.5 w-3.5" />

                {isArabic
                  ? "المشاهدات"
                  : "Views"}
              </dt>

              <dd className="mt-2 text-sm text-white/70">
                {views.toLocaleString(
                  isArabic
                    ? "ar-SA"
                    : "en-US",
                )}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/30">
                <CalendarDays className="h-3.5 w-3.5" />
                {dictionary.talents.lastUpdated}
              </dt>

              <dd className="mt-2 truncate text-sm text-white/70">
                {formatDate(
                  lastUpdated,
                  language,
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}