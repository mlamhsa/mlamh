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
        className="mb-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
      >
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 text-white/30">
            <BarChart3
              aria-hidden="true"
              className="h-5 w-5"
            />
          </span>

          <h2 className="mt-4 text-base font-medium text-white/75">
            {dictionary.talents.topViewed}
          </h2>

          <p className="mt-2 max-w-md text-sm leading-7 text-white/35">
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
      className="mb-8 min-w-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-gold">
            <BarChart3
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
            />

            <p className="text-[10px] uppercase tracking-[0.3em]">
              {isArabic
                ? "التحليلات"
                : "Analytics"}
            </p>
          </div>

          <h2
            id="top-viewed-talents-title"
            className="mt-2 text-xl font-light text-white sm:text-2xl"
          >
            {dictionary.talents.topViewed}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/35">
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
          className="inline-flex min-h-10 w-fit shrink-0 items-center justify-center rounded-xl border border-white/[0.08] px-4 text-xs text-white/50 transition hover:border-gold/25 hover:text-gold"
        >
          {isArabic
            ? "عرض التحليلات"
            : "View analytics"}
        </Link>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                className="group min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20 transition hover:-translate-y-0.5 hover:border-gold/25 hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                  {talent.image_url ? (
                    <Image
                      src={talent.image_url}
                      alt={
                        isArabic
                          ? `صورة ${primaryName}`
                          : `${primaryName} profile image`
                      }
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 220px"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20">
                      <ImageOff
                        aria-hidden="true"
                        className="h-7 w-7"
                      />
                    </div>
                  )}

                  <span className="absolute start-3 top-3 rounded-full border border-gold/25 bg-black/70 px-2.5 py-1 text-[10px] text-gold backdrop-blur">
                    #{index + 1}
                  </span>
                </div>

                <div className="min-w-0 p-4">
                  <h3 className="truncate text-sm font-medium text-white">
                    {primaryName}
                  </h3>

                  {secondaryName ? (
                    <p
                      dir={
                        isArabic
                          ? "ltr"
                          : "rtl"
                      }
                      className="mt-1 truncate text-xs text-white/35"
                    >
                      {secondaryName}
                    </p>
                  ) : (
                    <div className="mt-1 h-4" />
                  )}

                  <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-white/[0.07] pt-3">
                    <Eye
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-gold"
                    />

                    <span className="truncate text-[10px] uppercase tracking-[0.14em] text-white/35">
                      {isArabic
                        ? "المشاهدات"
                        : "Views"}
                    </span>

                    <span className="ms-auto shrink-0 text-base font-light text-gold">
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