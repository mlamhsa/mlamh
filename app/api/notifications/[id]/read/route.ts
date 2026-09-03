import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { markTalentNotificationRead } from "@/lib/notifications/talent-notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const notificationId = Number(id);

  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return NextResponse.json(
      { ok: false, code: "INVALID_NOTIFICATION" },
      { status: 400 },
    );
  }

  const result = await markTalentNotificationRead(auth.user.id, notificationId);

  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.code === "NOT_FOUND" ? 404 : 500,
    });
  }

  return NextResponse.json(result);
}
