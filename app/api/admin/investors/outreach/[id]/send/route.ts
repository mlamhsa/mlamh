import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { sendApprovedInvestorOutreach } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await requireAdminAccess();
  const { id } = await params;
  const outreachId = Number(id);
  if (!Number.isInteger(outreachId) || outreachId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }
  try {
    const result = await sendApprovedInvestorOutreach({ outreachId, userId: user.id });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Investor Gmail send failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
