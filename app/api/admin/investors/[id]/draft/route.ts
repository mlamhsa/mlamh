import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { generateInvestorOutreachDraft } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const adminUser =
    await requireAdminAccess();
  const { id } = await params;
  const investorId = Number(id);
  if (!Number.isInteger(investorId) || investorId <= 0) {
    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "generate_investor_outreach_draft",
      outcome: "blocked",
      target: EVENT_TARGETS.INVESTOR,
      targetId: "invalid-input",
      reason: "invalid_investor_id",
    });

    return NextResponse.json({ ok: false, error: "invalid_investor_id" }, { status: 400 });
  }
  try {
    const result = await generateInvestorOutreachDraft(investorId);

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "generate_investor_outreach_draft",
      outcome: "success",
      target: EVENT_TARGETS.INVESTOR,
      targetId: investorId,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach draft failed.";

    await recordAdminAction({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      action: "generate_investor_outreach_draft",
      outcome: "failed",
      target: EVENT_TARGETS.INVESTOR,
      targetId: investorId,
      reason: "investor_outreach_draft_failed",
    });

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
