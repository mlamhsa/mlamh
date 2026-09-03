import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createMobileGalleryUpload, finalizeMobileGalleryUpload } from "@/lib/talents/mobile-gallery";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: { mimeType?: unknown; size?: unknown } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  const result = await createMobileGalleryUpload({ userId: auth.user.id, mimeType: body.mimeType, size: body.size });
  if (!result.ok) {
    const status = result.code === "TALENT_NOT_FOUND" ? 404 : result.code === "LOOKUP_FAILED" || result.code === "SIGNED_URL_FAILED" ? 500 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: { path?: unknown } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  const result = await finalizeMobileGalleryUpload({ userId: auth.user.id, path: body.path });
  if (!result.ok) {
    const status = result.code === "TALENT_NOT_FOUND" || result.code === "UPLOAD_NOT_FOUND" ? 404 : result.code === "LOOKUP_FAILED" || result.code === "UPDATE_FAILED" ? 500 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
