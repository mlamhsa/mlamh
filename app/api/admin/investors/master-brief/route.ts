import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { updateInvestorMasterBrief } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireAdminAccess();
  const payload = await request.json().catch(() => ({})) as { masterBrief?: unknown };
  if (typeof payload.masterBrief !== "string") {
    return NextResponse.json({ ok: false, error: "master_brief_required" }, { status: 400 });
  }
  try {
    await updateInvestorMasterBrief({ masterBrief: payload.masterBrief, userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Master investor brief update failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
