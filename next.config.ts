import type { NextConfig } from "next";

const retiredOpportunitySlugs = [
  "test-1780463053863",
  "test-1780494559421",
  "test-demo-1780543952184",
  "تست-2026-1782710480805",
  "تست-اسامه-1783103663195",
  "مطلوب-مودل-تجربة-1781963277583",
  "خسسسسسسسسسسسسسسس-1780795863810",
  "تجربة-2026-1784649197172",
  "تجربة-الفرصة-1785628607242",
  "تجربة-جديدة-0-1787704036469",
  "تجربة-اعلان-تتتت-1787704697464",
  "تجربة-1788072689558",
] as const;

const nextConfig: NextConfig = {
  /**
   * السماح بفتح بيئة التطوير من الجوال عبر الشبكة المحلية.
   * هذا الإعداد خاص بالتطوير ولا يغيّر إعدادات الإنتاج.
   */
  allowedDevOrigins: ["192.168.100.24"],

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  async redirects() {
    return retiredOpportunitySlugs.flatMap((slug) =>
      ["ar", "en"].map((locale) => ({
        source: `/${locale}/opportunities/${slug}`,
        destination: `/${locale}/opportunities`,
        permanent: true,
      })),
    );
  },

  images: {
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;