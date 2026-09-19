import { NextResponse } from "next/server";

import { toMobilePublicTalent } from "@/lib/mobile/public-talent-contract";
import { getFilteredPublicTalents } from "@/lib/talent/public-directory-filters";

const PUBLIC_READ_CACHE_CONTROL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize")) || 20, 1), 40);

  try {
    const result = await getFilteredPublicTalents({
      page,
      pageSize,
      search: url.searchParams.get("q") || undefined,
      category: url.searchParams.get("category") || undefined,
      city: url.searchParams.get("city") || undefined,
      gender: url.searchParams.get("gender") || undefined,
      nationality: url.searchParams.get("nationality") || undefined,
      ageMin: url.searchParams.get("ageMin") || undefined,
      ageMax: url.searchParams.get("ageMax") || undefined,
      heightMin: url.searchParams.get("heightMin") || undefined,
      heightMax: url.searchParams.get("heightMax") || undefined,
      language: url.searchParams.get("language") || undefined,
      dialect: url.searchParams.get("dialect") || undefined,
      skill: url.searchParams.get("skill") || undefined,
      availability: url.searchParams.get("availability") || undefined,
      readyToTravel: url.searchParams.get("readyToTravel") || undefined,
    });

    const response = NextResponse.json({
      ok: true,
      items: result.talents.map((talent) => toMobilePublicTalent(talent, locale)),
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
    });
    response.headers.set("Cache-Control", PUBLIC_READ_CACHE_CONTROL);
    return response;
  } catch (error) {
    console.error("[api/mobile/talents]", error);
    return NextResponse.json({ ok: false, code: "TALENT_DIRECTORY_FAILED" }, { status: 500 });
  }
}
