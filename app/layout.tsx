import {
  Cormorant_Garamond,
  DM_Sans,
  Noto_Sans_Arabic,
} from "next/font/google";
import type { Metadata } from "next";
import MarketingAttributionTracker from "@/components/MarketingAttributionTracker";
import { defaultLocale } from "@/lib/i18n";
import "./globals.css";

const SITE_URL = "https://mlamh.net";

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
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
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

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "MLAMH",
  alternateName: "ملامح",
  inLanguage: ["ar-SA", "en"],
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "MLAMH",
  alternateName: "ملامح",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description:
    "منصة سعودية تربط المواهب بفرص التمثيل والمودل وتساعد الشركات والوكالات وأصحاب المشاريع على اكتشاف المواهب المناسبة.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={defaultLocale}
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cormorant.variable} ${dmSans.variable} ${notoArabic.variable} h-full`}
    >
      <body className="min-h-full antialiased grain vignette">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <MarketingAttributionTracker />
        {children}
      </body>
    </html>
  );
}
