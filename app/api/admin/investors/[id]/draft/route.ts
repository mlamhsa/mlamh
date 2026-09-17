import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { generateInvestorOutreachDraft } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  await requireAdminAccess();
  const { id } = await params;
  const investorId = Number(id);
  if (!Number.isInteger(investorId) || investorId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_investor_id" }, { status: 400 });
  }
  try {
    const result = await generateInvestorOutreachDraft(investorId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach draft failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
