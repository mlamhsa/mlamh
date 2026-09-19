import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { updateInvestorMasterBrief } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireAdminAccess();
  const payload = await request.json().catch(() => ({})) as { masterBriefAr?: unknown; masterBriefEn?: unknown };
  if (typeof payload.masterBriefAr !== "string" || typeof payload.masterBriefEn !== "string") {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "update_investor_master_brief",
      outcome: "blocked",
      target: EVENT_TARGETS.INVESTOR,
      targetId: "master-brief",
      reason: "master_brief_ar_and_en_required",
    });

    return NextResponse.json({ ok: false, error: "master_brief_ar_and_en_required" }, { status: 400 });
  }
  try {
    await updateInvestorMasterBrief({ masterBriefAr: payload.masterBriefAr, masterBriefEn: payload.masterBriefEn, userId: user.id });

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "update_investor_master_brief",
      outcome: "success",
      target: EVENT_TARGETS.INVESTOR,
      targetId: "master-brief",
      metadata: {
        ar_length:
          payload.masterBriefAr.length,
        en_length:
          payload.masterBriefEn.length,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Master investor brief update failed.";

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "update_investor_master_brief",
      outcome: "failed",
      target: EVENT_TARGETS.INVESTOR,
      targetId: "master-brief",
      reason: "master_brief_update_failed",
    });

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
