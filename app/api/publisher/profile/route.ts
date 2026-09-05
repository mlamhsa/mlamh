import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import {
  getMobilePublisherProfile,
  submitMobilePublisherProfileForReview,
  updateMobilePublisherProfile,
  uploadMobilePublisherLogo,
} from "@/lib/publishers/mobile-profile";

function statusFor(code: string) {
  if (code === "UNAUTHENTICATED") return 401;
  if (code === "ACCOUNT_RESTRICTED") return 403;
  if (code === "NOT_PUBLISHER" || code === "PUBLISHER_NOT_FOUND") return 404;
  if (code === "PUBLISHER_TYPE_LOCKED") return 409;
  if (code === "PROFILE_INCOMPLETE" || code === "INVALID_PUBLISHER_TYPE" || code === "INVALID_IMAGE") return 400;
  return 500;
}

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const result = await getMobilePublisherProfile(auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
}

export async function PATCH(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  try {
    const result = await updateMobilePublisherProfile(auth.user.id, body as Record<string, unknown>);
    return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const result = await submitMobilePublisherProfileForReview(auth.user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
}

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const contentType = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  let bytes: ArrayBuffer;
  try { bytes = await request.arrayBuffer(); } catch { return NextResponse.json({ ok: false, code: "INVALID_IMAGE" }, { status: 400 }); }
  const result = await uploadMobilePublisherLogo(auth.user.id, bytes, contentType);
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
}
