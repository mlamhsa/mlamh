import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { assertApprovedInvestorGmail } from "@/lib/intelligence/investors/account-policy";
import { getInvestorGmailConnectionState } from "@/lib/intelligence/investors/gmail";
import { sendApprovedInvestorOutreach } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await requireAdminAccess();
  const { id } = await params;
  const outreachId = Number(id);
  if (!Number.isInteger(outreachId) || outreachId <= 0) {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "send_investor_outreach",
      outcome: "blocked",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: "invalid-input",
      reason: "invalid_outreach_id",
    });

    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }
  try {
    const gmail = await getInvestorGmailConnectionState();
    if (gmail.status !== "connected") throw new Error("Investor Gmail is not connected.");
    assertApprovedInvestorGmail(gmail.emailAddress);
    const result = await sendApprovedInvestorOutreach({ outreachId, userId: user.id });

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "send_investor_outreach",
      outcome: "success",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      metadata: {
        gmail_connected:
          true,
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Investor Gmail send failed.";

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "send_investor_outreach",
      outcome: "failed",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      reason: "investor_outreach_send_failed",
    });

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
