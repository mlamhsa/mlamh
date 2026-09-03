import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getMobileTalentProfile } from "@/lib/talents/mobile-profile";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const result = await getMobileTalentProfile({ userId: auth.user.id, locale });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.code === "TALENT_NOT_FOUND" ? 404 : 500 });
  }
  return NextResponse.json(result);
}
