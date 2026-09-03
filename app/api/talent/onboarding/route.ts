import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { completeMobileTalentOnboarding } from "@/lib/talents/mobile-onboarding";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }

  let payload: { talentType?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const result = await completeMobileTalentOnboarding(
    auth.user.id,
    auth.user.email,
    auth.user.user_metadata as Record<string, unknown> | null | undefined,
    payload.talentType,
  );

  if (!result.ok) {
    const status = result.code === "ACCOUNT_TYPE_CONFLICT" ? 409 : result.code === "INVALID_TALENT_TYPE" ? 400 : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
