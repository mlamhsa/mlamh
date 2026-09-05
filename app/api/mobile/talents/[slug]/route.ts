import { NextResponse } from "next/server";

import { toMobilePublicTalent } from "@/lib/mobile/public-talent-contract";
import { getPublishedTalentBySlug } from "@/lib/supabase/public-talents";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  try {
    const talent = await getPublishedTalentBySlug(slug);
    if (!talent) {
      return NextResponse.json({ ok: false, code: "TALENT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: toMobilePublicTalent(talent, locale) });
  } catch (error) {
    console.error("[api/mobile/talents/slug]", error);
    return NextResponse.json({ ok: false, code: "TALENT_LOOKUP_FAILED" }, { status: 500 });
  }
}
