import { NextResponse } from "next/server";

import { getSceneFeed } from "@/lib/scene/public-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  try {
    return NextResponse.json(await getSceneFeed(locale));
  } catch (error) {
    console.error("[api.scene.feed]", error);
    return NextResponse.json(
      { ok: false, code: "SCENE_FEED_UNAVAILABLE" },
      { status: 500 },
    );
  }
}