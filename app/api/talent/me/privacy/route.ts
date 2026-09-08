import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getTalentPrivacySettings, updateTalentPrivacySettings } from "@/lib/talents/privacy";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const result = await getTalentPrivacySettings(auth.user.id);
  if (!result.ok) {
    const status = result.code === "TALENT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let input: unknown;
  try { input = await request.json(); }
  catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }

  const result = await updateTalentPrivacySettings(auth.user.id, input, "user");
  if (!result.ok) {
    const status = result.code === "INVALID_INPUT" ? 400 : result.code === "TALENT_NOT_FOUND" ? 404 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
