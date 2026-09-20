import { NextResponse } from "next/server";

import { getSceneArticle } from "@/lib/scene/public-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const { slug } = await context.params;

  try {
    const article = await getSceneArticle(locale, slug);
    if (!article) {
      return NextResponse.json(
        { ok: false, code: "SCENE_ARTICLE_NOT_FOUND" },
        { status: 404 },
      );
    }
    return NextResponse.json({ locale, article });
  } catch (error) {
    console.error("[api.scene.article]", error);
    return NextResponse.json(
      { ok: false, code: "SCENE_ARTICLE_UNAVAILABLE" },
      { status: 500 },
    );
  }
}