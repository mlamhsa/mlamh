import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createMobileGalleryUpload, deleteMobileGalleryImage, finalizeMobileGalleryUpload, setMobileGalleryPrimary } from "@/lib/talents/mobile-gallery";

async function readBody(request: Request) {
  try { return await request.json() as Record<string, unknown>; } catch { return null; }
}

function errorStatus(code: string) {
  if (code === "TALENT_NOT_FOUND" || code === "UPLOAD_NOT_FOUND" || code === "IMAGE_NOT_FOUND") return 404;
  if (code === "LOOKUP_FAILED" || code === "SIGNED_URL_FAILED" || code === "UPDATE_FAILED") return 500;
  return 400;
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request); if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const body = await readBody(request); if (!body) return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  const result = await createMobileGalleryUpload({ userId: auth.user.id, mimeType: body.mimeType, size: body.size });
  return NextResponse.json(result, { status: result.ok ? 200 : errorStatus(result.code) });
}

export async function PUT(request: Request) {
  const auth = await getRequestUser(request); if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const body = await readBody(request); if (!body) return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  const result = await finalizeMobileGalleryUpload({ userId: auth.user.id, path: body.path });
  return NextResponse.json(result, { status: result.ok ? 200 : errorStatus(result.code) });
}

export async function PATCH(request: Request) {
  const auth = await getRequestUser(request); if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const body = await readBody(request); if (!body) return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  const result = await setMobileGalleryPrimary({ userId: auth.user.id, url: body.url });
  return NextResponse.json(result, { status: result.ok ? 200 : errorStatus(result.code) });
}

export async function DELETE(request: Request) {
  const auth = await getRequestUser(request); if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const body = await readBody(request); if (!body) return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  const result = await deleteMobileGalleryImage({ userId: auth.user.id, url: body.url });
  return NextResponse.json(result, { status: result.ok ? 200 : errorStatus(result.code) });
}
