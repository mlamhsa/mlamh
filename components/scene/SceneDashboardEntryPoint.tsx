import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText } from "lucide-react";

type SceneDashboardEntryPointProps = {
  locale: string;
  audience: "talent" | "publisher";
};

export function SceneDashboardEntryPoint({
  locale,
  audience,
}: SceneDashboardEntryPointProps) {
  const isArabic = locale !== "en";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const articleSlug =
    audience === "talent"
      ? "complete-talent-profile-and-submit-review"
      : "publisher-getting-started-mlamh";

  const title =
    audience === "talent"
      ? isArabic
        ? "طوّر ملفك من مشهد ملامح"
        : "Improve your profile with MLAMH Scene"
      : isArabic
        ? "ابدأ أسرع مع دليل الناشر"
        : "Get started faster with the publisher guide";

  const description =
    audience === "talent"
      ? isArabic
        ? "أدلة قصيرة تساعدك على إكمال الملف، فهم الكاستينغ، والاستعداد للفرص."
        : "Short guides to help you complete your profile, understand casting, and prepare for opportunities."
      : isArabic
        ? "تعرف على إعداد حساب الناشر، طلب المواهب، وإدارة التواصل داخل ملامح."
        : "Learn publisher setup, talent requests, and how to manage communication inside MLAMH.";

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="mb-5 rounded-2xl border border-gold/15 bg-gold/[0.045] p-4 sm:p-5"
      aria-label={isArabic ? "مشهد ملامح" : "MLAMH Scene"}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/20 bg-gold/[0.08] text-gold">
          <BookOpenText className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
            MLAMH SCENE
          </p>
          <h2 className="mt-1.5 text-base font-semibold text-white sm:text-lg">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/50">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/scene/${articleSlug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-gold-soft"
            >
              {isArabic ? "اقرأ الدليل" : "Read the guide"}
              <ArrowIcon className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/${locale}/scene`}
              className="inline-flex items-center rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/65 transition hover:border-gold/30 hover:text-gold"
            >
              {isArabic ? "استكشف مشهد ملامح" : "Explore MLAMH Scene"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
