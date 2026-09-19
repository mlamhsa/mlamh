import {
  Cormorant_Garamond,
  DM_Sans,
  Noto_Sans_Arabic,
} from "next/font/google";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import GlobalInteractionFeedback from "@/components/GlobalInteractionFeedback";
import MarketingAttributionTracker from "@/components/MarketingAttributionTracker";
import { FeedbackProvider } from "@/components/ui/FeedbackProvider";
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
    default: "ملامح MLAMH | منصة المواهب والكاستينغ في السعودية",
    template: "%s",
  },
  description:
    "ملامح منصة سعودية تربط المواهب بالمشاريع والفرص المهنية في التمثيل والمودل، وتساعد الشركات والوكالات على اكتشاف المواهب المناسبة.",
  applicationName: "ملامح | MLAMH",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "ملامح MLAMH | منصة المواهب والكاستينغ في السعودية",
    description:
      "اكتشف المواهب وفرص التمثيل والمودل، وتواصل مع الشركات والوكالات وأصحاب المشاريع عبر ملامح.",
    url: SITE_URL,
    siteName: "ملامح | MLAMH",
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
    title: "ملامح MLAMH | منصة المواهب والكاستينغ في السعودية",
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
  name: "ملامح",
  alternateName: ["MLAMH", "ملامح MLAMH"],
  inLanguage: ["ar-SA", "en"],
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "ملامح",
  alternateName: ["MLAMH", "ملامح MLAMH"],
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description:
    "ملامح (MLAMH) منصة سعودية للمواهب والكاستينغ تربط الممثلين والمودلز بالفرص وتساعد الشركات والوكالات وأصحاب المشاريع على نشر الفرص واكتشاف المواهب المناسبة.",
  brand: {
    "@type": "Brand",
    name: "ملامح",
    alternateName: "MLAMH",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
  },
  knowsAbout: [
    "المواهب",
    "الكاستينغ",
    "التمثيل",
    "المودلز",
    "فرص التمثيل",
    "Casting",
    "Actors",
    "Models",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-mlamh-locale") === "en" ? "en" : "ar";

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
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
        <FeedbackProvider>
          <MarketingAttributionTracker />
          <Suspense fallback={null}>
            <GlobalInteractionFeedback />
          </Suspense>
          {children}
        </FeedbackProvider>
      </body>
    </html>
  );
}
