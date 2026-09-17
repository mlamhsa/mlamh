import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { approveInvestorOutreach } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await requireAdminAccess();
  const { id } = await params;
  const outreachId = Number(id);
  if (!Number.isInteger(outreachId) || outreachId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }
  try {
    const result = await approveInvestorOutreach({ outreachId, userId: user.id });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach approval failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
