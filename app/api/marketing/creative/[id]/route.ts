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
  const cta = text(content.cta) || "mlamh.net";
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
        background: "#2E2E2E",
        color: "#F5F1E8",
        padding: vertical ? "92px 84px" : "72px 76px",
        fontFamily: "Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      },
    },
    createElement("div", {
      style: {
        position: "absolute",
        width: vertical ? 620 : 520,
        height: vertical ? 620 : 520,
        border: "2px solid rgba(212,160,23,.18)",
        borderRadius: 999,
        top: vertical ? -180 : -220,
        left: -180,
      },
    }),
    createElement("div", {
      style: {
        position: "absolute",
        width: vertical ? 760 : 560,
        height: vertical ? 760 : 560,
        border: "1px solid rgba(245,241,232,.06)",
        borderRadius: 999,
        bottom: vertical ? -330 : -320,
        right: -220,
      },
    }),
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 18, zIndex: 2 } },
      createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 18 } },
        createElement("div", { style: { width: 58, height: 6, borderRadius: 99, background: "#D4A017" } }),
        createElement("div", { style: { fontSize: vertical ? 30 : 25, letterSpacing: 4, color: "#D4A017", fontWeight: 700 } }, "MLAMH"),
      ),
      createElement("div", { style: { fontSize: vertical ? 22 : 18, letterSpacing: 3, color: "rgba(245,241,232,.48)" } }, platform || "TALENT & OPPORTUNITIES"),
    ),
    createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: vertical ? 38 : 26, zIndex: 2, maxWidth: vertical ? 900 : 980 } },
      createElement("div", {
        style: {
          fontSize: vertical ? 78 : 64,
          lineHeight: 1.28,
          fontWeight: 700,
          direction: "rtl",
          textAlign: "right",
          letterSpacing: -1.5,
        },
      }, title),
      createElement("div", { style: { width: vertical ? 180 : 150, height: 8, borderRadius: 99, background: "#D4A017", alignSelf: "flex-end" } }),
    ),
    createElement(
      "div",
      { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28, zIndex: 2 } },
      createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 10 } },
        createElement("div", { style: { fontSize: vertical ? 24 : 19, color: "rgba(245,241,232,.52)" } }, "Talent & Opportunities Platform"),
        createElement("div", { style: { fontSize: vertical ? 30 : 24, color: "#D4A017", fontWeight: 700 } }, "mlamh.net"),
      ),
      createElement("div", {
        style: {
          maxWidth: vertical ? 520 : 620,
          padding: vertical ? "22px 30px" : "18px 26px",
          border: "1px solid rgba(212,160,23,.45)",
          borderRadius: 18,
          fontSize: vertical ? 30 : 24,
          direction: "rtl",
          textAlign: "right",
          color: "#F5F1E8",
        },
      }, cta),
    ),
  );

  return new ImageResponse(root, {
    width,
    height,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
