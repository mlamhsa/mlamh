import { createElement } from "react";
import { ImageResponse } from "next/og";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
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

  const title = text(content.hook) || text(content.title) || "موهبتك تستحق فرصة واضحة";
  const cta = text(content.cta) || "اكتشف الفرص على mlamh.net";
  const platform = text(creative.platform || content.channel).toUpperCase();
  const { width, height } = dimensions(creative.aspect_ratio, content.content_type);
  const vertical = height > width;

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
      { style: { display: "flex", flexDirection: "column", width: "100%", direction: "rtl", textAlign: "right" } },
      createElement("div", { style: { fontSize: vertical ? 76 : 62, lineHeight: 1.3, fontWeight: 700 } }, title),
      createElement("div", { style: { width: 170, height: 8, borderRadius: 12, backgroundColor: "#D4A017", marginTop: 34, marginLeft: "auto" } }),
    ),
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", borderTop: "1px solid #5B5140", paddingTop: 28 } },
      createElement("div", { style: { fontSize: vertical ? 28 : 23, direction: "rtl", textAlign: "right" } }, cta),
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
