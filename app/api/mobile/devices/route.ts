import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { registerMobilePushDevice, unregisterMobilePushDevice } from "@/lib/mobile/push-devices";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  const result = await registerMobilePushDevice(auth.user.id, body);
  return NextResponse.json(result, { status: result.ok ? 200 : result.code === "REGISTER_FAILED" ? 500 : 400 });
}

export async function DELETE(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  const result = await unregisterMobilePushDevice(auth.user.id, body.expoPushToken);
  return NextResponse.json(result, { status: result.ok ? 200 : result.code === "UNREGISTER_FAILED" ? 500 : 400 });
}
