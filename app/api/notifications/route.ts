import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getTalentNotifications } from "@/lib/notifications/talent-notifications";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const data = await getTalentNotifications(auth.user.id);
  return NextResponse.json(data);
}
