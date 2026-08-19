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

  const cleanEmail =
    footer.email?.trim() &&
    footer.email.trim() !== "-"
      ? footer.email.trim()
      : null;

  const cleanPhone =
    footer.phone?.trim() &&
    footer.phone.trim() !== "0" &&
    footer.phone.trim() !== "-"
      ? footer.phone.trim()
      : null;

  const cleanAddress =
    footer.address?.trim() &&
    footer.address.trim() !== "-"
      ? footer.address.trim()
      : null;

  const hasContactInfo =
    Boolean(cleanEmail) ||
    Boolean(cleanPhone) ||
    Boolean(cleanAddress);

  return (
    <footer
      id="contact"
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/[0.07] bg-black py-16 text-white md:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,169,106,0.06),transparent_34%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          {/* Brand */}
          <div className="max-w-md">
            <Link
              href={`/${locale}`}
              className="inline-flex text-4xl font-light tracking-[0.24em] text-white transition hover:text-gold"
            >
              MLAMH
            </Link>

            {footer.description ? (
              <p className="mt-5 text-sm leading-7 text-white/45">
                {footer.description}
              </p>
            ) : null}

            <p className="mt-4 text-sm text-gold/80">
              {dictionaryFooter.tagline}
            </p>

            <div className="mt-7 flex flex-wrap gap-2 text-[10px] text-white/25">
              <span>
                {isRtl ? "مواهب" : "Talent"}
              </span>

              <span>•</span>

              <span>
                {isRtl ? "جهات" : "Organizations"}
              </span>

              <span>•</span>

              <span>
                {isRtl ? "فرص" : "Opportunities"}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p
              className={[
                "mb-5 text-xs text-gold",
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.3em]",
              ].join(" ")}
            >
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

          {/* Legal */}
          <div>
            <p
              className={[
                "mb-5 text-xs text-gold",
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.3em]",
              ].join(" ")}
            >
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

          {/* Contact / Social */}
          <div>
            {footer.showContactInfo && hasContactInfo ? (
              <>
                <p
                  className={[
                    "mb-5 text-xs text-gold",
                    isRtl
                      ? "tracking-normal"
                      : "uppercase tracking-[0.3em]",
                  ].join(" ")}
                >
                  {dictionaryFooter.contact}
                </p>

                <ul className="space-y-4 text-sm text-white/55">
                  {cleanEmail ? (
                    <li className="flex items-start gap-3">
                      <Mail
                        size={16}
                        className="mt-0.5 shrink-0 text-gold"
                      />

                      <a
                        href={`mailto:${cleanEmail}`}
                        className="break-all transition hover:text-gold"
                      >
                        {cleanEmail}
                      </a>
                    </li>
                  ) : null}

                  {cleanPhone ? (
                    <li className="flex items-start gap-3">
                      <Phone
                        size={16}
                        className="mt-0.5 shrink-0 text-gold"
                      />

                      <a
                        href={`tel:${cleanPhone}`}
                        className="transition hover:text-gold"
                      >
                        {cleanPhone}
                      </a>
                    </li>
                  ) : null}

                  {cleanAddress ? (
                    <li className="flex items-start gap-3">
                      <MapPin
                        size={16}
                        className="mt-0.5 shrink-0 text-gold"
                      />

                      <span className="leading-6">
                        {cleanAddress}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </>
            ) : (
              <div>
                <p
                  className={[
                    "mb-5 text-xs text-gold",
                    isRtl
                      ? "tracking-normal"
                      : "uppercase tracking-[0.3em]",
                  ].join(" ")}
                >
                  {isRtl ? "ملامح" : "MLAMH"}
                </p>

                <p className="max-w-xs text-sm leading-7 text-white/40">
                  {isRtl
                    ? "منصة تجمع المواهب والجهات والفرص في تجربة احترافية واحدة."
                    : "A platform connecting talent, organizations, and opportunities in one professional experience."}
                </p>
              </div>
            )}

            {footer.showSocialLinks &&
            socialLinks.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {socialLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target={
                      item.openInNewTab
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      item.openInNewTab
                        ? "noopener noreferrer"
                        : undefined
                    }
                    aria-label={item.label}
                    title={item.label}
                    className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] px-3 text-white/45 transition hover:border-gold/40 hover:bg-gold/[0.05] hover:text-gold"
                  >
                    <span className="text-[10px] uppercase">
                      {getSocialInitials(item.label)}
                    </span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent md:my-12" />

        <div
          className={[
            "flex flex-col items-center justify-between gap-4 text-center text-[10px] text-white/30 md:flex-row",
            isRtl
              ? "tracking-normal"
              : "uppercase tracking-[0.22em]",
          ].join(" ")}
        >
          <p>
            © {new Date().getFullYear()} MLAMH
            {footer.copyright
              ? ` — ${footer.copyright}`
              : ""}
          </p>

          <p>
            {isRtl
              ? "منصة سعودية للمواهب والفرص الإبداعية"
              : "A Saudi platform for talent and creative opportunities"}
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
    "inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-gold";

  if (item.href.startsWith("/")) {
    return (
      <li>
        <Link
          href={item.href}
          className={className}
        >
          {item.label}

          {showArrow ? (
            <ArrowUpRight size={13} />
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a
        href={item.href}
        target={
          item.openInNewTab
            ? "_blank"
            : undefined
        }
        rel={
          item.openInNewTab
            ? "noopener noreferrer"
            : undefined
        }
        className={className}
      >
        {item.label}

        {showArrow ? (
          <ArrowUpRight size={13} />
        ) : null}
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