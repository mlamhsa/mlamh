import { createElement } from "react";
import { ImageResponse } from "next/og";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const ARABIC_FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansarabic/NotoSansArabic%5Bwdth%2Cwght%5D.ttf";
let arabicFontPromise: Promise<ArrayBuffer> | null = null;

function loadArabicFont() {
  if (!arabicFontPromise) {
    arabicFontPromise = fetch(ARABIC_FONT_URL).then(async (response) => {
      if (!response.ok) throw new Error(`Arabic font fetch failed: ${response.status}`);
      return response.arrayBuffer();
    });
  }
  return arabicFontPromise;
}

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

function brandedArabicTemplate(hook: string, vertical: boolean) {
  const logoUrl = "https://mlamh.net/logo.ar.png";
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
        backgroundColor: "#1C1B19",
        color: "#F5F1E8",
        padding: vertical ? "108px 88px" : "76px 80px",
        fontFamily: "Noto Sans Arabic",
      },
    },
    createElement(
      "div",
      { style: { width: "100%", display: "flex", justifyContent: "flex-end" } },
      createElement("div", { style: { width: vertical ? 150 : 120, height: 7, borderRadius: 12, backgroundColor: "#D4A017" } }),
    ),
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } },
      createElement("img", {
        src: logoUrl,
        width: vertical ? 560 : 500,
        height: vertical ? 300 : 270,
        style: { objectFit: "contain", maxWidth: "80%" },
      }),
      createElement(
        "div",
        {
          dir: "rtl",
          style: {
            width: "92%",
            marginTop: vertical ? 38 : 26,
            fontSize: vertical ? 78 : 64,
            lineHeight: 1.42,
            fontWeight: 700,
            textAlign: "center",
            color: "#F5F1E8",
          },
        },
        hook || "فرصتك القادمة تبدأ من هنا",
      ),
      createElement("div", { style: { marginTop: vertical ? 38 : 28, width: 150, height: 7, borderRadius: 12, backgroundColor: "#D4A017" } }),
    ),
    createElement(
      "div",
      { style: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center" } },
      createElement("div", { style: { fontSize: vertical ? 36 : 30, color: "#D4A017", fontWeight: 700, letterSpacing: 1 } }, "mlamh.net"),
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

  try {
    const arabicFontData = arabicContent ? await loadArabicFont() : null;
    const root = arabicContent
      ? brandedArabicTemplate(title, vertical)
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

    return new ImageResponse(root, {
      width,
      height,
      fonts: arabicFontData
        ? [{ name: "Noto Sans Arabic", data: arabicFontData, weight: 700, style: "normal" }]
        : undefined,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (error) {
    console.error("[MarketingCreativeImage] render failed", error instanceof Error ? error.message : "unknown");
    return new Response("Creative image render failed", { status: 500 });
  }
}
