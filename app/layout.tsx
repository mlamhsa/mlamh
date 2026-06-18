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
  subsets: ["arabic"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mlamh.live"),
  title: "MALAMIH — Casting & Talents",
  description:
    "منصة سعودية لاكتشاف الوجوه والمواهب المناسبة للإعلانات، الإنتاج، والمحتوى.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "MALAMIH — Casting & Talents",
    description:
      "منصة سعودية لاكتشاف الوجوه والمواهب المناسبة للإعلانات، الإنتاج، والمحتوى.",
    url: "https://mlamh.live",
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
      "منصة سعودية لاكتشاف الوجوه والمواهب المناسبة للإعلانات، الإنتاج، والمحتوى.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      dir="rtl"
      suppressHydrationWarning
      className={`${cormorant.variable} ${dmSans.variable} ${notoArabic.variable} h-full`}
    >
      <body className="min-h-full antialiased grain vignette">{children}</body>
    </html>
  );
}