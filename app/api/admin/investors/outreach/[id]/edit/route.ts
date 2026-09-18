import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { recordAdminAction } from "@/lib/events/admin-audit";
import { EVENT_TARGETS } from "@/lib/events/event-targets";
import { editPendingInvestorOutreach } from "@/lib/intelligence/investors/edit-outreach";

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
      action: "edit_investor_outreach",
      outcome: "blocked",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: "invalid-input",
      reason: "invalid_outreach_id",
    });

    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({})) as { subject?: unknown; bodyText?: unknown };
  if (typeof payload.subject !== "string" || typeof payload.bodyText !== "string") {
    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "edit_investor_outreach",
      outcome: "blocked",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      reason: "subject_and_body_required",
    });

    return NextResponse.json({ ok: false, error: "subject_and_body_required" }, { status: 400 });
  }

  try {
    const result = await editPendingInvestorOutreach({
      outreachId,
      userId: user.id,
      subject: payload.subject,
      bodyText: payload.bodyText,
    });

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "edit_investor_outreach",
      outcome: "success",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      metadata: {
        subject_length:
          payload.subject.length,
        body_length:
          payload.bodyText.length,
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach edit failed.";

    await recordAdminAction({
      actorId: user.id,
      actorEmail: user.email,
      action: "edit_investor_outreach",
      outcome: "failed",
      target: EVENT_TARGETS.INVESTOR_OUTREACH,
      targetId: outreachId,
      reason: "outreach_edit_failed",
    });

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
