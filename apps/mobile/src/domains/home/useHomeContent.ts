import { useEffect, useState } from "react";

import { getMobileHome } from "@/src/domains/home/api";
import type { MobileHomeHero, MobileHomeValueProp } from "@/src/domains/home/types";
import type { AppLocale } from "@/src/i18n/locale";


function getFallbackHomeContent(locale: AppLocale) {
  const isArabic = locale === "ar";
  const hero: MobileHomeHero = {
    eyebrow: isArabic ? "منصة المواهب والفرص الإبداعية" : "Creative Talent Ecosystem",
    titleLine1: isArabic ? "اكتشف المواهب المناسبة" : "Discover the right talent",
    titleLine2: isArabic ? "واصنع فرصتك القادمة." : "and create what’s next.",
    description: isArabic
      ? "ملامح تربط المواهب، الشركات، والفرص الإبداعية في تجربة واحدة راقية وموثوقة."
      : "MLAMH connects talents, companies, and creative opportunities through one premium, trusted experience.",
    primaryCtaLabel: isArabic ? "ابدأ الآن" : "Get Started",
    primaryCtaHref: "/account-type",
    secondaryCtaLabel: isArabic ? "استعرض الفرص" : "Browse Opportunities",
    secondaryCtaHref: "/opportunities",
  };
  const valueProps: MobileHomeValueProp[] = [
    { id: -1, iconKey: "shield", title: isArabic ? "جودة احترافية" : "Professional Quality", description: isArabic ? "منصة تربط أفضل المواهب بالفرص المناسبة." : "A platform connecting the best talents with the right opportunities." },
    { id: -2, iconKey: "globe", title: isArabic ? "انتشار عالمي" : "Global Reach", description: isArabic ? "الوصول إلى ناشرين وعملاء من مختلف أنحاء العالم." : "Reach publishers and clients from around the world." },
    { id: -3, iconKey: "zap", title: isArabic ? "فرص أسرع" : "Faster Opportunities", description: isArabic ? "اكتشف الفرص وتقدم لها بسهولة." : "Discover and apply for opportunities quickly." },
  ];
  return { hero, valueProps };
}

type HomeContentState = {
  hero: MobileHomeHero | null;
  valueProps: MobileHomeValueProp[];
  loading: boolean;
  error: boolean;
};

export function useHomeContent(locale: AppLocale): HomeContentState {
  const [state, setState] = useState<HomeContentState>({
    hero: null,
    valueProps: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: false }));

    void getMobileHome(locale)
      .then((result) => {
        if (!active) return;
        const fallback = getFallbackHomeContent(locale);
        if (!result.ok) {
          setState({ ...fallback, loading: false, error: true });
          return;
        }
        setState({
          hero: {
            eyebrow: result.hero.eyebrow || fallback.hero.eyebrow,
            titleLine1: result.hero.titleLine1 || fallback.hero.titleLine1,
            titleLine2: result.hero.titleLine2 || fallback.hero.titleLine2,
            description: result.hero.description || fallback.hero.description,
            primaryCtaLabel: result.hero.primaryCtaLabel || fallback.hero.primaryCtaLabel,
            primaryCtaHref: result.hero.primaryCtaHref || fallback.hero.primaryCtaHref,
            secondaryCtaLabel: result.hero.secondaryCtaLabel || fallback.hero.secondaryCtaLabel,
            secondaryCtaHref: result.hero.secondaryCtaHref || fallback.hero.secondaryCtaHref,
          },
          valueProps: result.valueProps.length > 0 ? result.valueProps : fallback.valueProps,
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (active) {
          setState({ ...getFallbackHomeContent(locale), loading: false, error: true });
        }
      });

    return () => {
      active = false;
    };
  }, [locale]);

  return state;
}
