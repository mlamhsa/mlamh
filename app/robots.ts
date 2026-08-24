import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/auth",
          "/talent-dashboard",
          "/publisher-dashboard",
          "/ar/talent-dashboard",
          "/en/talent-dashboard",
          "/ar/publisher-dashboard",
          "/en/publisher-dashboard",
          "/ar/login",
          "/en/login",
          "/ar/join",
          "/en/join",
        ],
      },
    ],

    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}