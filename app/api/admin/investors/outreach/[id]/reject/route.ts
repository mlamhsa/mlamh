import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { rejectInvestorOutreach } from "@/lib/intelligence/investors/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await requireAdminAccess();
  const { id } = await params;
  const outreachId = Number(id);
  if (!Number.isInteger(outreachId) || outreachId <= 0) {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "reject_investor_outreach",
      outcome: "blocked",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: "invalid-input",
      reason: "invalid_outreach_id",
    });

    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }
  const payload = await request.json().catch(() => ({})) as { note?: unknown };
  const note = typeof payload.note === "string" ? payload.note : undefined;
  try {
    const result = await rejectInvestorOutreach({ outreachId, userId: user.id, note });

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "reject_investor_outreach",
      outcome: "success",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      metadata: {
        note_present:
          Boolean(note?.trim()),
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach rejection failed.";

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "reject_investor_outreach",
      outcome: "failed",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      reason: "outreach_rejection_failed",
    });

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
