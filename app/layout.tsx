import {
  Cormorant_Garamond,
  DM_Sans,
  Noto_Sans_Arabic,
} from "next/font/google";
import type { Metadata } from "next";
import MarketingAttributionTracker from "@/components/MarketingAttributionTracker";
import TikTokPixel from "@/components/TikTokPixel";
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

  title: {
    default: "MLAMH | ملامح — منصة المواهب والفرص",
    template: "%s",
  },

  description:
    "ملامح منصة سعودية تربط المواهب بالمشاريع والفرص المهنية في التمثيل والمودل، وتساعد الشركات والوكالات على اكتشاف المواهب المناسبة.",

  applicationName: "MLAMH",

  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },

  openGraph: {
    title: "MLAMH | ملامح — منصة المواهب والفرص",
    description:
      "اكتشف المواهب وفرص التمثيل والمودل، وتواصل مع الشركات والوكالات وأصحاب المشاريع عبر ملامح.",
    url: "https://mlamh.net",
    siteName: "MLAMH | ملامح",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MLAMH | ملامح",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MLAMH | ملامح — منصة المواهب والفرص",
    description:
      "منصة تربط المواهب بالفرص والشركات والوكالات وأصحاب المشاريع.",
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
        <MarketingAttributionTracker />
        <TikTokPixel />
        {children}
      </body>
    </html>
  );
}
