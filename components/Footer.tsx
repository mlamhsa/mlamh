import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { FooterCMS } from "@/lib/cms/FooterCMS";
import { getDictionary, type Locale } from "@/lib/i18n";
import type { PublicFooterLink } from "@/lib/types/footer";

export async function Footer({
  locale,
}: {
  locale: Locale;
}) {
  noStore();

  const dict = getDictionary(locale);
  const { footer: dictionaryFooter } = dict;

  const footer = await FooterCMS.getPublicFooter(locale);

  const isRtl = locale === "ar";

  const navigationLinks = footer.links.filter(
    (link) =>
      link.section === "platform" ||
      link.section === "talent" ||
      link.section === "publisher",
  );

  const legalLinks = footer.links.filter(
    (link) => link.section === "legal",
  );

  const socialLinks = footer.links.filter(
    (link) => link.section === "social",
  );

  return (
    <footer
      id="contact"
      dir={isRtl ? "rtl" : "ltr"}
      className="border-t border-white/10 bg-black py-16 text-white"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <div>
            <Link
              href={`/${locale}`}
              className="text-4xl font-light tracking-[0.28em]"
            >
              MLAMH
            </Link>

            {footer.description ? (
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/45">
                {footer.description}
              </p>
            ) : null}

            <p className="mt-4 text-sm text-gold/80">
              {dictionaryFooter.tagline}
            </p>
          </div>

          <div>
            <p className="arabic-safe mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              {dictionaryFooter.navigate}
            </p>

            <ul className="space-y-3">
              {navigationLinks.map((item) => (
                <FooterLinkItem
                  key={item.id}
                  item={item}
                  showArrow
                />
              ))}
            </ul>
          </div>

          <div>
            <p className="arabic-safe mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "قانوني" : "Legal"}
            </p>

            <ul className="space-y-3">
              {legalLinks.map((item) => (
                <FooterLinkItem
                  key={item.id}
                  item={item}
                />
              ))}
            </ul>
          </div>

          <div>
            {footer.showContactInfo ? (
              <>
                <p className="arabic-safe mb-5 text-xs uppercase tracking-[0.3em] text-gold">
                  {dictionaryFooter.contact}
                </p>

                <ul className="space-y-4 text-sm text-white/55">
                  {footer.email ? (
                    <li className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="shrink-0 text-gold"
                      />

                      <a
                        href={`mailto:${footer.email}`}
                        className="break-all transition hover:text-gold"
                      >
                        {footer.email}
                      </a>
                    </li>
                  ) : null}

                  {footer.phone ? (
                    <li className="flex items-center gap-3">
                      <Phone
                        size={16}
                        className="shrink-0 text-gold"
                      />

                      <a
                        href={`tel:${footer.phone}`}
                        className="transition hover:text-gold"
                      >
                        {footer.phone}
                      </a>
                    </li>
                  ) : null}

                  {footer.address ? (
                    <li className="flex items-center gap-3">
                      <MapPin
                        size={16}
                        className="shrink-0 text-gold"
                      />

                      <span>{footer.address}</span>
                    </li>
                  ) : null}
                </ul>
              </>
            ) : null}

            {footer.showSocialLinks && socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {socialLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target={
                      item.openInNewTab ? "_blank" : undefined
                    }
                    rel={
                      item.openInNewTab
                        ? "noopener noreferrer"
                        : undefined
                    }
                    aria-label={item.label}
                    title={item.label}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 px-3 text-white/50 transition hover:border-gold/40 hover:text-gold"
                  >
                    <span className="text-xs uppercase">
                      {getSocialInitials(item.label)}
                    </span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="my-12 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="arabic-safe flex flex-col items-center justify-between gap-4 text-center text-[10px] uppercase tracking-[0.25em] text-white/35 md:flex-row">
          <p>
            © {new Date().getFullYear()} MLAMH
            {footer.copyright ? ` — ${footer.copyright}` : ""}
          </p>

          <p>
            {isRtl
              ? "صُنع في المملكة العربية السعودية"
              : "Made in Saudi Arabia"}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkItem({
  item,
  showArrow = false,
}: {
  item: PublicFooterLink;
  showArrow?: boolean;
}) {
  const className =
    "inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-gold";

  if (item.href.startsWith("/")) {
    return (
      <li>
        <Link href={item.href} className={className}>
          {item.label}

          {showArrow ? <ArrowUpRight size={13} /> : null}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a
        href={item.href}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={
          item.openInNewTab
            ? "noopener noreferrer"
            : undefined
        }
        className={className}
      >
        {item.label}

        {showArrow ? <ArrowUpRight size={13} /> : null}
      </a>
    </li>
  );
}

function getSocialInitials(label: string) {
  const words = label.trim().split(/\s+/);

  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("");
  }

  return label.slice(0, 2);
}