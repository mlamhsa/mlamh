import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { submitMobileTalentProfileReview } from "@/lib/talents/mobile-review-submit";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const result = await submitMobileTalentProfileReview(auth.user.id, locale);

  if (!result.ok) {
    const status = result.code === "NOT_TALENT" ? 403 : result.code === "PROFILE_NOT_FOUND" || result.code === "TALENT_NOT_FOUND" ? 404 : result.code === "ALREADY_PENDING" || result.code === "ALREADY_APPROVED" ? 409 : result.code === "PROFILE_INCOMPLETE" || result.code === "MISSING_REQUIREMENTS" ? 422 : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
