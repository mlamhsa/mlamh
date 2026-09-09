import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { toMobilePublicTalent } from "@/lib/mobile/public-talent-contract";
import { getFilteredPublicTalents } from "@/lib/talent/public-directory-filters";
import { publicTalentAccessPayload, resolveTalentAccess } from "@/lib/talent/trust-access";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const auth = await getRequestUser(request).catch(() => null);
  const access = await resolveTalentAccess(auth?.ok ? auth.user.id : null);
  const requestedPageSize = Number(url.searchParams.get("pageSize")) || 12;
  const pageSize = Math.min(Math.max(requestedPageSize, 1), access.maxDirectoryPageSize);

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

    return NextResponse.json({
      ok: true,
      items: result.talents.map((talent) => toMobilePublicTalent(talent, locale)),
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      pageSize: result.pageSize,
      access: publicTalentAccessPayload(access),
    }, {
      headers: {
        "Cache-Control": access.authenticated ? "private, no-store" : "public, max-age=30, stale-while-revalidate=60",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[api/mobile/talents]", error);
    return NextResponse.json({ ok: false, code: "TALENT_DIRECTORY_FAILED" }, { status: 500 });
  }
}
