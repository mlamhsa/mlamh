import { NextResponse } from "next/server";

import { searchScene } from "@/lib/scene/public-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const query = String(url.searchParams.get("q") ?? "");

  try {
    return NextResponse.json(await searchScene(locale, query));
  } catch (error) {
    console.error("[api.scene.search]", error);
    return NextResponse.json(
      { ok: false, code: "SCENE_SEARCH_UNAVAILABLE" },
      { status: 500 },
    );
  }
}
