import { HomepageService } from "@/lib/services/HomepageService";

import type {
  HomepageCMSLocale,
  HomepageHero,
  HomepageHeroCard,
  PublicHomepageHero,
} from "@/lib/types/homepage";

export class HomepageCMS {
  static async getPublicHero(
    locale: HomepageCMSLocale,
  ): Promise<PublicHomepageHero> {
    const [heroResult, cardsResult] = await Promise.all([
      HomepageService.getHero(),
      HomepageService.getHeroCards(),
    ]);

    if (heroResult.error) {
      throw new Error(heroResult.error.message);
    }

    if (cardsResult.error) {
      throw new Error(cardsResult.error.message);
    }

    if (!heroResult.data) {
      throw new Error("Homepage hero content was not found.");
    }

    const hero = heroResult.data as HomepageHero;
    const cards = (cardsResult.data ?? []) as HomepageHeroCard[];
    const isArabic = locale === "ar";

    return {
      eyebrow:
        (isArabic ? hero.eyebrow_ar : hero.eyebrow_en) ?? "",

      titleLine1:
        (isArabic
          ? hero.title_line_1_ar
          : hero.title_line_1_en) ?? "",

      titleLine2:
        (isArabic
          ? hero.title_line_2_ar
          : hero.title_line_2_en) ?? "",

      description:
        (isArabic
          ? hero.description_ar
          : hero.description_en) ?? "",

      primaryCtaLabel:
        (isArabic
          ? hero.primary_cta_label_ar
          : hero.primary_cta_label_en) ?? "",

      primaryCtaHref: this.localizeHref(
        hero.primary_cta_href,
        locale,
      ),

      secondaryCtaLabel:
        (isArabic
          ? hero.secondary_cta_label_ar
          : hero.secondary_cta_label_en) ?? "",

      secondaryCtaHref: this.localizeHref(
        hero.secondary_cta_href,
        locale,
      ),

      cards: cards
        .filter((card) => card.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((card) => ({
          id: card.id,
          iconKey: card.icon_key,
          title: isArabic ? card.title_ar : card.title_en,
          description: isArabic
            ? card.description_ar
            : card.description_en,
          sortOrder: card.sort_order,
        })),

      stats: [
        {
          value: hero.stat_1_value ?? "",
          label:
            (isArabic
              ? hero.stat_1_label_ar
              : hero.stat_1_label_en) ?? "",
        },
        {
          value: hero.stat_2_value ?? "",
          label:
            (isArabic
              ? hero.stat_2_label_ar
              : hero.stat_2_label_en) ?? "",
        },
        {
          value: hero.stat_3_value ?? "",
          label:
            (isArabic
              ? hero.stat_3_label_ar
              : hero.stat_3_label_en) ?? "",
        },
      ],
    };
  }

  private static localizeHref(
    href: string,
    locale: HomepageCMSLocale,
  ) {
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#")
    ) {
      return href;
    }

    if (href === "/") {
      return `/${locale}`;
    }

    if (
      href === "/ar" ||
      href === "/en" ||
      href.startsWith("/ar/") ||
      href.startsWith("/en/")
    ) {
      return href;
    }

    const normalizedHref = href.startsWith("/")
      ? href
      : `/${href}`;

    return `/${locale}${normalizedHref}`;
  }
}