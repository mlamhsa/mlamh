"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Eye,
  ImageOff,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import {
  getAdminDictionary,
  getAdminLanguage,
  withAdminLanguage,
} from "@/lib/admin/i18n";

type TopViewedTalent = {
  id: number | string;
  name_ar?: string | null;
  name_en?: string | null;
  slug?: string | null;
  image_url?: string | null;
  views?: number | null;
  profile_views?: number | null;
};

type AdminTalentAnalyticsProps = {
  topViewedTalents: TopViewedTalent[];
};

function normalizeViews(
  talent: TopViewedTalent,
) {
  const value =
    talent.views ??
    talent.profile_views ??
    0;

  const normalized = Number(value);

  return Number.isFinite(normalized)
    ? normalized
    : 0;
}

export function AdminTalentAnalytics({
  topViewedTalents,
}: AdminTalentAnalyticsProps) {
  const searchParams = useSearchParams();

  const language = getAdminLanguage(
    searchParams.get("lang"),
  );

  const dictionary =
    getAdminDictionary(language);

  const isArabic = language === "ar";

  if (topViewedTalents.length === 0) {
    return (
      <section
        dir={isArabic ? "rtl" : "ltr"}
        className="mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:mb-8 sm:rounded-3xl sm:p-6"
      >
        <div className="flex min-h-32 flex-col items-center justify-center text-center sm:min-h-40">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 text-white/30 sm:h-12 sm:w-12 sm:rounded-2xl">
            <BarChart3
              aria-hidden="true"
              className="h-4 w-4 sm:h-5 sm:w-5"
            />
          </span>

          <h2 className="mt-3 text-sm font-medium text-white/75 sm:mt-4 sm:text-base">
            {dictionary.talents.topViewed}
          </h2>

          <p className="mt-2 max-w-md text-xs leading-6 text-white/35 sm:text-sm sm:leading-7">
            {isArabic
              ? "لا توجد بيانات مشاهدة كافية لعرض المواهب الأكثر مشاهدة حاليًا."
              : "There is not enough view data to show the most viewed talents yet."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      aria-labelledby="top-viewed-talents-title"
      className="mb-6 min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:mb-8 sm:rounded-3xl sm:p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5 sm:flex-row sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-gold">
            <BarChart3
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
            />

            <p className="text-[9px] uppercase tracking-[0.22em] sm:text-[10px] sm:tracking-[0.3em]">
              {isArabic
                ? "التحليلات"
                : "Analytics"}
            </p>
          </div>

          <h2
            id="top-viewed-talents-title"
            className="mt-1.5 text-lg font-light text-white sm:mt-2 sm:text-2xl"
          >
            {dictionary.talents.topViewed}
          </h2>

          <p className="mt-1.5 hidden text-sm leading-6 text-white/35 sm:block">
            {isArabic
              ? "المواهب التي حققت أعلى عدد من مشاهدات الملف."
              : "Talent profiles with the highest number of views."}
          </p>
        </div>

        <Link
          href={withAdminLanguage(
            "/admin/analytics",
            language,
          )}
          className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] px-3 text-[10px] text-white/50 transition hover:border-gold/25 hover:text-gold sm:min-h-10 sm:rounded-xl sm:px-4 sm:text-xs"
        >
          {isArabic
            ? "عرض الكل"
            : "View all"}
        </Link>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        {topViewedTalents.map(
          (talent, index) => {
            const views =
              normalizeViews(talent);

            const primaryName =
              (
                isArabic
                  ? talent.name_ar ||
                    talent.name_en
                  : talent.name_en ||
                    talent.name_ar
              )?.trim() ||
              (isArabic
                ? "موهبة بدون اسم"
                : "Unnamed talent");

            const secondaryName =
              (
                isArabic
                  ? talent.name_en
                  : talent.name_ar
              )?.trim() || null;

            return (
              <Link
                key={talent.id}
                href={withAdminLanguage(
                  `/admin/talents/${talent.id}`,
                  language,
                )}
                className="group min-w-0 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 transition hover:-translate-y-0.5 hover:border-gold/25 hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:rounded-2xl"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-black sm:aspect-[4/3]">
                  {talent.image_url ? (
                    <Image
                      src={talent.image_url}
                      alt={
                        isArabic
                          ? `صورة ${primaryName}`
                          : `${primaryName} profile image`
                      }
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 220px"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20">
                      <ImageOff
                        aria-hidden="true"
                        className="h-6 w-6 sm:h-7 sm:w-7"
                      />
                    </div>
                  )}

                  <span className="absolute start-2 top-2 rounded-full border border-gold/25 bg-black/70 px-2 py-0.5 text-[9px] text-gold backdrop-blur sm:start-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                    #{index + 1}
                  </span>
                </div>

                <div className="min-w-0 p-3 sm:p-4">
                  <h3 className="truncate text-xs font-medium text-white sm:text-sm">
                    {primaryName}
                  </h3>

                  {secondaryName ? (
                    <p
                      dir={
                        isArabic
                          ? "ltr"
                          : "rtl"
                      }
                      className="mt-0.5 truncate text-[10px] text-white/35 sm:mt-1 sm:text-xs"
                    >
                      {secondaryName}
                    </p>
                  ) : (
                    <div className="mt-0.5 h-3 sm:mt-1 sm:h-4" />
                  )}

                  <div className="mt-2.5 flex min-w-0 items-center gap-1.5 border-t border-white/[0.07] pt-2 sm:mt-4 sm:gap-2 sm:pt-3">
                    <Eye
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 text-gold sm:h-3.5 sm:w-3.5"
                    />

                    <span className="truncate text-[8px] uppercase tracking-[0.08em] text-white/35 sm:text-[10px] sm:tracking-[0.14em]">
                      {isArabic
                        ? "المشاهدات"
                        : "Views"}
                    </span>

                    <span className="ms-auto shrink-0 text-sm font-light text-gold sm:text-base">
                      {views.toLocaleString(
                        isArabic
                          ? "ar-SA"
                          : "en-US",
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          },
        )}
      </div>
    </section>
  );
}
