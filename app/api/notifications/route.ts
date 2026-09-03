import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getUserNotifications } from "@/lib/notifications/user-notifications";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const data = await getUserNotifications(auth.user.id);
  return NextResponse.json(data);
}
