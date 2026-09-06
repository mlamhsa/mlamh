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

function dimensions(aspectRatio: string | null, contentType: string | null) {
  const ratio = (aspectRatio ?? "").toLowerCase();
  const type = (contentType ?? "").toLowerCase();
  if (ratio === "9:16" || type === "story" || type === "reel" || type === "video") {
    return { width: 1080, height: 1920 };
  }
  if (ratio === "1.91:1" || ratio === "1200:630") return { width: 1200, height: 630 };
  return { width: 1080, height: 1080 };
}

function brandedArabicFallback(requestUrl: string, platform: string, vertical: boolean) {
  const logoUrl = new URL("/logo.ar.png", requestUrl).toString();
  return createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#2E2E2E",
        color: "#F5F1E8",
        padding: vertical ? "92px 80px" : "72px 76px",
        fontFamily: "sans-serif",
      },
    },
    createElement(
      "div",
      { style: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" } },
      createElement("div", { style: { fontSize: vertical ? 24 : 20, color: "#B7B2AA", letterSpacing: 2 } }, platform || "SOCIAL"),
      createElement("div", { style: { width: 120, height: 7, borderRadius: 12, backgroundColor: "#D4A017" } }),
    ),
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } },
      createElement("img", {
        src: logoUrl,
        width: vertical ? 620 : 560,
        height: vertical ? 340 : 310,
        style: { objectFit: "contain", maxWidth: "82%" },
      }),
      createElement("div", { style: { marginTop: 34, width: 180, height: 8, borderRadius: 12, backgroundColor: "#D4A017" } }),
    ),
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", borderTop: "1px solid #5B5140", paddingTop: 28 } },
      createElement("div", { style: { fontSize: vertical ? 25 : 21, color: "#B7B2AA", letterSpacing: 1 } }, "TALENT & OPPORTUNITIES PLATFORM"),
      createElement("div", { style: { marginTop: 12, fontSize: vertical ? 34 : 28, color: "#D4A017", fontWeight: 700 } }, "mlamh.net"),
    ),
  );
}

export async function GET(request: Request, { params }: RouteContext) {
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

  const root = arabicContent
    ? brandedArabicFallback(request.url, platform, vertical)
    : createElement(
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
