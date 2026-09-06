import { createElement } from "react";
import { ImageResponse } from "next/og";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function hasArabic(value: string) {
  return /[\u0600-\u06FF]/.test(value);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dimensions(aspectRatio: string | null, contentType: string | null) {
  const ratio = (aspectRatio ?? "").toLowerCase();
  const type = (contentType ?? "").toLowerCase();
  if (ratio === "9:16" || type === "story" || type === "reel" || type === "video") {
    return { width: 1080, height: 1920 };
  }
  if (ratio === "1.91:1" || ratio === "1200:630") return { width: 1200, height: 630 };
  return { width: 1080, height: 1080 };
}

function arabicSocialSvg(hook: string, width: number, height: number) {
  const vertical = height > width;
  const safeHook = escapeXml(hook || "فرصتك القادمة تبدأ من هنا");
  const centerY = vertical ? Math.round(height * 0.52) : Math.round(height * 0.50);
  const logoWidth = vertical ? 500 : 430;
  const logoHeight = vertical ? 270 : 230;
  const hookSize = vertical ? 76 : Math.max(54, Math.round(width * 0.06));
  const domainY = height - (vertical ? 125 : 82);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="78%" r="66%">
      <stop offset="0%" stop-color="#8C6A2D" stop-opacity="0.42"/>
      <stop offset="45%" stop-color="#2E2E2E" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#121212" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" x2="1">
      <stop offset="0%" stop-color="#8C6A2D"/>
      <stop offset="48%" stop-color="#D4A017"/>
      <stop offset="100%" stop-color="#F0D089"/>
    </linearGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#171717"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <path d="M 0 ${Math.round(height * 0.12)} C ${Math.round(width * 0.23)} ${Math.round(height * 0.23)}, ${Math.round(width * 0.22)} ${Math.round(height * 0.68)}, 0 ${Math.round(height * 0.82)}" fill="none" stroke="#8C6A2D" stroke-width="2" opacity="0.62"/>
  <path d="M ${width} ${Math.round(height * 0.48)} C ${Math.round(width * 0.80)} ${Math.round(height * 0.56)}, ${Math.round(width * 0.82)} ${Math.round(height * 0.82)}, ${width} ${Math.round(height * 0.90)}" fill="none" stroke="#D4A017" stroke-width="2" opacity="0.68"/>
  <line x1="${Math.round(width * 0.78)}" y1="${vertical ? 110 : 72}" x2="${Math.round(width * 0.91)}" y2="${vertical ? 110 : 72}" stroke="url(#gold)" stroke-width="7" stroke-linecap="round"/>
  <image href="https://mlamh.net/logo.ar.png" x="${Math.round((width - logoWidth) / 2)}" y="${vertical ? 205 : 105}" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet"/>
  <text x="50%" y="${centerY}" dominant-baseline="middle" text-anchor="middle" direction="rtl" unicode-bidi="plaintext" fill="#F5F1E8" font-family="Arial, sans-serif" font-size="${hookSize}" font-weight="700">${safeHook}</text>
  <line x1="${Math.round(width * 0.43)}" y1="${centerY + (vertical ? 105 : 86)}" x2="${Math.round(width * 0.57)}" y2="${centerY + (vertical ? 105 : 86)}" stroke="url(#gold)" stroke-width="7" stroke-linecap="round" filter="url(#softGlow)"/>
  <ellipse cx="50%" cy="${Math.round(height * 0.79)}" rx="${Math.round(width * 0.34)}" ry="${vertical ? 62 : 44}" fill="#111" stroke="#8C6A2D" stroke-width="2" opacity="0.96"/>
  <ellipse cx="50%" cy="${Math.round(height * 0.79)}" rx="${Math.round(width * 0.31)}" ry="${vertical ? 38 : 28}" fill="#D4A017" opacity="0.08" filter="url(#softGlow)"/>
  <text x="50%" y="${domainY}" text-anchor="middle" fill="#D4A017" font-family="Arial, sans-serif" font-size="${vertical ? 38 : 30}" font-weight="700" letter-spacing="2">mlamh.net</text>
</svg>`;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const creativeId = Number(id);
  if (!Number.isInteger(creativeId) || creativeId <= 0) {
    return new Response("Invalid creative id", { status: 400 });
  }

  const db = createAdminClient();
  const { data: creative, error } = await db
    .from("marketing_creatives")
    .select("id,content_id,platform,aspect_ratio,status")
    .eq("id", creativeId)
    .maybeSingle();
  if (error || !creative?.content_id) return new Response("Creative not found", { status: 404 });

  const { data: content } = await db
    .from("marketing_content")
    .select("title,hook,cta,content_type,channel")
    .eq("id", creative.content_id)
    .maybeSingle();
  if (!content) return new Response("Creative content not found", { status: 404 });

  const title = text(content.hook) || text(content.title) || "MLAMH";
  const cta = text(content.cta) || "Discover opportunities on mlamh.net";
  const platform = text(creative.platform || content.channel).toUpperCase();
  const { width, height } = dimensions(creative.aspect_ratio, content.content_type);
  const vertical = height > width;
  const arabicContent = hasArabic(title) || hasArabic(cta);

  if (arabicContent) {
    return new Response(arabicSocialSvg(title, width, height), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  }

  const root = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#2E2E2E",
        color: "#F5F1E8",
        padding: vertical ? "88px 76px" : "68px 70px",
        fontFamily: "sans-serif",
      },
    },
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column" } },
      createElement(
        "div",
        { style: { display: "flex", alignItems: "center" } },
        createElement("div", { style: { width: 64, height: 7, borderRadius: 12, backgroundColor: "#D4A017", marginRight: 18 } }),
        createElement("div", { style: { fontSize: vertical ? 32 : 27, color: "#D4A017", fontWeight: 700 } }, "MLAMH"),
      ),
      createElement("div", { style: { marginTop: 14, fontSize: vertical ? 22 : 18, color: "#B7B2AA" } }, platform || "TALENT & OPPORTUNITIES"),
    ),
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", width: "100%" } },
      createElement("div", { style: { fontSize: vertical ? 76 : 62, lineHeight: 1.3, fontWeight: 700 } }, title),
      createElement("div", { style: { width: 170, height: 8, borderRadius: 12, backgroundColor: "#D4A017", marginTop: 34 } }),
    ),
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", borderTop: "1px solid #5B5140", paddingTop: 28 } },
      createElement("div", { style: { fontSize: vertical ? 28 : 23 } }, cta),
      createElement("div", { style: { marginTop: 14, fontSize: vertical ? 26 : 22, color: "#D4A017", fontWeight: 700 } }, "mlamh.net"),
    ),
  );

  try {
    return new ImageResponse(root, {
      width,
      height,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("[MarketingCreativeImage] render failed", error instanceof Error ? error.message : "unknown");
    return new Response("Creative image render failed", { status: 500 });
  }
}
