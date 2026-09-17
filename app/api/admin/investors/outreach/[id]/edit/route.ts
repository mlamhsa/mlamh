import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { editPendingInvestorOutreach } from "@/lib/intelligence/investors/edit-outreach";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await requireAdminAccess();
  const { id } = await params;
  const outreachId = Number(id);
  if (!Number.isInteger(outreachId) || outreachId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_outreach_id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({})) as { subject?: unknown; bodyText?: unknown };
  if (typeof payload.subject !== "string" || typeof payload.bodyText !== "string") {
    return NextResponse.json({ ok: false, error: "subject_and_body_required" }, { status: 400 });
  }

  try {
    const result = await editPendingInvestorOutreach({
      outreachId,
      userId: user.id,
      subject: payload.subject,
      bodyText: payload.bodyText,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Outreach edit failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
