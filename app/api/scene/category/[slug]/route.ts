import { NextResponse } from "next/server";

import { getSceneCategory } from "@/lib/scene/public-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const { slug } = await context.params;

  try {
    const result = await getSceneCategory(locale, slug);
    if (!result) {
      return NextResponse.json(
        { ok: false, code: "SCENE_CATEGORY_NOT_FOUND" },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api.scene.category]", error);
    return NextResponse.json(
      { ok: false, code: "SCENE_CATEGORY_UNAVAILABLE" },
      { status: 500 },
    );
  }
}