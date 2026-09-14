import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, Clock3 } from "lucide-react";

import { getSceneCoverUrl } from "@/lib/scene/cover-fallback";
import type { ScenePublicArticle } from "@/lib/types/scene";

type Props = {
  article: ScenePublicArticle;
  locale: "ar" | "en";
  priority?: boolean;
};

const TYPE_LABELS = {
  guide: { ar: "دليل", en: "Guide" },
  help: { ar: "شرح", en: "Help" },
  industry: { ar: "الصناعة", en: "Industry" },
  story: { ar: "قصة", en: "Story" },
  report: { ar: "تقرير", en: "Report" },
  qa: { ar: "سؤال وجواب", en: "Q&A" },
} as const;

export function SceneArticleCard({ article, locale, priority = false }: Props) {
  const isArabic = locale === "ar";
  const typeLabel = TYPE_LABELS[article.contentType][locale];
  const ArrowIcon = isArabic ? ArrowUpLeft : ArrowUpRight;
  const coverUrl = getSceneCoverUrl(article);
  const isGeneratedCover = coverUrl.includes("/api/scene/cover?");

  return (
    <Link
      href={`/${locale}/scene/${article.slug}`}
      aria-label={article.title}
      className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.025] transition duration-300 hover:-translate-y-1 hover:border-gold/25 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:rounded-[1.6rem]"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.06] bg-[#101010] sm:aspect-[16/10]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={article.coverImageAlt || article.title}
          loading={priority ? "eager" : "lazy"}
          className={[
            "h-full w-full object-cover transition duration-500",
            isGeneratedCover
              ? "scale-[1.10] brightness-[1.16] contrast-[1.08] saturate-[1.08] group-hover:scale-[1.14]"
              : "group-hover:scale-[1.025]",
          ].join(" ")}
        />
        <div
          className={[
            "absolute inset-0 bg-gradient-to-t",
            isGeneratedCover
              ? "from-black/35 via-transparent to-transparent"
              : "from-black/75 via-black/5 to-black/10",
          ].join(" ")}
        />
        <span className="absolute end-3 top-3 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] text-white/75 backdrop-blur-md sm:end-4 sm:top-4 sm:px-3 sm:py-1.5">
          {typeLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="flex items-center gap-3 text-[10px] text-white/35">
          {article.readTimeMinutes ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {isArabic ? `${article.readTimeMinutes} دقائق` : `${article.readTimeMinutes} min`}
            </span>
          ) : null}
          {article.authorName ? <span>{article.authorName}</span> : null}
        </div>

        <h3 className="mt-3 text-lg font-medium leading-[1.55] text-white/95 sm:text-2xl">
          {article.title}
        </h3>
        {article.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/45 sm:mt-3 sm:line-clamp-3">{article.excerpt}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-5 text-xs text-gold sm:pt-6">
          <span>{isArabic ? "اقرأ الموضوع" : "Read article"}</span>
          <ArrowIcon className="h-4 w-4 transition group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}
