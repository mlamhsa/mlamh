import Link from "next/link";
import {
  Headphones,
  MapPin,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";

export function MobileFooter({
  locale,
}: {
  locale: Locale;
}) {
  const isArabic = locale === "ar";

  const platformLinks = [
    {
      label: isArabic ? "المواهب" : "Talents",
      href: `/${locale}/talent`,
    },
    {
      label: isArabic ? "الفرص" : "Opportunities",
      href: `/${locale}/opportunities`,
    },
    {
      label: isArabic ? "إدارة الكاستينغ" : "Managed Casting",
      href: `/${locale}/casting`,
    },
    {
      label: isArabic ? "الجهات" : "Organizations",
      href: `/${locale}/publishers`,
    },
    {
      label: isArabic ? "إنشاء حساب" : "Create account",
      href: `/${locale}/join`,
    },
  ];

  const legalLinks = [
    {
      label: isArabic ? "سياسة الخصوصية" : "Privacy Policy",
      href: `/${locale}/privacy`,
    },
    {
      label: isArabic ? "الشروط والأحكام" : "Terms & Conditions",
      href: `/${locale}/terms`,
    },
    {
      label: isArabic ? "سياسة الاسترجاع" : "Refund Policy",
      href: `/${locale}/refund-policy`,
    },
    {
      label: isArabic ? "الشكاوى والمقترحات" : "Complaints & Feedback",
      href: `/${locale}/complaints`,
    },
  ];

  return (
    <footer
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/[0.07] bg-black px-4 pb-14 pt-8 text-white"
    >
      <div className="pointer-events-none absolute -end-24 top-0 h-52 w-52 rounded-full bg-gold/[0.025] blur-[100px]" />

      <div className="relative">
        <div>
          <Link
            href={`/${locale}`}
            className="inline-block text-[1.7rem] font-light tracking-[0.2em] text-white"
          >
            MLAMH
          </Link>

          <p className="mt-2.5 max-w-[19rem] text-[13px] leading-6 text-white/35">
            {isArabic
              ? "منصة تجمع المواهب والفرص والجهات الإبداعية في مكان واحد."
              : "One platform connecting talent, opportunities, and creative organizations."}
          </p>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-white/25">
            <MapPin
              size={13}
              strokeWidth={1.7}
              className="text-gold/60"
            />
            <span>{isArabic ? "المملكة العربية السعودية" : "Saudi Arabia"}</span>
          </div>
        </div>

        <div className="mb-8 mt-6 h-px bg-white/[0.07]" />

        <div className="grid grid-cols-2 gap-x-10">
          <div>
            <p className="mb-4 text-[11px] font-medium text-gold/75">
              {isArabic ? "المنصة" : "PLATFORM"}
            </p>
            <div className="space-y-3.5">
              {platformLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-[13px] leading-5 text-white/45 transition active:text-gold"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-medium text-gold/75">
              {isArabic ? "قانوني" : "LEGAL"}
            </p>
            <div className="space-y-3.5">
              {legalLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-[13px] leading-5 text-white/45 transition active:text-gold"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-white/[0.07] pt-5">
          <p className="mb-3 text-[11px] font-medium text-gold/75">
            {isArabic ? "الدعم" : "SUPPORT"}
          </p>

          <Link
            href={`/${locale}/contact`}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 transition active:border-gold/30 active:bg-gold/[0.05]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.07] text-gold">
              <Headphones size={17} strokeWidth={1.7} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-white/65">
                {isArabic ? "الدعم والتواصل" : "Support & Contact"}
              </span>
              <span className="mt-0.5 block text-[10px] leading-5 text-white/30">
                {isArabic
                  ? "المساعدة والاستفسارات والشراكات"
                  : "Help, inquiries, and partnerships"}
              </span>
            </span>
          </Link>
        </div>

        <div className="mt-6 border-t border-white/[0.07] pt-5">
          <p className="text-[10px] text-white/22">
            © {new Date().getFullYear()} MLAMH
          </p>
          <p className="mt-1 text-[10px] text-white/16">
            {isArabic ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>
    </footer>
  );
}
