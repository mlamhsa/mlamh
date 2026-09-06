import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getMobileTalentProfile } from "@/lib/talents/mobile-profile";
import { updateMobileTalentProfile } from "@/lib/talents/mobile-profile-update";

function getLocale(request: Request) {
  return new URL(request.url).searchParams.get("locale") === "en" ? "en" as const : "ar" as const;
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const result = await getMobileTalentProfile({ userId: auth.user.id, locale: getLocale(request) });
  if (!result.ok) return NextResponse.json(result, { status: result.code === "TALENT_NOT_FOUND" ? 404 : 500 });
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });

  const result = await updateMobileTalentProfile({ userId: auth.user.id, locale: getLocale(request), input });
  if (!result.ok) {
    const status = result.code === "INVALID_INPUT" ? 400 : result.code === "TALENT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
