import { NextResponse } from "next/server";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import {
  completeWhatsAppEmbeddedSignup,
  persistWhatsAppConnectionError,
} from "@/lib/marketing/channels/whatsapp";

export const runtime = "nodejs";

type CompletePayload = {
  code?: unknown;
  wabaId?: unknown;
  phoneNumberId?: unknown;
  displayPhoneNumber?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export async function POST(request: Request) {
  await requireMarketingAdminAccess("marketing.integrations.manage");
  const payload = await request.json().catch(() => null) as CompletePayload | null;
  const code = text(payload?.code);
  const wabaId = text(payload?.wabaId);
  const phoneNumberId = text(payload?.phoneNumberId);
  const displayPhoneNumber = text(payload?.displayPhoneNumber) || null;

  if (!code || !wabaId || !phoneNumberId) {
    return NextResponse.json({ ok: false, error: "incomplete_embedded_signup_result" }, { status: 400 });
  }

  try {
    await completeWhatsAppEmbeddedSignup({ code, wabaId, phoneNumberId, displayPhoneNumber });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await persistWhatsAppConnectionError(error).catch(() => undefined);
    return NextResponse.json({ ok: false, error: "whatsapp_connection_failed" }, { status: 400 });
  }
}
