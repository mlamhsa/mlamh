import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { rejectInvestorOutreach } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await requireAdminAccess();
  const { id } = await params;
  const outreachId = Number(id);
  if (!Number.isInteger(outreachId) || outreachId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }
  const payload = await request.json().catch(() => ({})) as { note?: unknown };
  const note = typeof payload.note === "string" ? payload.note : undefined;
  try {
    const result = await rejectInvestorOutreach({ outreachId, userId: user.id, note });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach rejection failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
