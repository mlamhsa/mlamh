import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createMobilePublisherOpportunityDraft } from "@/lib/publishers/mobile-opportunity-create";

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  const result = await createMobilePublisherOpportunityDraft(auth.user.id, body);
  if (!result.ok) {
    const status = result.code === "NOT_PUBLISHER" || result.code === "PUBLISHER_NOT_FOUND" ? 404 : result.code === "CREATE_FAILED" || result.code === "PUBLISHER_LOOKUP_FAILED" ? 500 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 201 });
}
