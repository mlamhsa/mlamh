import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getMobilePublisherProfile, submitMobilePublisherVerification } from "@/lib/publishers/mobile-profile";

function statusFor(code: string) {
  if (code === "UNAUTHENTICATED") return 401;
  if (code === "ACCOUNT_RESTRICTED") return 403;
  if (code === "NOT_PUBLISHER" || code === "PUBLISHER_NOT_FOUND") return 404;
  if (["INDIVIDUAL_NOT_ELIGIBLE", "PROFILE_NOT_APPROVED", "ALREADY_VERIFIED", "VERIFICATION_PENDING", "METHOD_NOT_AVAILABLE", "INVALID_COMPANY_EMAIL"].includes(code)) return 400;
  return 500;
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const result = await getMobilePublisherProfile(auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  const input = body as { method?: unknown; email?: unknown };
  const result = await submitMobilePublisherVerification(auth.user.id, input);
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
}
