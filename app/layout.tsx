import {
  Cormorant_Garamond,
  DM_Sans,
  Noto_Sans_Arabic,
} from "next/font/google";
import type { Metadata } from "next";
import { defaultLocale } from "@/lib/i18n";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"], // ✅ FIXED
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mlamh.net"),
  title: "MALAMIH — Casting & Talents",
  description:
    "منصة سعودية تربط المواهب والوجوه بالفرص والشركات والوكالات.",

  openGraph: {
    title: "MALAMIH — Casting & Talents",
    description:
      "منصة سعودية تربط المواهب والوجوه بالفرص والشركات والوكالات.",
    url: "https://mlamh.net",
    siteName: "MALAMIH",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MALAMIH — Casting & Talents",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MALAMIH — Casting & Talents",
    description:
      "منصة سعودية تربط المواهب والوجوه بالفرص والشركات والوكالات.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={defaultLocale}
      dir="rtl" // 👈 خليه ثابت هنا أو خليه من [locale] لاحقًا
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cormorant.variable} ${dmSans.variable} ${notoArabic.variable} h-full`}
    >
      <body className="min-h-full antialiased grain vignette">
        {children}
      </body>
    </html>
  );
}