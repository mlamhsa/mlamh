import type { NextConfig } from "next";

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