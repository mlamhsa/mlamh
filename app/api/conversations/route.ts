import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getTalentConversations } from "@/lib/messages/talent-conversations";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const data = await getTalentConversations(auth.user.id);
  return NextResponse.json(data);
}
