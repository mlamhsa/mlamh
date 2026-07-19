import { FooterService } from "@/lib/services/FooterService";

import type {
  FooterLink,
  FooterSettings,
  FooterCMSLocale,
  PublicFooterData,
} from "@/lib/types/footer";

export class FooterCMS {
  static async getPublicFooter(
    locale: FooterCMSLocale,
  ): Promise<PublicFooterData> {
    const [settingsResult, linksResult] = await Promise.all([
      FooterService.getSettings(),
      FooterService.getLinks(),
    ]);

    if (settingsResult.error) {
      throw new Error(settingsResult.error.message);
    }

    if (linksResult.error) {
      throw new Error(linksResult.error.message);
    }

    const settings = settingsResult.data as FooterSettings;
    const links = (linksResult.data ?? []) as FooterLink[];

    const isArabic = locale === "ar";

    return {
      description:
        (isArabic
          ? settings.description_ar
          : settings.description_en) ?? "",

      email: settings.email,

      phone: settings.phone,

      address:
        (isArabic
          ? settings.address_ar
          : settings.address_en) ?? null,

      copyright:
        (isArabic
          ? settings.copyright_ar
          : settings.copyright_en) ?? "",

      showContactInfo: settings.show_contact_info,

      showSocialLinks: settings.show_social_links,

      links: links
        .filter((link) => link.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((link) => ({
          id: link.id,
          section: link.section,
          label: isArabic ? link.label_ar : link.label_en,
          href: this.localizeHref(link.href, locale),
          sortOrder: link.sort_order,
          openInNewTab: link.open_in_new_tab,
        })),
    };
  }

  private static localizeHref(
    href: string,
    locale: FooterCMSLocale,
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
      href.startsWith("/ar/") ||
      href.startsWith("/en/") ||
      href === "/ar" ||
      href === "/en"
    ) {
      return href;
    }

    const normalizedHref = href.startsWith("/")
      ? href
      : `/${href}`;

    return `/${locale}${normalizedHref}`;
  }
}