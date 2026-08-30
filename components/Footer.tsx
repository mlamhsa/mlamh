import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Headphones, MapPin } from "lucide-react";

import { FooterCMS } from "@/lib/cms/FooterCMS";
import { getDictionary, type Locale } from "@/lib/i18n";

export async function Footer({
  locale,
}: {
  locale: Locale;
}) {
  noStore();

  const dict = getDictionary(locale);
  const footer = await FooterCMS.getPublicFooter(locale);
  const isRtl = locale === "ar";
  const socialLinks = footer.links.filter((link) => link.section === "social");

  const platformLinks = [
    {
      label: isRtl ? "المواهب" : "Talents",
      href: `/${locale}/talent`,
    },
    {
      label: isRtl ? "الفرص" : "Opportunities",
      href: `/${locale}/opportunities`,
    },
    {
      label: isRtl ? "الجهات" : "Organizations",
      href: `/${locale}/publishers`,
    },
    {
      label: isRtl ? "إنشاء حساب" : "Create account",
      href: `/${locale}/join`,
    },
  ];

  const legalLinks = [
    {
      label: isRtl ? "سياسة الخصوصية" : "Privacy Policy",
      href: `/${locale}/privacy`,
    },
    {
      label: isRtl ? "الشروط والأحكام" : "Terms & Conditions",
      href: `/${locale}/terms`,
    },
    {
      label: isRtl ? "سياسة الاسترجاع" : "Refund Policy",
      href: `/${locale}/refund-policy`,
    },
  ];

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
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:gap-12">
          <div className="max-w-md sm:col-span-2 lg:col-span-1">
            <Link
              href={`/${locale}`}
              className="inline-flex text-4xl font-light tracking-[0.24em] text-white transition hover:text-gold"
            >
              MLAMH
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/45">
              {isRtl
                ? "منصة تجمع المواهب والفرص والجهات الإبداعية في مكان واحد."
                : "One platform connecting talent, opportunities, and creative organizations."}
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm text-white/35">
              <MapPin size={16} strokeWidth={1.7} className="shrink-0 text-gold/70" />
              <span>{isRtl ? "المملكة العربية السعودية" : "Saudi Arabia"}</span>
            </div>
          </div>

          <FooterColumn
            title={isRtl ? "المنصة" : "Platform"}
            links={platformLinks}
            isRtl={isRtl}
          />

          <FooterColumn
            title={isRtl ? "قانوني" : "Legal"}
            links={legalLinks}
            isRtl={isRtl}
          />

          <div>
            <p
              className={`mb-5 text-xs text-gold ${
                isRtl ? "tracking-normal" : "uppercase tracking-[0.3em]"
              }`}
            >
              {isRtl ? "الدعم" : "Support"}
            </p>

            <Link
              href={`/${locale}/contact`}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-white/65 transition hover:border-gold/30 hover:bg-gold/[0.05] hover:text-gold"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.07] text-gold">
                <Headphones size={17} />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">
                  {isRtl ? "الدعم والتواصل" : "Support & Contact"}
                </span>
                <span className="mt-1 block text-xs text-white/35 transition group-hover:text-white/50">
                  {isRtl ? "الاستفسارات والمساعدة والشراكات" : "Help, inquiries, and partnerships"}
                </span>
              </span>
            </Link>

            {footer.showSocialLinks && socialLinks.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    aria-label={item.label}
                    title={item.label}
                    className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] px-3 text-white/45 transition hover:border-gold/40 hover:bg-gold/[0.05] hover:text-gold"
                  >
                    <span className="text-[10px] uppercase">{getSocialInitials(item.label)}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent md:my-12" />

        <div
          className={`flex flex-col items-center justify-between gap-4 text-center text-[10px] text-white/30 md:flex-row ${
            isRtl ? "tracking-normal" : "uppercase tracking-[0.22em]"
          }`}
        >
          <p>
            © {new Date().getFullYear()} MLAMH
            {footer.copyright ? ` — ${footer.copyright}` : ""}
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

function FooterColumn({
  title,
  links,
  isRtl,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  isRtl: boolean;
}) {
  return (
    <div>
      <p
        className={`mb-5 text-xs text-gold ${
          isRtl ? "tracking-normal" : "uppercase tracking-[0.3em]"
        }`}
      >
        {title}
      </p>

      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-white/50 transition hover:text-gold"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
