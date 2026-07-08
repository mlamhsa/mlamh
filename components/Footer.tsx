import Link from "next/link";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const { footer: f } = dict;
  const isRtl = locale === "ar";

  const links = [
    { label: isRtl ? "المواهب" : "Talents", href: `/${locale}/talent` },
    { label: isRtl ? "الفرص" : "Opportunities", href: `/${locale}/opportunities` },
    { label: isRtl ? "الشركات" : "Companies", href: `/${locale}/publishers` },
    { label: isRtl ? "انضم الآن" : "Join", href: `/${locale}/join` },
  ];

  const legal = [
    { label: f.privacy, href: `/${locale}/privacy` },
    { label: f.terms, href: `/${locale}/terms` },
  ];

  return (
    <footer
      id="contact"
      dir={isRtl ? "rtl" : "ltr"}
      className="border-t border-white/10 bg-black py-16 text-white"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr_0.75fr_1fr]">
          <div>
            <Link href={`/${locale}`} className="text-4xl font-light tracking-[0.28em]">
              MLAMH
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/45">
              {f.description}
            </p>

            <p className="mt-4 text-sm text-gold/80">
              {f.tagline}
            </p>
          </div>

          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              {f.navigate}
            </p>

            <ul className="space-y-3">
              {links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-gold"
                  >
                    {item.label}
                    <ArrowUpRight size={13} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              {isRtl ? "قانوني" : "Legal"}
            </p>

            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/55 transition hover:text-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-gold">
              {f.contact}
            </p>

            <ul className="space-y-4 text-sm text-white/55">
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-gold" />
                <a href="mailto:hello@mlamh.com" className="hover:text-gold">
                  hello@mlamh.com
                </a>
              </li>

              <li className="flex items-center gap-3">
                <Phone size={16} className="text-gold" />
                <span>{f.phone}</span>
              </li>

              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-gold" />
                <span>{f.location}</span>
              </li>
            </ul>

            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="rounded-full border border-white/10 p-3 text-white/50 transition hover:border-gold/40 hover:text-gold"
                aria-label="Instagram"
              >
                <span className="text-xs">IG</span>
              </a>

              <a
                href="#"
                className="rounded-full border border-white/10 p-3 text-white/50 transition hover:border-gold/40 hover:text-gold"
                aria-label="LinkedIn"
              >
                <span className="text-xs">IN</span>
              </a>
            </div>
          </div>
        </div>

        <div className="my-12 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="flex flex-col items-center justify-between gap-4 text-center text-[10px] uppercase tracking-[0.25em] text-white/35 md:flex-row">
          <p>
            © {new Date().getFullYear()} MLAMH. {f.rights}
          </p>

          <p>{isRtl ? "صُنع في المملكة العربية السعودية" : "Made in Saudi Arabia"}</p>
        </div>
      </div>
    </footer>
  );
}