import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { completeMobilePublisherOnboarding } from "@/lib/publishers/mobile-onboarding";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });

  const result = await completeMobilePublisherOnboarding(auth.user.id, auth.user.email, auth.user.user_metadata, input as Record<string, unknown>);
  if (!result.ok) {
    const status = result.code === "ACCOUNT_TYPE_CONFLICT" ? 409 : result.code.startsWith("INVALID_") ? 400 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
